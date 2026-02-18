const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['normal', 'merchandise'],
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'ongoing', 'closed', 'completed'],
        default: 'draft'
    },
    eligibility: {
        type: String, // e.g., "All", "IIIT Students Only", "Team of 4"
        default: 'All'
    },
    registrationDeadline: {
        type: Date
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    // For Normal Events: Max participants
    // For Merchandise: Max stock generally (or logic specific to merch items)
    registrationLimit: {
        type: Number,
        default: 0 // 0 means unlimited
    },
    // Track current count to avoid count documents every time
    registeredCount: {
        type: Number,
        default: 0
    },
    registrationFee: {
        type: Number,
        default: 0
    },
    tags: [{
        type: String
    }],

    // Merchandise Specific: Stock tracking if simple single-item event
    // If multiple items, we might need a sub-schema, but requirements imply "Merchandise Event" sells "merchandise".
    // Let's assume a Merchandise Event sells ONE main type of item (like T-shirt) with variants, or just keeps it simple.
    // For the requirement "Merchandise Event... Individual purchase only", let's add stock field.
    merchandiseStock: {
        type: Number,
        default: 0
    },
    // Configurable purchase limit per participant
    purchaseLimit: {
        type: Number,
        default: 1
    },
    // Item details (size, color, variants)
    merchandiseVariants: [{
        category: { type: String, required: true }, // e.g. "Size"
        options: [{ type: String, required: true }] // e.g. ["S", "M", "L"]
    }],

    // Custom Form Builder Schema
    // Stores definitions of fields the organizer wants to collect
    formSchema: [{
        label: { type: String, required: true },
        type: {
            type: String,
            enum: ['text', 'number', 'dropdown', 'checkbox', 'file', 'email', 'date', 'radio'],
            required: true
        },
        required: { type: Boolean, default: false },
        options: [{ type: String }] // For dropdown/checkbox
    }]

}, { timestamps: true });

// Text index for search
eventSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
