const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    parentMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isAnnouncement: {
        type: Boolean,
        default: false
    },
    reactions: {
        type: Map,
        of: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // emoji -> [userIds]
        default: {}
    }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
