
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['participant', 'organizer', 'admin'],
        required: true,
        immutable: true // Role cannot be changed after creation
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    // Participant Fields
    firstName: { type: String, required: function () { return this.role === 'participant'; } },
    lastName: { type: String, required: function () { return this.role === 'participant'; } },
    contactNumber: { type: String },
    collegeName: { type: String },
    isIIIT: { type: Boolean, default: false },
    interests: [{ type: String }],
    followedOrganizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Organizer Fields
    organizerName: { type: String, required: function () { return this.role === 'organizer'; } },
    category: { type: String },
    description: { type: String },
    contactEmail: { type: String }, // Public contact email
    discordWebhookUrl: { type: String },
    isVerified: { type: Boolean, default: false }, // Organizer verification status
    isActive: { type: Boolean, default: true }, // For disabling/archiving accounts

    // Admin Fields
    // (Admin mainly uses system access, no specific extra fields strictly required yet)

}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
