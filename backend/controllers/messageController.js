const Message = require('../models/Message');

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
        const { eventId, content, parentMessageId } = req.body;
        const newMessage = new Message({
            eventId,
            senderId: req.user._id,
            content,
            parentMessageId: parentMessageId || null
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
