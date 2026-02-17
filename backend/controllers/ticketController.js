const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User');
const crypto = require('crypto');
const ics = require('ics');

// Generate unique Ticket ID
const generateTicketId = () => {
    return 'TKT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
};

/*
 * @desc    Register for an Event (Normal or Merchandise)
 * @route   POST /api/tickets
 * @access  Private/Participant
 */
const registerForEvent = async (req, res) => {
    try {
        const { eventId, formResponses, purchaseData } = req.body;
        const userId = req.user._id;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // 1. Check if Event is Open
        if (event.status !== 'published' && event.status !== 'ongoing') {
            return res.status(400).json({ message: 'Event is not open for registration' });
        }

        // 2. Check Dates / Deadline
        const now = new Date();
        if (event.registrationDeadline && now > event.registrationDeadline) {
            return res.status(400).json({ message: 'Registration deadline has passed' });
        }

        // 3. Check Duplicate Registration
        const existingTicket = await Ticket.findOne({ participantId: userId, eventId: eventId, status: { $ne: 'cancelled' } });
        if (existingTicket) {
            return res.status(400).json({ message: 'You are already registered/purchased for this event' });
        }

        // 4. Check Limits / Stock
        if (event.type === 'normal') {
            if (event.registrationLimit > 0 && event.registeredCount >= event.registrationLimit) {
                return res.status(400).json({ message: 'Registration full' });
            }
        } else if (event.type === 'merchandise') {
            if (event.merchandiseStock !== undefined && event.merchandiseStock <= 0) {
                return res.status(400).json({ message: 'Out of stock' });
            }
        }

        // 5. Validate Required Form Fields
        if (event.formSchema && event.formSchema.length > 0) {
            const missingFields = [];
            event.formSchema.forEach(field => {
                if (field.required) {
                    const response = formResponses ? formResponses[field.label] : undefined;
                    if (response === undefined || response === '' || (Array.isArray(response) && response.length === 0)) {
                        missingFields.push(field.label);
                    }
                }
            });

            if (missingFields.length > 0) {
                return res.status(400).json({
                    message: `Please fill required fields: ${missingFields.join(', ')}`,
                    missingFields
                });
            }
        }

        const isPaid = event.registrationFee > 0 || event.type === 'merchandise';

        // 5. Create Ticket
        const newTicket = new Ticket({
            ticketId: generateTicketId(),
            participantId: userId,
            eventId: eventId,
            status: isPaid ? 'pending' : 'registered',
            // Only generate QR if free. For paid, generate after approval.
            qrCodeData: isPaid ? '' : `EVENT:${eventId}-USER:${userId}`,
            paymentStatus: isPaid ? 'pending' : 'free',
            responses: formResponses || {},
            purchaseData: purchaseData || {}
        });

        await newTicket.save();

        // 6. Update Event Counts (Normal only)
        // Stock for merchandise is decremented ON APPROVAL
        if (event.type === 'normal') {
            event.registeredCount += 1;
            await event.save();
        }

        // 7. Email Workflow (Placeholder/Mock)
        console.log(`[EMAIL] Sending confirmation to ${req.user.email} for Ticket ID: ${newTicket.ticketId}`);

        res.status(201).json({
            message: event.type === 'merchandise' ? 'Order placed. Please upload payment proof.' : 'Registration successful',
            ticket: newTicket
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Get My Tickets (Dashboard)
 * @route   GET /api/tickets/my-tickets
 * @access  Private/Participant
 */
const getMyTickets = async (req, res) => {
    try {
        console.log(`[DEBUG] Fetching tickets for user: ${req.user._id}`);
        const tickets = await Ticket.find({ participantId: req.user._id })
            .populate({
                path: 'eventId',
                select: 'name type startDate endDate organizer status registrationFee',
                populate: {
                    path: 'organizer',
                    select: 'organizerName'
                }
            })
            .sort({ createdAt: -1 });

        console.log(`[DEBUG] Found ${tickets.length} tickets`);
        res.json(tickets);
    } catch (error) {
        console.error("[DEBUG] Error fetching tickets:", error.message);
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Cancel Ticket
 * @route   PUT /api/tickets/:id/cancel
 * @access  Private/Participant
 */
const cancelTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.participantId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (ticket.status === 'cancelled') {
            return res.status(400).json({ message: 'Ticket already cancelled' });
        }

        // Check if it's already completed
        if (ticket.paymentStatus === 'completed') {
            return res.status(400).json({ message: 'Cannot cancel an approved/completed ticket' });
        }

        // Update Ticket
        ticket.status = 'cancelled';
        await ticket.save();

        // Restore Event Counts (Normal only, Merch stock wasn't dec yet unless approved)
        const event = await Event.findById(ticket.eventId);
        if (event && event.type === 'normal') {
            event.registeredCount = Math.max(0, event.registeredCount - 1);
            await event.save();
        }

        res.json({ message: 'Ticket cancelled successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Get Participants for an Event (Organizer)
 * @route   GET /api/tickets/event/:eventId
 * @access  Private/Organizer
 */
const getEventParticipants = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await Event.findById(eventId);

        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const tickets = await Ticket.find({ eventId })
            .populate('participantId', 'firstName lastName email contactNumber')
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Upload Payment Proof (Participant)
 * @route   POST /api/tickets/:id/payment-proof
 * @access  Private/Participant
 */
const uploadPaymentProof = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        if (ticket.participantId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        ticket.paymentProof = `/uploads/${req.file.filename}`;
        ticket.paymentStatus = 'pending_approval';
        await ticket.save();

        res.json({ message: 'Payment proof uploaded, awaiting approval', ticket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Approve Merch Order (Organizer)
 * @route   PUT /api/tickets/:id/approve
 * @access  Private/Organizer
 */
const approveOrder = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate('eventId');
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const event = ticket.eventId;
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (ticket.paymentStatus === 'completed') {
            return res.status(400).json({ message: 'Order already approved' });
        }

        // Decrement Stock ATOMICALLY for merchandise
        if (event.type === 'merchandise') {
            if (event.merchandiseStock <= 0) {
                return res.status(400).json({ message: 'Stock exhausted, cannot approve.' });
            }
            event.merchandiseStock = Math.max(0, event.merchandiseStock - 1);
            await event.save();
        }

        ticket.paymentStatus = 'completed';
        ticket.status = 'Successful';
        // Generate QR on approval
        ticket.qrCodeData = `EVENT:${event._id}-USER:${ticket.participantId}-TKT:${ticket.ticketId}`;

        await ticket.save();

        console.log(`[EMAIL] Sending confirmation with QR to participant for Ticket ID: ${ticket.ticketId}`);

        res.json({ message: 'Order approved successfully', ticket });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Reject Merch Order (Organizer)
 * @route   PUT /api/tickets/:id/reject
 * @access  Private/Organizer
 */
const rejectOrder = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate('eventId');
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const event = ticket.eventId;
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        ticket.paymentStatus = 'rejected';
        ticket.status = 'cancelled';
        await ticket.save();

        console.log(`[EMAIL] Notifying participant about payment rejection for Ticket ID: ${ticket.ticketId}`);

        res.json({ message: 'Order rejected', ticket });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Scan Ticket (Organizer)
 * @route   POST /api/tickets/scan
 * @access  Private/Organizer
 */
const scanTicket = async (req, res) => {
    try {
        const { qrPayload, manualTicketId, eventId } = req.body;
        let ticket;

        // Find Ticket
        if (manualTicketId) {
            ticket = await Ticket.findOne({ ticketId: manualTicketId }).populate('eventId participantId');
        } else if (qrPayload) {
            const parts = qrPayload.split('-TKT:');
            if (parts.length > 1) {
                const tId = parts[1];
                ticket = await Ticket.findOne({ ticketId: tId }).populate('eventId participantId');
            } else {
                ticket = await Ticket.findOne({ qrCodeData: qrPayload }).populate('eventId participantId');
            }
        }

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        // Verify Event Ownership
        if (ticket.eventId.organizer.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Ticket does not belong to your events' });
        }

        // Verify it belongs to the SPECIFIC event being scanned
        if (eventId && ticket.eventId._id.toString() !== eventId) {
            return res.status(400).json({ success: false, message: 'Ticket is for a different event' });
        }

        // Check if Paid (if merch) or Approved
        if ((ticket.eventId.type === 'merchandise' || ticket.eventId.registrationFee > 0) && ticket.paymentStatus !== 'completed') {
            return res.status(400).json({ success: false, message: 'Payment pending/rejected', ticket });
        }

        // Check Attendance
        if (ticket.scannedAt) {
            return res.status(400).json({
                success: false,
                message: 'Already Scanned',
                scannedAt: ticket.scannedAt,
                participant: ticket.participantId
            });
        }

        // Mark Attendance
        ticket.scannedAt = new Date();
        ticket.scannedBy = req.user._id;
        ticket.status = 'attended'; // Optional update status
        await ticket.save();

        res.json({
            success: true,
            message: 'Verified Successfully',
            participant: ticket.participantId
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/*
 * @desc    Get Pending Verifications (Organizer)
 * @route   GET /api/tickets/organizer/pending
 * @access  Private/Organizer
 */
const getPendingVerifications = async (req, res) => {
    try {
        // Find all events by this organizer
        const events = await Event.find({ organizer: req.user._id });
        const eventIds = events.map(e => e._id);

        // Find tickets for these events with pending_approval status
        const tickets = await Ticket.find({
            eventId: { $in: eventIds },
            paymentStatus: { $in: ['pending_approval', 'rejected'] } // Optionally show rejected too for reference
        })
            .populate({
                path: 'eventId',
                select: 'name type registrationFee'
            })
            .populate({
                path: 'participantId',
                select: 'firstName lastName email'
            })
            .sort({ updatedAt: -1 });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Export Attendance CSV
 * @route   GET /api/tickets/event/:eventId/export
 * @access  Private/Organizer
 */
const exportAttendanceCSV = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const tickets = await Ticket.find({ eventId })
            .populate('participantId', 'firstName lastName email')
            .sort({ scannedAt: -1 });

        let csv = 'TicketID,FirstName,LastName,Email,RegistrationStatus,PaymentStatus,Attended,ScannedAt\n';
        tickets.forEach(t => {
            csv += `${t.ticketId},${t.participantId?.firstName || ''},${t.participantId?.lastName || ''},${t.participantId?.email || ''},${t.status},${t.paymentStatus},${t.scannedAt ? 'Yes' : 'No'},${t.scannedAt ? t.scannedAt.toISOString() : ''}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=attendance-${eventId}.csv`);
        res.status(200).send(csv);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const checkRegistration = async (req, res) => {
    try {
        const { eventId } = req.params;
        const ticket = await Ticket.findOne({ eventId, participantId: req.user._id });
        res.json({ isRegistered: !!ticket, ticket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Export Tickets to ICS format
 * @route   GET /api/tickets/export-ics
 * @access  Private/Participant
 */
const exportTicketsICS = async (req, res) => {
    try {
        const { ids } = req.query;
        if (!ids) return res.status(400).json({ message: 'Ticket IDs are required' });

        const ticketIds = ids.split(',');
        const tickets = await Ticket.find({
            _id: { $in: ticketIds },
            participantId: req.user._id
        }).populate('eventId');

        if (tickets.length === 0) return res.status(404).json({ message: 'No tickets found' });

        const icsEvents = tickets.map(ticket => {
            const event = ticket.eventId;
            const start = new Date(event.startDate);
            const end = new Date(event.endDate || new Date(start.getTime() + 2 * 60 * 60 * 1000));

            return {
                start: [start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate(), start.getUTCHours(), start.getUTCMinutes()],
                end: [end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate(), end.getUTCHours(), end.getUTCMinutes()],
                title: event.name,
                description: event.description,
                location: event.location || 'Main Campus',
                url: `${req.protocol}://${req.get('host')}/events/${event._id}`,
                status: 'CONFIRMED',
                busyStatus: 'BUSY',
                alarms: [
                    { action: 'display', description: 'Reminder', trigger: { minutes: 30, before: true } }
                ]
            };
        });

        const { error, value } = ics.createEvents(icsEvents);

        if (error) {
            console.error("Error generating ICS:", error);
            return res.status(500).json({ message: 'Error generating calendar file' });
        }

        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', `attachment; filename=events.ics`);
        res.status(200).send(value);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Get Calendar Integration Links
 * @route   GET /api/tickets/:id/calendar-links
 * @access  Private/Participant
 */
const getCalendarLinks = async (req, res) => {
    try {
        const ticket = await Ticket.findOne({
            _id: req.params.id,
            participantId: req.user._id
        }).populate('eventId');

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const event = ticket.eventId;
        const start = new Date(event.startDate);
        const end = new Date(event.endDate || new Date(start.getTime() + 2 * 60 * 60 * 1000));
        const location = event.location || 'Main Campus';

        const formatDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${formatDate(start)}/${formatDate(end)}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(location)}`;

        const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${start.toISOString()}&enddt=${end.toISOString()}&subject=${encodeURIComponent(event.name)}&body=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(location)}`;

        res.json({ google: googleUrl, outlook: outlookUrl });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerForEvent,
    getMyTickets,
    cancelTicket,
    getEventParticipants,
    uploadPaymentProof,
    approveOrder,
    rejectOrder,
    scanTicket,
    getPendingVerifications,
    exportAttendanceCSV,
    checkRegistration,
    exportTicketsICS,
    getCalendarLinks
};
