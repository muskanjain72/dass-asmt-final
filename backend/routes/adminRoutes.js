const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    createOrganizer,
    getOrganizers,
    deleteOrganizer,
    toggleOrganizerStatus,
    getAllResetRequests,
    handleResetRequest
} = require('../controllers/adminController');

router.post('/organizers', protect, admin, createOrganizer);
router.get('/organizers', protect, admin, getOrganizers);
router.delete('/organizers/:id', protect, admin, deleteOrganizer);
router.put('/organizers/:id/status', protect, admin, toggleOrganizerStatus);

router.get('/reset-requests', protect, admin, getAllResetRequests);
router.put('/reset-requests/:id', protect, admin, handleResetRequest);

module.exports = router;
