const express = require('express');
const router = express.Router();
const {
    registerForEvent,
    getMyTickets,
    cancelTicket,
    getEventParticipants
} = require('../controllers/ticketController');
const { protect, organizer } = require('../middleware/authMiddleware'); // Needs organizer middleware

router.post('/', protect, registerForEvent);
router.get('/my-tickets', protect, getMyTickets);
router.put('/:id/cancel', protect, cancelTicket);
router.get('/event/:eventId', protect, organizer, getEventParticipants);

module.exports = router;
