const mongoose = require('mongoose');

const passwordResetRequestSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    organizerName: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminResponse: {
        type: String
    }
}, { timestamps: true });

const PasswordResetRequest = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);
module.exports = PasswordResetRequest;
