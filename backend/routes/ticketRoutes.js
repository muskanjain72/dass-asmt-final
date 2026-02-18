const express = require('express');
const router = express.Router();
const multer = require('multer');
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
    checkRegistration,
    exportTicketsICS,
    getCalendarLinks,
    acceptRegistration,
    rejectRegistration
} = require('../controllers/ticketController');
const { protect, organizer, participant } = require('../middleware/authMiddleware');

// Memory storage for Cloudinary uploads
const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', protect, participant, registerForEvent);
router.get('/my-tickets', protect, participant, getMyTickets);
router.put('/:id/cancel', protect, cancelTicket);
router.get('/check/:eventId', protect, participant, checkRegistration);
router.get('/export-ics', protect, participant, exportTicketsICS);
router.get('/:id/calendar-links', protect, participant, getCalendarLinks);

// Organizer Routes
router.get('/organizer/pending', protect, organizer, getPendingVerifications);
router.get('/event/:eventId', protect, organizer, getEventParticipants);

// Payment Proof Upload (participant uploads screenshot)
router.post('/:id/payment-proof', protect, memUpload.single('paymentProof'), uploadPaymentProof);

// Merch Order Approval / Rejection (organizer)
router.put('/:id/approve', protect, organizer, approveOrder);
router.put('/:id/reject-payment', protect, organizer, rejectOrder);

// Normal Event Registration Approval Routes (organizer)
router.put('/:id/accept', protect, organizer, acceptRegistration);
router.put('/:id/reject', protect, organizer, rejectRegistration);

// Attendance Routes
router.post('/scan', protect, organizer, scanTicket);
router.get('/event/:eventId/export', protect, organizer, exportAttendanceCSV);

module.exports = router;

