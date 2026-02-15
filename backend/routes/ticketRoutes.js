const express = require('express');
const router = express.Router();
const {
    registerForEvent,
    getMyTickets,
    cancelTicket,
    getEventParticipants,
    uploadPaymentProof,
    approveOrder,
    rejectOrder,
    getPendingVerifications
} = require('../controllers/ticketController');
const { protect, organizer } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, registerForEvent);
router.get('/my-tickets', protect, getMyTickets);
router.put('/:id/cancel', protect, cancelTicket);

// Organizer Routes
router.get('/organizer/pending', protect, organizer, getPendingVerifications);
router.get('/event/:eventId', protect, organizer, getEventParticipants);

// Payment Verification Routes
router.post('/:id/payment-proof', protect, upload.single('paymentProof'), uploadPaymentProof);
router.put('/:id/approve', protect, organizer, approveOrder);
router.put('/:id/reject', protect, organizer, rejectOrder);

module.exports = router;
