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
    scanTicket,
    getPendingVerifications,
    exportAttendanceCSV,
    checkRegistration
} = require('../controllers/ticketController');
const { protect, organizer, participant } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, participant, registerForEvent);
router.get('/my-tickets', protect, participant, getMyTickets);
router.put('/:id/cancel', protect, cancelTicket);
router.get('/check/:eventId', protect, participant, checkRegistration);

// Organizer Routes
router.get('/organizer/pending', protect, organizer, getPendingVerifications);
router.get('/event/:eventId', protect, organizer, getEventParticipants);

// Payment Verification Routes
router.post('/:id/payment-proof', protect, upload.single('paymentProof'), uploadPaymentProof);
router.put('/:id/approve', protect, organizer, approveOrder);
router.put('/:id/reject', protect, organizer, rejectOrder);

// Attendance Routes
router.post('/scan', protect, organizer, scanTicket);
router.get('/event/:eventId/export', protect, organizer, exportAttendanceCSV);

module.exports = router;
