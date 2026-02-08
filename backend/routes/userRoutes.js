const express = require('express');
const router = express.Router();
const {
    getUserProfile,
    updateUserProfile,
    // getAllOrganizers, // Replaced/Renamed in controller or use new ones
    getPublicOrganizers,
    getOrganizerPublicProfile,
    toggleFollowOrganizer
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// Public/Private mixed based on requirement? List is usually public, follow is private
// Requirement says "Participant Features" -> "Clubs / Organizers Listing Page"
// "Action: Follow / Unfollow" -> Private
// Let's make list public but only participants can follow

router.get('/organizers', getPublicOrganizers);
router.get('/organizers/:id', getOrganizerPublicProfile);
router.put('/organizers/:organizerId/follow', protect, toggleFollowOrganizer);

module.exports = router;
