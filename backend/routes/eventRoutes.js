const express = require('express');
const router = express.Router();
const {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    getMyEvents,
    getEventStats
} = require('../controllers/eventController');
const { protect, organizer } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected routes (Organizer only)
router.post('/', protect, organizer, createEvent);
router.get('/my-events', protect, organizer, getMyEvents);
router.put('/:id', protect, organizer, updateEvent);
router.get('/:id/stats', protect, organizer, getEventStats);

module.exports = router;
