const express = require('express');
const router = express.Router();
const { getMessages, postMessage, togglePin, deleteMessage } = require('../controllers/messageController');
const { protect, organizer } = require('../middleware/authMiddleware');

router.get('/:eventId', protect, getMessages);
router.post('/', protect, postMessage);
router.put('/:id/pin', protect, organizer, togglePin);
router.delete('/:id', protect, organizer, deleteMessage);

module.exports = router;
