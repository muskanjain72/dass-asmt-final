
const express = require('express');
const router = express.Router();
const { registerParticipant, loginUser } = require('../controllers/authController');

router.post('/register', registerParticipant);
router.post('/login', loginUser);

const PasswordResetRequest = require('../models/PasswordResetRequest');
const User = require('../models/User');

router.post('/reset-request', async (req, res) => {
    try {
        const { email, organizerName, reason } = req.body;

        // Check if organizer exists by login email OR contact email
        const user = await User.findOne({
            $or: [{ email: email }, { contactEmail: email }],
            role: 'organizer'
        });
        if (!user) {
            return res.status(404).json({ message: 'Organizer account not found for this email' });
        }

        const newRequest = new PasswordResetRequest({ email, organizerName, reason });
        await newRequest.save();
        res.status(201).json({ message: 'Reset request submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/reset-status/:email', async (req, res) => {
    try {
        const requests = await PasswordResetRequest.find({ email: req.params.email }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
