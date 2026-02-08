const Event = require('../models/Event');
const User = require('../models/User');

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
            merchandiseStock, formSchema
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
            tags,
            merchandiseStock,
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
    try {
        const { keyword, type, startDate, endDate, eligibility, sort } = req.query;
        let query = { status: { $in: ['published', 'ongoing'] } };

        if (keyword) {
            query = {
                ...query,
                $or: [
                    { name: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } }
                ]
            };
        }

        if (type) {
            query.type = type;
        }

        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) query.startDate.$gte = new Date(startDate);
            if (endDate) query.startDate.$lte = new Date(endDate);
        }

        if (eligibility && eligibility !== 'All') {
            query.eligibility = { $in: [eligibility, 'All'] };
        }

        let eventsQuery = Event.find(query).populate('organizer', 'organizerName');

        // Sorting
        if (sort === 'trending') {
            eventsQuery = eventsQuery.sort({ registeredCount: -1 });
        } else {
            eventsQuery = eventsQuery.sort({ startDate: 1 });
        }

        // Limit
        if (req.query.limit) {
            eventsQuery = eventsQuery.limit(parseInt(req.query.limit));
        }

        const events = await eventsQuery;
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

        if (['ongoing', 'closed', 'completed'].includes(event.status)) {
            if (req.body.status) {
                event.status = req.body.status;
                await event.save();
                return res.json(event);
            }
            return res.status(400).json({ message: 'Cannot edit event details in current status' });
        }

        const { name, description, status, registrationDeadline, registrationLimit, formSchema, startDate, endDate, registrationFee } = req.body;

        event.name = name || event.name;
        event.description = description || event.description;
        event.registrationDeadline = registrationDeadline || event.registrationDeadline;
        event.startDate = startDate || event.startDate;
        event.endDate = endDate || event.endDate;
        event.registrationFee = registrationFee !== undefined ? registrationFee : event.registrationFee;

        if (registrationLimit) {
            if (event.status === 'published' && registrationLimit < event.registrationLimit) {
                return res.status(400).json({ message: 'Cannot decrease limit for published event' });
            }
            event.registrationLimit = registrationLimit;
        }

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
        if (formSchema && event.status === 'draft') {
            event.formSchema = formSchema; // Only editable in draft
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
        const events = await Event.find({ organizer: req.user._id }).sort({ createdAt: -1 });
        res.json(events);
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
