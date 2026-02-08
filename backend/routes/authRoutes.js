
const express = require('express');
const router = express.Router();
const { registerParticipant, loginUser } = require('../controllers/authController');

router.post('/register', registerParticipant);
router.post('/login', loginUser);

const PasswordResetRequest = require('../models/PasswordResetRequest');
router.post('/reset-request', async (req, res) => {
    try {
        const { email, organizerName, reason } = req.body;
        const newRequest = new PasswordResetRequest({ email, organizerName, reason });
        await newRequest.save();
        res.status(201).json({ message: 'Reset request submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
