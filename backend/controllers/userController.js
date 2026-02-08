const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Needed for seed but not directly here usually, keeping if needed
const Event = require('../models/Event'); // Needed for public profile events

/*
 * @desc    Toggle Follow Organizer
 * @route   PUT /api/users/follow/:organizerId
 * @access  Private/Participant
 */
const toggleFollowOrganizer = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const organizerId = req.params.organizerId;

        // Check if organizer exists
        const organizer = await User.findById(organizerId);
        if (!organizer || organizer.role !== 'organizer') {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        const isFollowing = user.followedOrganizers.includes(organizerId);

        if (isFollowing) {
            user.followedOrganizers = user.followedOrganizers.filter(id => id.toString() !== organizerId);
        } else {
            user.followedOrganizers.push(organizerId);
        }

        await user.save();
        res.json({
            message: isFollowing ? 'Unfollowed' : 'Followed',
            followedOrganizers: user.followedOrganizers
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Get All Public Organizers (for Club List)
 * @route   GET /api/users/organizers
 * @access  Public
 */
const getPublicOrganizers = async (req, res) => {
    try {
        const organizers = await User.find({ role: 'organizer', isActive: true })
            .select('organizerName category description contactEmail discordWebhookUrl isVerified');
        res.json(organizers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Get Organizer Public Profile with Events
 * @route   GET /api/users/organizers/:id
 * @access  Public
 */
const getOrganizerPublicProfile = async (req, res) => {
    try {
        const organizer = await User.findById(req.params.id)
            .select('organizerName category description contactEmail isVerified role');

        if (!organizer || organizer.role !== 'organizer') {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        const events = await Event.find({ organizer: req.params.id, status: { $in: ['published', 'ongoing', 'completed'] } })
            .sort({ startDate: -1 });

        res.json({ organizer, events });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            // Fields common to all or specific to Participant
            user.contactNumber = req.body.contactNumber || user.contactNumber;

            if (user.role === 'participant') {
                user.firstName = req.body.firstName || user.firstName;
                user.lastName = req.body.lastName || user.lastName;
                user.collegeName = req.body.collegeName || user.collegeName;
                user.interests = req.body.interests || user.interests;
            } else if (user.role === 'organizer') {
                // Organizer updates their profile here too
                user.organizerName = req.body.organizerName || user.organizerName;
                user.description = req.body.description || user.description;
                user.category = req.body.category || user.category;
                user.contactEmail = req.body.contactEmail || user.contactEmail;
                user.discordWebhookUrl = req.body.discordWebhookUrl || user.discordWebhookUrl;
            }

            // Note: Email and Role are generally not editable here
            // Note: Password reset is a separate flow

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: user.role === 'participant' ? `${updatedUser.firstName} ${updatedUser.lastName}` : updatedUser.organizerName,
                email: updatedUser.email,
                role: updatedUser.role,
                // return other fields as needed
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Get all organizers (for Clubs page)
 * @route   GET /api/users/organizers
 * @access  Private
 */
const getAllOrganizers = async (req, res) => {
    try {
        const organizers = await User.find({ role: 'organizer' })
            .select('organizerName category description contactEmail isVerified');
        res.json(organizers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/*
 * @desc    Follow/Unfollow Organizer
 * @route   PUT /api/users/organizers/:id/follow
 * @access  Private/Participant
 */
const followOrganizer = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const organizerId = req.params.id;

        // Check if already followed
        if (user.followedOrganizers.includes(organizerId)) {
            // Unfollow
            user.followedOrganizers = user.followedOrganizers.filter(
                (id) => id.toString() !== organizerId
            );
            await user.save();
            res.json({ message: 'Unfollowed organizer', followed: false });
        } else {
            // Follow
            user.followedOrganizers.push(organizerId);
            await user.save();
            res.json({ message: 'Followed organizer', followed: true });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    getPublicOrganizers,
    getOrganizerPublicProfile,
    toggleFollowOrganizer
};
