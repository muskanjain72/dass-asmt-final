
const User = require('../models/User');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const crypto = require('crypto');

// Helper to generate random password
const generateRandomPassword = (length = 10) => {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
};

// Helper to generate email from name
const generateOrganizerEmail = (name) => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    return `${cleanName}_${randomSuffix}@campus.events`; // Mock domain
};

/*
 * @desc    Create a new Organizer account
 * @route   POST /api/admin/organizers
 * @access  Private/Admin
 */
const createOrganizer = async (req, res) => {
    try {
        const { organizerName, category, description, contactEmail } = req.body;

        if (!organizerName || !category) {
            return res.status(400).json({ message: 'Organizer Name and Category are required' });
        }

        // Auto-generate system login credentials
        const loginEmail = generateOrganizerEmail(organizerName);
        const loginPassword = generateRandomPassword(12);

        const organizer = await User.create({
            role: 'organizer',
            organizerName,
            category,
            description,
            contactEmail, // Public facing contact email
            email: loginEmail, // System login email
            password: loginPassword // Will be hashed by pre-save middleware
        });

        if (organizer) {
            res.status(201).json({
                message: 'Organizer created successfully',
                organizer: {
                    id: organizer._id,
                    name: organizer.organizerName,
                    loginEmail: loginEmail,
                    loginPassword: loginPassword, // Return this ONCE so admin can share it
                    contactEmail: organizer.contactEmail
                }
            });
        }
    } catch (error) {
        console.error('Create Organizer Error:', error);
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Get all organizers
 * @route   GET /api/admin/organizers
 * @access  Private/Admin
 */
const getOrganizers = async (req, res) => {
    try {
        const organizers = await User.find({ role: 'organizer' })
            .select('-password'); // Exclude hash
        res.json(organizers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Disable/Remove Organizer
 * @route   DELETE /api/admin/organizers/:id
 * @access  Private/Admin
 */
const deleteOrganizer = async (req, res) => {
    try {
        const organizer = await User.findById(req.params.id);

        if (!organizer || organizer.role !== 'organizer') {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        // Hard delete for now, could be soft delete if "active" status field was added
        await organizer.deleteOne();

        res.json({ message: 'Organizer removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Toggle Organizer Active Status (Disable/Archive)
 * @route   PUT /api/admin/organizers/:id/status
 * @access  Private/Admin
 */
const toggleOrganizerStatus = async (req, res) => {
    try {
        const organizer = await User.findById(req.params.id);

        if (!organizer || organizer.role !== 'organizer') {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        organizer.isActive = !organizer.isActive;
        await organizer.save();

        res.json({
            message: `Organizer ${organizer.isActive ? 'activated' : 'disabled'}`,
            isActive: organizer.isActive
        });
    } catch (error) {
        console.error('Toggle Status Error:', error);
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Get All Password Reset Requests
 * @route   GET /api/admin/reset-requests
 * @access  Private/Admin
 */
const getAllResetRequests = async (req, res) => {
    try {
        const requests = await PasswordResetRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Handle Password Reset Request (Approve/Reject)
 * @route   PUT /api/admin/reset-requests/:id
 * @access  Private/Admin
 */
const handleResetRequest = async (req, res) => {
    try {
        const { status, comments } = req.body; // status: 'approved' or 'rejected'
        const request = await PasswordResetRequest.findById(req.params.id);

        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already handled' });

        request.status = status;
        request.adminResponse = comments || '';

        let newPassword = null;

        if (status === 'approved') {
            const user = await User.findOne({ email: request.email, role: 'organizer' });
            if (!user) {
                return res.status(404).json({ message: 'Organizer user account not found for this email' });
            }

            // Generate Random Password
            newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

            user.password = newPassword;
            await user.save();
        }

        await request.save();

        res.json({
            message: `Request ${status}`,
            newPassword: newPassword
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrganizer,
    getOrganizers,
    deleteOrganizer,
    toggleOrganizerStatus,
    getAllResetRequests,
    handleResetRequest
};
