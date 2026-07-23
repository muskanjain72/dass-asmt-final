const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User'); // Used in webhook logic

const defaultFormFields = [
    { label: 'Full Name', type: 'text', required: true },
    { label: 'Email ID', type: 'email', required: true },
    { label: 'Contact Number', type: 'text', required: true }
];

/*
 * @desc    Create a new Event (Draft)
 * @route   POST /api/events
 * @access  Private/Organizer
 */
const createEvent = async (req, res) => {
    try {
        const {
            name, description, type, eligibility,
            registrationDeadline, startDate, endDate,
            registrationLimit, registrationFee, tags,
            merchandiseStock, merchandiseVariants, purchaseLimit, formSchema
        } = req.body;

        // Date Validations
        if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ message: 'End date must be after start date.' });
        }
        if (startDate && registrationDeadline && new Date(registrationDeadline) > new Date(startDate)) {
            return res.status(400).json({ message: 'Registration deadline must be before or equal to start date.' });
        }

        // Ensure default fields are present
        let finalSchema = [...defaultFormFields];
        if (formSchema && formSchema.length > 0) {
            // Add custom fields that don't duplicate default labels
            const defaultLabels = defaultFormFields.map(f => f.label.toLowerCase());
            const customFields = formSchema.filter(f => !defaultLabels.includes(f.label.toLowerCase()));
            finalSchema = [...finalSchema, ...customFields];
        }

        const event = new Event({
            organizer: req.user._id,
            name,
            description,
            type, // 'normal' or 'merchandise'
            status: 'draft',
            eligibility,
            registrationDeadline,
            startDate,
            endDate,
            registrationLimit,
            registrationFee,
            tags: typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags,
            merchandiseStock,
            merchandiseVariants,
            purchaseLimit,
            formSchema: finalSchema
        });

        const createdEvent = await event.save();
        res.status(201).json(createdEvent);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Get All Events (Public - Browse)
 * @route   GET /api/events
 * @access  Public
 */
const getEvents = async (req, res) => {
    try {
        const { keyword, type, startDate, endDate, eligibility, sort, limit } = req.query;

        // Build Match Stage (Filtering)
        let matchStage = { status: { $in: ['published', 'ongoing'] } };

        if (type) matchStage.type = type;

        if (startDate || endDate) {
            matchStage.startDate = {};
            if (startDate) matchStage.startDate.$gte = new Date(startDate);
            if (endDate) matchStage.startDate.$lte = new Date(endDate);
        }

        if (eligibility && eligibility !== 'All') {
            matchStage.eligibility = { $in: [eligibility, 'All'] };
        }

        // Determine user interests for personalization
        const userInterests = req.user?.interests || [];

        // Aggregation Pipeline — lookup organizer FIRST so we can search on organizerName
        const pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'users',
                    localField: 'organizer',
                    foreignField: '_id',
                    as: 'organizer'
                }
            },
            { $unwind: { path: '$organizer', preserveNullAndEmptyArrays: true } },
        ];

        // Fuzzy/Partial keyword search on event name AND organizer name
        if (keyword) {
            pipeline.push({
                $match: {
                    $or: [
                        { name: { $regex: keyword, $options: 'i' } },
                        { description: { $regex: keyword, $options: 'i' } },
                        { 'organizer.organizerName': { $regex: keyword, $options: 'i' } },
                        { tags: { $elemMatch: { $regex: keyword, $options: 'i' } } }
                    ]
                }
            });
        }

        // Add personalization matchScore
        pipeline.push({
            $addFields: {
                matchScore: {
                    $size: {
                        $ifNull: [{ $setIntersection: ['$tags', userInterests] }, []]
                    }
                }
            }
        });

        // Sorting
        if (sort === 'trending') {
            pipeline.push({ $sort: { registeredCount: -1, startDate: 1 } });
        } else {
            pipeline.push({ $sort: { matchScore: -1, startDate: 1 } });
        }

        if (limit) {
            pipeline.push({ $limit: parseInt(limit) });
        }

        // Project final fields
        pipeline.push({
            $project: {
                name: 1,
                description: 1,
                type: 1,
                status: 1,
                eligibility: 1,
                registrationDeadline: 1,
                startDate: 1,
                endDate: 1,
                registrationLimit: 1,
                registrationFee: 1,
                tags: 1,
                merchandiseStock: 1,
                registeredCount: 1,
                matchScore: 1,
                'organizer._id': 1,
                'organizer.organizerName': 1
            }
        });

        const events = await Event.aggregate(pipeline);
        res.json(events);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Get Trending Events (Top 5 by registrations in last 24h)
 * @route   GET /api/events/trending
 * @access  Public
 */
const getTrendingEvents = async (req, res) => {
    try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Count tickets created in the last 24h per event
        const trendingTickets = await Ticket.aggregate([
            { $match: { createdAt: { $gte: yesterday }, status: { $nin: ['cancelled', 'rejected'] } } },
            { $group: { _id: '$eventId', recentRegistrations: { $sum: 1 } } },
            { $sort: { recentRegistrations: -1 } },
            { $limit: 5 }
        ]);

        if (trendingTickets.length === 0) {
            // Fallback: return top 5 by total registrations
            const fallback = await Event.find({ status: { $in: ['published', 'ongoing'] } })
                .sort({ registeredCount: -1 })
                .limit(5)
                .populate('organizer', 'organizerName');
            return res.json(fallback.map(e => ({ ...e.toObject(), recentRegistrations: 0 })));
        }

        const eventIds = trendingTickets.map(t => t._id);
        const recentMap = {};
        trendingTickets.forEach(t => { recentMap[t._id.toString()] = t.recentRegistrations; });

        const events = await Event.find({ _id: { $in: eventIds }, status: { $in: ['published', 'ongoing'] } })
            .populate('organizer', 'organizerName');

        // Sort by recentRegistrations order
        const sorted = events
            .map(e => ({ ...e.toObject(), recentRegistrations: recentMap[e._id.toString()] || 0 }))
            .sort((a, b) => b.recentRegistrations - a.recentRegistrations);

        res.json(sorted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Get single event details
 * @route   GET /api/events/:id
 * @access  Public
 */
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'organizerName category description contactEmail');

        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Update Event (Organizer)
 * @route   PUT /api/events/:id
 * @access  Private/Organizer
 */
const axios = require('axios');

/*
 * @desc    Update Event (Organizer)
 * @route   PUT /api/events/:id
 * @access  Private/Organizer
 */
const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const {
            name, description, status, registrationDeadline, registrationLimit,
            formSchema, startDate, endDate, registrationFee, tags,
            merchandiseStock, merchandiseVariants, purchaseLimit, eligibility
        } = req.body;

        // --- Status Based Editing Rules ---

        // 1. Ongoing/Closed/Completed: No edits allowed except status
        if (['ongoing', 'closed', 'completed'].includes(event.status)) {
            if (status) {
                event.status = status;
                await event.save();
                return res.json(event);
            }
            return res.status(400).json({ message: 'Cannot edit event details in current status' });
        }

        // 2. Published: Restricted edits
        if (event.status === 'published') {
            // Check for illegal published edits
            const illegalEdits = [];
            if (name && name !== event.name) illegalEdits.push('name');

            if (startDate) {
                const newTime = new Date(startDate).setSeconds(0, 0);
                const oldTime = new Date(event.startDate).setSeconds(0, 0);
                if (newTime !== oldTime) illegalEdits.push('startDate');
            }
            if (endDate) {
                const newTime = new Date(endDate).setSeconds(0, 0);
                const oldTime = new Date(event.endDate).setSeconds(0, 0);
                if (newTime !== oldTime) illegalEdits.push('endDate');
            }
            if (registrationFee !== undefined && Number(registrationFee) !== Number(event.registrationFee)) {
                illegalEdits.push('registrationFee');
            }
            if (eligibility && eligibility !== event.eligibility) illegalEdits.push('eligibility');

            // Allow formSchema edit ONLY if no registrations yet
            if (formSchema && event.registeredCount > 0) {
                // If there are registrations, we check if the schema actually changed
                // (Though simpler is just to block it once registrations start)
                illegalEdits.push('formSchema');
            }

            if (illegalEdits.length > 0) {
                return res.status(400).json({
                    message: `Cannot edit core fields [${illegalEdits.join(', ')}] after publication`
                });
            }

            // Allowed edits for Published: description, registrationDeadline, registrationLimit, tags, formSchema (if resCount 0)
            event.description = description || event.description;
            event.registrationDeadline = registrationDeadline || event.registrationDeadline;
            if (formSchema && event.registeredCount === 0) {
                // Ensure default fields are present
                let finalSchema = [...defaultFormFields];
                const defaultLabels = defaultFormFields.map(f => f.label.toLowerCase());
                const customFields = formSchema.filter(f => !defaultLabels.includes(f.label.toLowerCase()));
                event.formSchema = [...finalSchema, ...customFields];
            }

            if (tags) {
                event.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
            }

            if (registrationLimit) {
                if (registrationLimit < event.registrationLimit) {
                    return res.status(400).json({ message: 'Cannot decrease limit for published event' });
                }
                event.registrationLimit = registrationLimit;
            }
        }

        // 3. Draft: Full edits
        if (event.status === 'draft') {
            event.name = name || event.name;
            event.description = description || event.description;
            event.registrationDeadline = registrationDeadline || event.registrationDeadline;
            event.startDate = startDate || event.startDate;
            event.endDate = endDate || event.endDate;
            event.registrationFee = registrationFee !== undefined ? registrationFee : event.registrationFee;
            event.eligibility = eligibility || event.eligibility;
            event.registrationLimit = registrationLimit || event.registrationLimit;

            if (tags) {
                event.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
            }

            if (merchandiseStock !== undefined) event.merchandiseStock = merchandiseStock;
            if (merchandiseVariants !== undefined) event.merchandiseVariants = merchandiseVariants;
            if (purchaseLimit !== undefined) event.purchaseLimit = purchaseLimit;
            if (formSchema) {
                // Ensure default fields are present
                let finalSchema = [...defaultFormFields];
                const defaultLabels = defaultFormFields.map(f => f.label.toLowerCase());
                const customFields = formSchema.filter(f => !defaultLabels.includes(f.label.toLowerCase()));
                event.formSchema = [...finalSchema, ...customFields];
            }
        }

        // Handle Publication Event (Discord Webhook)
        if (status === 'published' && event.status !== 'published') {
            const organizerUser = await User.findById(req.user._id);
            if (organizerUser.discordWebhookUrl) {
                try {
                    await axios.post(organizerUser.discordWebhookUrl, {
                        content: `🎉 **New Event Published!**\n\n**${event.name}**\n${event.description}\n\n👉 Register now!`
                    });
                } catch (err) {
                    console.error("Discord Webhook Failed", err.message);
                }
            }
        }

        if (status) event.status = status;

        // Date Validations before saving
        if (event.startDate && event.endDate && new Date(event.startDate) >= new Date(event.endDate)) {
            return res.status(400).json({ message: 'End date must be after start date.' });
        }
        if (event.startDate && event.registrationDeadline && new Date(event.registrationDeadline) > new Date(event.startDate)) {
            return res.status(400).json({ message: 'Registration deadline must be before or equal to start date.' });
        }

        const updatedEvent = await event.save();
        res.json(updatedEvent);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Get Organizer's events
 * @route   GET /api/events/my-events
 * @access  Private/Organizer
 */
const getMyEvents = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        // Use $or to be safe if some legacy data has string IDs
        const events = await Event.find({
            $or: [
                { organizer: req.user._id },
                { organizer: userId }
            ]
        }).sort({ createdAt: -1 });

        const now = new Date();

        // Auto-close events whose endDate has passed
        await Promise.all(events.map(async (event) => {
            if (
                ['published', 'ongoing'].includes(event.status) &&
                event.endDate && new Date(event.endDate) < now
            ) {
                event.status = 'closed';
                await event.save();
            }
        }));

        // Add attendance and enriched status
        const enrichedEvents = await Promise.all(events.map(async (event) => {
            const attendanceCount = await Ticket.countDocuments({
                eventId: event._id,
                scannedAt: { $exists: true }
            });

            return {
                ...event.toObject(),
                attendanceCount
            };
        }));

        console.log(`[DEBUG] Found ${enrichedEvents.length} events for organizer ${userId}`);
        res.json(enrichedEvents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Get Event Statistics (Organizer)
 * @route   GET /api/events/:id/stats
 * @access  Private/Organizer
 */
const getEventStats = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const revenue = event.registeredCount * (event.registrationFee || 0);

        res.json({
            registrations: event.registeredCount,
            revenue: revenue,
            limit: event.registrationLimit
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createEvent,
    getEvents,
    getTrendingEvents,
    getEventById,
    updateEvent,
    getMyEvents,
    getEventStats
};

