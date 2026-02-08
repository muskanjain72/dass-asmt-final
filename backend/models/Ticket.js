
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true
    },
    participantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    qrCodeData: {
        type: String // We can store the text data or the base64 image string if preferred, usually data is enough
    },
    status: {
        type: String,
        enum: ['registered', 'attended', 'cancelled', 'completed'],
        default: 'registered'
    },
    // Store answers to the event's custom form
    responses: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    // For paid events/merch
    purchaseData: {
        quantity: { type: Number, default: 1 },
        variant: { type: String } // e.g., Size for T-shirt
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'pending_approval', 'completed', 'failed', 'free', 'rejected'],
        default: 'free'
    },
    paymentProof: {
        type: String // URL to uploaded image
    },
    scannedAt: {
        type: Date
    },
    scannedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User'
    }
}, { timestamps: true });

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;
