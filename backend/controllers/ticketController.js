const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User');
const crypto = require('crypto');
const ics = require('ics');
const QRCode = require('qrcode');
const cloudinary = require('../config/cloudinary');
const sendEmail = require('../utils/sendEmail');

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
        if (event.endDate && now > event.endDate) {
            return res.status(400).json({ message: 'Event has already ended' });
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
            const quantity = purchaseData?.quantity || 1;
            const limit = event.purchaseLimit || 1;

            if (quantity > limit) {
                return res.status(400).json({ message: `Purchase limit for this item is ${limit}` });
            }

            if (event.merchandiseStock !== undefined && event.merchandiseStock < quantity) {
                return res.status(400).json({ message: `Not enough stock. Available: ${event.merchandiseStock}` });
            }
        }

        // 5. Validate Required Form Fields (Only for Normal events or if merch has form)
        if (event.type === 'normal' && event.formSchema && event.formSchema.length > 0) {
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
        const isMerch = event.type === 'merchandise';

        // 6. Create Ticket
        // Merch orders start as 'pending_payment' — participant must upload proof
        // Normal paid events start as 'pending' — organizer reviews form responses
        const ticketId = generateTicketId();
        const newTicket = new Ticket({
            ticketId: ticketId,
            participantId: userId,
            eventId: eventId,
            status: isMerch ? 'pending_payment' : 'pending',
            qrCodeData: '', // QR only generated on approval
            paymentStatus: isMerch ? 'pending' : (isPaid ? 'pending' : 'free'),
            responses: formResponses || {},
            purchaseData: {
                quantity: purchaseData?.quantity || 1,
                variants: purchaseData?.variants || {},
                variant: purchaseData?.variant || ''
            }
        });

        // 7. Update counts — stock is only decremented on payment approval for merch
        if (!isMerch && event.type === 'normal') {
            if (event.registrationLimit > 0) {
                const updatedEvent = await Event.findOneAndUpdate(
                    { _id: eventId, registeredCount: { $lt: event.registrationLimit } },
                    { $inc: { registeredCount: 1 } },
                    { new: true }
                );
                if (!updatedEvent) {
                    return res.status(400).json({ message: 'Registration full' });
                }
            } else {
                await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });
            }
        }

        await newTicket.save();

        // Send registration confirmation email
        try {
            const participant = await User.findById(userId);
            if (participant) {
                const emailHtml = isMerch ? `
                    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
                        <div style="background:linear-gradient(135deg,#6d28d9,#7c3aed);padding:24px;border-radius:16px 16px 0 0;text-align:center">
                            <h1 style="color:white;margin:0;font-size:1.4rem">📦 Order Placed!</h1>
                        </div>
                        <div style="background:white;padding:24px;border-radius:0 0 16px 16px;border:1px solid #e5e7eb">
                            <h2 style="color:#111827;margin:0 0 8px">${event.name}</h2>
                            <p style="color:#6b7280;margin:0 0 16px">Your order has been placed successfully.</p>
                            <div style="background:#fffbeb;border:1.5px solid #fcd34d;border-radius:10px;padding:12px 16px;margin-bottom:16px">
                                <p style="margin:0;font-weight:bold;color:#92400e;font-size:0.85rem">⏳ Next Step: Upload Payment Proof</p>
                                <p style="margin:4px 0 0;color:#b45309;font-size:0.8rem">Please log in to your dashboard and upload a screenshot of your payment.</p>
                            </div>
                            <p style="color:#9ca3af;font-size:0.8rem;margin:0"><strong>Ticket ID:</strong> ${ticketId}</p>
                        </div>
                    </div>
                ` : `
                    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
                        <div style="background:linear-gradient(135deg,#6d28d9,#7c3aed);padding:24px;border-radius:16px 16px 0 0;text-align:center">
                            <h1 style="color:white;margin:0;font-size:1.4rem">🎫 Registration Submitted!</h1>
                        </div>
                        <div style="background:white;padding:24px;border-radius:0 0 16px 16px;border:1px solid #e5e7eb">
                            <h2 style="color:#111827;margin:0 0 8px">${event.name}</h2>
                            <p style="color:#6b7280;margin:0 0 16px">Your registration has been submitted successfully.</p>
                            <div style="background:#fffbeb;border:1.5px solid #fcd34d;border-radius:10px;padding:12px 16px;margin-bottom:16px">
                                <p style="margin:0;font-weight:bold;color:#92400e;font-size:0.85rem">⏳ Awaiting Organizer Approval</p>
                                <p style="margin:4px 0 0;color:#b45309;font-size:0.8rem">You'll receive an email once the organizer reviews your registration.</p>
                            </div>
                            <p style="color:#9ca3af;font-size:0.8rem;margin:0"><strong>Ticket ID:</strong> ${ticketId}</p>
                            ${isPaid ? '<p style="color:#9ca3af;font-size:0.8rem;margin:4px 0 0"><strong>Fee:</strong> ₹' + event.registrationFee + '</p>' : ''}
                        </div>
                    </div>
                `;

                await sendEmail({
                    email: participant.email,
                    subject: isMerch ? `📦 Order Placed — ${event.name}` : `🎫 Registration Submitted — ${event.name}`,
                    message: emailHtml
                });
            }
        } catch (emailErr) {
            console.error('Registration email error (non-critical):', emailErr.message);
        }

        res.status(201).json({
            message: isMerch
                ? 'Order placed! Please upload your payment proof to complete the purchase.'
                : 'Registration submitted! Awaiting organizer approval.',
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
            await Event.updateOne(
                { _id: event._id, registeredCount: { $gt: 0 } },
                { $inc: { registeredCount: -1 } }
            );
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
            .populate('eventId', 'name type registrationFee')
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
        const ticket = await Ticket.findById(req.params.id).populate('eventId');

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        if (ticket.participantId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        if (ticket.paymentStatus === 'completed') {
            return res.status(400).json({ message: 'Order already approved' });
        }

        // Upload to Cloudinary
        const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const uploadResponse = await cloudinary.uploader.upload(fileBase64, {
            folder: 'payment_proofs',
        });

        ticket.paymentProof = uploadResponse.secure_url;
        ticket.paymentStatus = 'pending_approval';
        ticket.status = 'pending_payment';
        await ticket.save();

        // Notify organizer (optional — non-blocking)
        try {
            const event = ticket.eventId;
            const organizer = await User.findById(event.organizer);
            if (organizer) {
                await sendEmail({
                    email: organizer.email,
                    subject: `Payment Proof Submitted — ${event.name}`,
                    message: `
                        <h2>New Payment Proof Submitted</h2>
                        <p>A participant has uploaded payment proof for <strong>${event.name}</strong>.</p>
                        <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
                        <p>Please log in to your dashboard to review and approve or reject the payment.</p>
                    `
                });
            }
        } catch (_) { /* non-critical */ }

        res.json({ message: 'Payment proof uploaded! Awaiting organizer approval.', ticket });
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

        // Decrement stock for merchandise
        if (event.type === 'merchandise') {
            const quantity = ticket.purchaseData?.quantity || 1;
            const updatedEvent = await Event.findOneAndUpdate(
                { _id: event._id, merchandiseStock: { $gte: quantity } },
                { $inc: { merchandiseStock: -quantity } },
                { new: true }
            );
            if (!updatedEvent) {
                return res.status(400).json({ message: 'Stock exhausted, cannot approve.' });
            }
        }

        ticket.paymentStatus = 'completed';
        ticket.status = 'Approved';
        ticket.qrCodeData = ticket.ticketId; // QR payload = ticketId
        await ticket.save();

        // Generate QR code as PNG buffer for email attachment
        const participant = await User.findById(ticket.participantId);
        if (participant) {
            try {
                const qrBuffer = await QRCode.toBuffer(ticket.ticketId, {
                    type: 'png',
                    width: 300,
                    margin: 2,
                    color: { dark: '#1a1a2e', light: '#ffffff' }
                });

                // Build variant summary string
                const variantSummary = ticket.purchaseData?.variants
                    ? Object.entries(Object.fromEntries(ticket.purchaseData.variants || new Map()))
                        .map(([k, v]) => `${k}: ${v}`).join(', ')
                    : (ticket.purchaseData?.variant || '');

                // QR as base64 data URL for embedding in the standalone ticket HTML
                const qrDataUrl = `data:image/png;base64,${qrBuffer.toString('base64')}`;

                // ── Email body HTML (inline QR via cid) ──────────────────────
                const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Ticket - ${event.name}</title></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb">
  <div style="background:linear-gradient(135deg,#6d28d9,#7c3aed);padding:32px;border-radius:20px 20px 0 0;text-align:center">
    <h1 style="color:white;margin:0;font-size:1.8rem">🎟 Order Confirmed!</h1>
    <p style="color:#e9d5ff;margin:8px 0 0">Your payment has been approved</p>
  </div>
  <div style="background:white;padding:32px;border-radius:0 0 20px 20px;border:1px solid #e5e7eb">
    <h2 style="color:#111827;margin:0 0 4px">${event.name}</h2>
    <p style="color:#6b7280;margin:0 0 24px;font-size:0.9rem">${event.description || ''}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr><td style="padding:8px 0;color:#9ca3af;font-size:0.8rem;font-weight:bold;text-transform:uppercase">Ticket ID</td><td style="padding:8px 0;font-weight:bold;color:#111827;font-family:monospace">${ticket.ticketId}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;font-size:0.8rem;font-weight:bold;text-transform:uppercase">Name</td><td style="padding:8px 0;font-weight:bold;color:#111827">${participant.firstName} ${participant.lastName}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;font-size:0.8rem;font-weight:bold;text-transform:uppercase">Email</td><td style="padding:8px 0;color:#111827">${participant.email}</td></tr>
      ${ticket.purchaseData?.quantity ? `<tr><td style="padding:8px 0;color:#9ca3af;font-size:0.8rem;font-weight:bold;text-transform:uppercase">Quantity</td><td style="padding:8px 0;color:#111827">${ticket.purchaseData.quantity}</td></tr>` : ''}
      ${variantSummary ? `<tr><td style="padding:8px 0;color:#9ca3af;font-size:0.8rem;font-weight:bold;text-transform:uppercase">Variants</td><td style="padding:8px 0;color:#111827">${variantSummary}</td></tr>` : ''}
      <tr><td style="padding:8px 0;color:#9ca3af;font-size:0.8rem;font-weight:bold;text-transform:uppercase">Amount</td><td style="padding:8px 0;font-weight:bold;color:#6d28d9">₹${event.registrationFee || 0}</td></tr>
    </table>
    <div style="text-align:center;padding:20px;background:#f5f3ff;border-radius:12px;border:2px dashed #c4b5fd">
      <p style="color:#6d28d9;font-weight:bold;margin:0 0 12px;font-size:0.85rem">SCAN QR CODE AT PICKUP</p>
      <img src="cid:qrcode" alt="QR Code" style="width:200px;height:200px" />
      <p style="color:#9ca3af;font-size:0.75rem;margin:12px 0 0">Ticket ID: ${ticket.ticketId}</p>
    </div>
    <p style="color:#6b7280;font-size:0.8rem;margin-top:24px;text-align:center">📎 Your QR code and ticket are also attached to this email as downloadable files.</p>
    <p style="color:#6b7280;font-size:0.8rem;text-align:center">You can also download your ticket from your dashboard.</p>
  </div>
</body>
</html>`;

                // ── Standalone ticket HTML (self-contained, QR embedded as base64) ──
                const ticketHtmlAttachment = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ticket — ${event.name}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .ticket { max-width: 520px; margin: 0 auto; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(109,40,217,0.15); }
    .header { background: linear-gradient(135deg,#6d28d9,#7c3aed); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 1.6rem; }
    .header p { color: #e9d5ff; margin: 8px 0 0; font-size: 0.9rem; }
    .body { background: white; padding: 32px; }
    .body h2 { color: #111827; margin: 0 0 4px; font-size: 1.3rem; }
    .body .sub { color: #6b7280; font-size: 0.85rem; margin: 0 0 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    td { padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 0.9rem; }
    td:first-child { color: #9ca3af; font-weight: bold; text-transform: uppercase; font-size: 0.75rem; width: 40%; }
    td:last-child { color: #111827; font-weight: 600; }
    .qr-box { text-align: center; padding: 24px; background: #f5f3ff; border-radius: 16px; border: 2px dashed #c4b5fd; }
    .qr-box p { color: #6d28d9; font-weight: bold; margin: 0 0 16px; font-size: 0.85rem; letter-spacing: 1px; }
    .qr-box img { width: 200px; height: 200px; }
    .qr-box .tid { color: #9ca3af; font-size: 0.75rem; margin: 12px 0 0; font-family: monospace; }
    .footer { background: #f9fafb; padding: 16px 32px; text-align: center; font-size: 0.75rem; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <h1>🎟 Order Confirmed!</h1>
      <p>Your payment has been approved</p>
    </div>
    <div class="body">
      <h2>${event.name}</h2>
      <p class="sub">${event.description || ''}</p>
      <table>
        <tr><td>Ticket ID</td><td style="font-family:monospace">${ticket.ticketId}</td></tr>
        <tr><td>Name</td><td>${participant.firstName} ${participant.lastName}</td></tr>
        <tr><td>Email</td><td>${participant.email}</td></tr>
        ${ticket.purchaseData?.quantity ? `<tr><td>Quantity</td><td>${ticket.purchaseData.quantity}</td></tr>` : ''}
        ${variantSummary ? `<tr><td>Variants</td><td>${variantSummary}</td></tr>` : ''}
        <tr><td>Amount Paid</td><td style="color:#6d28d9;font-weight:bold">₹${event.registrationFee || 0}</td></tr>
        <tr><td>Status</td><td style="color:#059669;font-weight:bold">✓ Approved</td></tr>
      </table>
      <div class="qr-box">
        <p>SCAN QR CODE AT PICKUP</p>
        <img src="${qrDataUrl}" alt="QR Code" />
        <p class="tid">Ticket ID: ${ticket.ticketId}</p>
      </div>
    </div>
    <div class="footer">Present this ticket at the pickup counter • Generated by Evently</div>
  </div>
</body>
</html>`;

                await sendEmail({
                    email: participant.email,
                    subject: `✅ Order Approved — ${event.name}`,
                    message: emailHtml,
                    attachments: [
                        {
                            // Inline QR for email body display
                            filename: `qr-${ticket.ticketId}.png`,
                            content: qrBuffer,
                            contentType: 'image/png',
                            cid: 'qrcode'
                        },
                        {
                            // Downloadable QR PNG attachment
                            filename: `qr-code-${ticket.ticketId}.png`,
                            content: qrBuffer,
                            contentType: 'image/png'
                        },
                        {
                            // Downloadable self-contained ticket HTML
                            filename: `ticket-${ticket.ticketId}.html`,
                            content: Buffer.from(ticketHtmlAttachment, 'utf-8'),
                            contentType: 'text/html'
                        }
                    ]
                });
            } catch (emailErr) {
                console.error('Email send error (non-critical):', emailErr.message);
            }
        }

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

        if (ticket.paymentStatus === 'completed') {
            return res.status(400).json({ message: 'Cannot reject an already approved order' });
        }

        ticket.paymentStatus = 'rejected';
        ticket.status = 'Rejected';
        ticket.qrCodeData = ''; // Ensure no QR on rejection
        await ticket.save();

        const participant = await User.findById(ticket.participantId);
        if (participant) {
            await sendEmail({
                email: participant.email,
                subject: `❌ Payment Rejected — ${event.name}`,
                message: `
                    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
                        <h2 style="color:#dc2626">Payment Proof Rejected</h2>
                        <p>Unfortunately, your payment proof for <strong>${event.name}</strong> was not accepted.</p>
                        <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
                        <p>Please contact the organizer for more details or re-submit a valid payment proof.</p>
                    </div>
                `
            });
        }

        res.json({ message: 'Order rejected', ticket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Accept Registration (Organizer)
 * @route   PUT /api/tickets/:id/accept
 * @access  Private/Organizer
 */
const acceptRegistration = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate('eventId');
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const event = ticket.eventId;
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (ticket.status === 'registered' || ticket.status === 'Successful' || ticket.status === 'attended') {
            return res.status(400).json({ message: 'Registration already accepted' });
        }

        // Handle merchandise stock if it's a merch event
        if (event.type === 'merchandise') {
            const updatedEvent = await Event.findOneAndUpdate(
                { _id: event._id, merchandiseStock: { $gte: 1 } },
                { $inc: { merchandiseStock: -1 } },
                { new: true }
            );
            if (!updatedEvent) {
                return res.status(400).json({ message: 'Stock exhausted, cannot accept.' });
            }
        }

        ticket.status = 'Approved';
        if (event.registrationFee > 0 || event.type === 'merchandise') {
            ticket.paymentStatus = 'completed';
        }

        // Generate QR on approval
        ticket.qrCodeData = ticket.ticketId;

        await ticket.save();

        // Send email with QR code attachment
        const participant = await User.findById(ticket.participantId);
        if (participant) {
            try {
                const qrBuffer = await QRCode.toBuffer(ticket.ticketId, {
                    type: 'png',
                    width: 300,
                    margin: 2,
                    color: { dark: '#1a1a2e', light: '#ffffff' }
                });

                const qrDataUrl = `data:image/png;base64,${qrBuffer.toString('base64')}`;

                const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Ticket - ${event.name}</title></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb">
  <div style="background:linear-gradient(135deg,#6d28d9,#7c3aed);padding:32px;border-radius:20px 20px 0 0;text-align:center">
    <h1 style="color:white;margin:0;font-size:1.8rem">🎫 Registration Approved!</h1>
    <p style="color:#e9d5ff;margin:8px 0 0">You're all set for this event</p>
  </div>
  <div style="background:white;padding:32px;border-radius:0 0 20px 20px;border:1px solid #e5e7eb">
    <h2 style="color:#111827;margin:0 0 4px">${event.name}</h2>
    <p style="color:#6b7280;margin:0 0 24px;font-size:0.9rem">${event.description || ''}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr><td style="padding:8px 0;color:#9ca3af;font-size:0.8rem;font-weight:bold;text-transform:uppercase">Ticket ID</td><td style="padding:8px 0;font-weight:bold;color:#111827;font-family:monospace">${ticket.ticketId}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;font-size:0.8rem;font-weight:bold;text-transform:uppercase">Name</td><td style="padding:8px 0;font-weight:bold;color:#111827">${participant.firstName} ${participant.lastName}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;font-size:0.8rem;font-weight:bold;text-transform:uppercase">Email</td><td style="padding:8px 0;color:#111827">${participant.email}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;font-size:0.8rem;font-weight:bold;text-transform:uppercase">Date</td><td style="padding:8px 0;color:#111827">${event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBA'}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;font-size:0.8rem;font-weight:bold;text-transform:uppercase">Fee</td><td style="padding:8px 0;font-weight:bold;color:#6d28d9">${event.registrationFee ? '\u20b9' + event.registrationFee : 'Free'}</td></tr>
      <tr><td style="padding:8px 0;color:#9ca3af;font-size:0.8rem;font-weight:bold;text-transform:uppercase">Status</td><td style="padding:8px 0;font-weight:bold;color:#059669">\u2713 Approved</td></tr>
    </table>
    <div style="text-align:center;padding:20px;background:#f5f3ff;border-radius:12px;border:2px dashed #c4b5fd">
      <p style="color:#6d28d9;font-weight:bold;margin:0 0 12px;font-size:0.85rem">SCAN QR CODE AT EVENT</p>
      <img src="cid:qrcode" alt="QR Code" style="width:200px;height:200px" />
      <p style="color:#9ca3af;font-size:0.75rem;margin:12px 0 0">Ticket ID: ${ticket.ticketId}</p>
    </div>
    <p style="color:#6b7280;font-size:0.8rem;margin-top:24px;text-align:center">📎 Your QR code is also attached to this email.</p>
    <p style="color:#6b7280;font-size:0.8rem;text-align:center">You can also view your ticket from your dashboard.</p>
  </div>
</body>
</html>`;

                // Standalone ticket HTML attachment
                const ticketHtmlAttachment = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ticket \u2014 ${event.name}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f9fafb; margin: 0; padding: 20px; }
    .ticket { max-width: 520px; margin: 0 auto; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(109,40,217,0.15); }
    .header { background: linear-gradient(135deg,#6d28d9,#7c3aed); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 1.6rem; }
    .header p { color: #e9d5ff; margin: 8px 0 0; font-size: 0.9rem; }
    .body { background: white; padding: 32px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    td { padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 0.9rem; }
    td:first-child { color: #9ca3af; font-weight: bold; text-transform: uppercase; font-size: 0.75rem; width: 40%; }
    td:last-child { color: #111827; font-weight: 600; }
    .qr-box { text-align: center; padding: 24px; background: #f5f3ff; border-radius: 16px; border: 2px dashed #c4b5fd; }
    .qr-box p { color: #6d28d9; font-weight: bold; margin: 0 0 16px; font-size: 0.85rem; }
    .qr-box img { width: 200px; height: 200px; }
    .footer { background: #f9fafb; padding: 16px 32px; text-align: center; font-size: 0.75rem; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header"><h1>🎫 Registration Approved!</h1><p>You're all set</p></div>
    <div class="body">
      <h2 style="color:#111827;margin:0 0 4px">${event.name}</h2>
      <p style="color:#6b7280;font-size:0.85rem;margin:0 0 24px">${event.description || ''}</p>
      <table>
        <tr><td>Ticket ID</td><td style="font-family:monospace">${ticket.ticketId}</td></tr>
        <tr><td>Name</td><td>${participant.firstName} ${participant.lastName}</td></tr>
        <tr><td>Email</td><td>${participant.email}</td></tr>
        <tr><td>Date</td><td>${event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBA'}</td></tr>
        <tr><td>Fee</td><td style="color:#6d28d9;font-weight:bold">${event.registrationFee ? '\u20b9' + event.registrationFee : 'Free'}</td></tr>
        <tr><td>Status</td><td style="color:#059669;font-weight:bold">\u2713 Approved</td></tr>
      </table>
      <div class="qr-box">
        <p>SCAN QR CODE AT EVENT</p>
        <img src="${qrDataUrl}" alt="QR Code" />
        <p style="font-size:0.75rem;color:#9ca3af;margin:12px 0 0">Ticket ID: ${ticket.ticketId}</p>
      </div>
    </div>
    <div class="footer">Present this ticket at the event \u2022 Generated by Evently</div>
  </div>
</body>
</html>`;

                await sendEmail({
                    email: participant.email,
                    subject: `\u2705 Registration Approved \u2014 ${event.name}`,
                    message: emailHtml,
                    attachments: [
                        {
                            filename: `qr-${ticket.ticketId}.png`,
                            content: qrBuffer,
                            contentType: 'image/png',
                            cid: 'qrcode'
                        },
                        {
                            filename: `qr-code-${ticket.ticketId}.png`,
                            content: qrBuffer,
                            contentType: 'image/png'
                        },
                        {
                            filename: `ticket-${ticket.ticketId}.html`,
                            content: Buffer.from(ticketHtmlAttachment, 'utf-8'),
                            contentType: 'text/html'
                        }
                    ]
                });
            } catch (emailErr) {
                console.error('Approval email error (non-critical):', emailErr.message);
            }
        }

        res.json({ message: 'Registration accepted successfully', ticket });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Reject Registration (Organizer)
 * @route   PUT /api/tickets/:id/reject
 * @access  Private/Organizer
 */
const rejectRegistration = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate('eventId');
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const event = ticket.eventId;
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Decrement registered count if we are rejecting a normal event registration
        if (event.type === 'normal' && ticket.status !== 'Rejected' && ticket.status !== 'cancelled') {
            await Event.updateOne(
                { _id: event._id, registeredCount: { $gt: 0 } },
                { $inc: { registeredCount: -1 } }
            );
        }

        ticket.status = 'Rejected';
        if (event.registrationFee > 0 || event.type === 'merchandise') {
            ticket.paymentStatus = 'rejected';
        }
        await ticket.save();

        // Send email
        const participant = await User.findById(ticket.participantId);
        if (participant) {
            await sendEmail({
                email: participant.email,
                subject: `Registration Rejected - ${event.name}`,
                message: `
                    <h1>Registration Rejected</h1>
                    <p>Your registration for <strong>${event.name}</strong> has been rejected by the organizer.</p>
                `
            });
        }

        res.json({ message: 'Registration rejected', ticket });

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
    acceptRegistration,
    rejectRegistration,
    scanTicket,
    getPendingVerifications,
    exportAttendanceCSV,
    checkRegistration,
    exportTicketsICS,
    getCalendarLinks
};
