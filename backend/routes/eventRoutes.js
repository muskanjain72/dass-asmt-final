const express = require('express');
const router = express.Router();
const {
    createEvent,
    getEvents,
    getTrendingEvents,
    getEventById,
    updateEvent,
    getMyEvents,
    getEventStats
} = require('../controllers/eventController');
const { protect, optionalProtect, organizer } = require('../middleware/authMiddleware');

// Public routes
router.get('/', optionalProtect, getEvents);
router.get('/trending', getTrendingEvents);

// Protected routes (Organizer only)
router.post('/', protect, organizer, createEvent);
router.get('/my-events', protect, organizer, getMyEvents);
router.get('/:id', getEventById); // Specific routes like /my-events must come before parameter routes like /:id
router.put('/:id', protect, organizer, updateEvent);
router.get('/:id/stats', protect, organizer, getEventStats);

module.exports = router;

