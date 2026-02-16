const Message = require('../models/Message');
const Ticket = require('../models/Ticket');

const getMessages = async (req, res) => {
    try {
        const { eventId } = req.params;
        const messages = await Message.find({ eventId })
            .populate('senderId', 'firstName lastName role')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const postMessage = async (req, res) => {
    try {
        const { eventId, content, parentMessageId, isAnnouncement } = req.body;

        // Permission Check: If participant, must be registered
        if (req.user.role === 'participant') {
            const ticket = await Ticket.findOne({ eventId, participantId: req.user._id });
            if (!ticket) {
                return res.status(403).json({ message: 'Only registered participants can post messages.' });
            }
        }

        // Announcement Check: Only Organizers/Admins
        if (isAnnouncement && !['organizer', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Only organizers can post announcements.' });
        }

        const newMessage = new Message({
            eventId,
            senderId: req.user._id,
            content,
            parentMessageId: parentMessageId || null,
            isAnnouncement: !!isAnnouncement
        });

        const savedMessage = await newMessage.save();
        const populatedMessage = await Message.findById(savedMessage._id).populate('senderId', 'firstName lastName role');

        const io = req.app.get('io');
        io.to(eventId).emit('receive_message', populatedMessage);

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const reactToMessage = async (req, res) => {
    try {
        const { emoji } = req.body;
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        if (!message.reactions) message.reactions = new Map();

        const userReactions = message.reactions.get(emoji) || [];
        const index = userReactions.indexOf(req.user._id.toString());

        if (index > -1) {
            // Remove reaction
            userReactions.splice(index, 1);
        } else {
            // Add reaction
            userReactions.push(req.user._id);
        }

        if (userReactions.length === 0) {
            message.reactions.delete(emoji);
        } else {
            message.reactions.set(emoji, userReactions);
        }

        await message.save();

        const populated = await Message.findById(message._id).populate('senderId', 'firstName lastName role');
        const io = req.app.get('io');
        io.to(message.eventId.toString()).emit('message_updated', populated);

        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const togglePin = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ message: 'Message not found' });

        message.isPinned = !message.isPinned;
        await message.save();

        const io = req.app.get('io');
        io.to(message.eventId.toString()).emit('message_updated', message);

        res.json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (message) {
            const eventId = message.eventId.toString();
            await message.deleteOne();
            const io = req.app.get('io');
            io.to(eventId).emit('message_deleted', req.params.id);
            res.json({ message: 'Message removed' });
        } else {
            res.status(404).json({ message: 'Message not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getMessages, postMessage, togglePin, deleteMessage };
