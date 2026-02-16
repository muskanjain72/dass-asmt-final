const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User'); // Used in webhook logic

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
            formSchema
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
/*
 * @desc    Get All Events (Public - Browse)
 * @route   GET /api/events
 * @access  Public
 */
const getEvents = async (req, res) => {
    // ... existing getEvents code ...
    try {
        const { keyword, type, startDate, endDate, eligibility, sort, limit, page = 1 } = req.query; // Added page default

        // Build Match Stage (Filtering)
        let matchStage = { status: { $in: ['published', 'ongoing'] } };

        if (keyword) {
            matchStage.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }

        if (type) matchStage.type = type;

        if (startDate || endDate) {
            matchStage.startDate = {};
            if (startDate) matchStage.startDate.$gte = new Date(startDate);
            if (endDate) matchStage.startDate.$lte = new Date(endDate);
        }

        if (eligibility && eligibility !== 'All') {
            matchStage.eligibility = { $in: [eligibility, 'All'] };
        }

        // Trending filter logic: top 5 in last 24h
        if (sort === 'trending') {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            matchStage.createdAt = { $gte: yesterday };
        }

        // Determine user interests for personalization
        const userInterests = req.user?.interests || [];

        // Aggregation Pipeline
        const pipeline = [
            { $match: matchStage },
            // Add matchScore based on intersection of event tags and user interests
            {
                $addFields: {
                    matchScore: {
                        $size: {
                            $setIntersection: ["$tags", userInterests]
                        }
                    }
                }
            }
        ];

        // Sorting
        let sortStage = {};
        if (sort === 'trending') {
            sortStage = { registeredCount: -1 };
        } else {
            // Default: Prioritize matchScore, then startDate
            sortStage = { matchScore: -1, startDate: 1 };
        }
        pipeline.push({ $sort: sortStage });

        // Pagination & Limit
        // If sorting by trending, we might want a hard limit as per original logic (limit 5)
        // But let's support general pagination too if needed.
        if (limit) {
            pipeline.push({ $limit: parseInt(limit) });
        }

        // Populate Organizer (Aggregation specific lookups are complex, let's use helper or simple lookup)
        // $lookup replacement for populate('organizer', 'organizerName')
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'organizer',
                foreignField: '_id',
                as: 'organizer'
            }
        });

        // Unwind organizer array (lookup returns array) and project only needed fields
        pipeline.push({
            $unwind: { path: '$organizer', preserveNullAndEmptyArrays: true }
        });

        // Project final fields (cleaning up organizer object to match populate behavior)
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
                matchScore: 1, // Debug purpose or UI
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
            if (startDate && new Date(startDate).getTime() !== new Date(event.startDate).getTime()) illegalEdits.push('startDate');
            if (endDate && new Date(endDate).getTime() !== new Date(event.endDate).getTime()) illegalEdits.push('endDate');
            if (registrationFee !== undefined && registrationFee !== event.registrationFee) illegalEdits.push('registrationFee');
            if (eligibility && eligibility !== event.eligibility) illegalEdits.push('eligibility');
            if (formSchema) illegalEdits.push('formSchema');

            if (illegalEdits.length > 0) {
                return res.status(400).json({
                    message: `Cannot edit core fields [${illegalEdits.join(', ')}] after publication`
                });
            }

            // Allowed edits for Published: description, registrationDeadline, registrationLimit, tags
            event.description = description || event.description;
            event.registrationDeadline = registrationDeadline || event.registrationDeadline;

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
            if (formSchema) event.formSchema = formSchema;
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

        // Add attendance and enriched status
        const enrichedEvents = await Promise.all(events.map(async (event) => {
            const attendanceCount = await Ticket.countDocuments({
                eventId: event._id,
                scannedAt: { $exists: true }
            });

            // Determine dynamic status for UI if needed (though UI handles it)
            // But we mainly need attendanceCount
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
    getEventById,
    updateEvent,
    getMyEvents,
    getEventStats
};
