
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

/* 
 * @desc    Register a new participant
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerParticipant = async (req, res) => {
    try {
        const { firstName, lastName, email, password, contactNumber, collegeName, interests } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Domain validation for IIIT
        const isIIIT = email.endsWith('iiit.ac.in');
        const participantType = isIIIT ? 'Student' : 'External';

        const user = await User.create({
            role: 'participant',
            firstName,
            lastName,
            email,
            password,
            contactNumber,
            collegeName,
            isIIIT,
            participantType,
            interests
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: `${user.firstName} ${user.lastName || ''}`.trim(),
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/* 
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // Check if account is active (Specifically for Organizers)
            if (user.role === 'organizer' && user.isActive === false) {
                return res.status(403).json({ message: 'Your organizational account has been disabled or archived. Please contact administration.' });
            }

            const userData = {
                _id: user._id,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            };

            // Add name fields based on role
            if (user.role === 'organizer') {
                userData.name = user.organizerName;
                userData.organizerName = user.organizerName;
                userData.description = user.description;
                userData.category = user.category;
                userData.contactEmail = user.contactEmail;
                userData.discordWebhookUrl = user.discordWebhookUrl;
                userData.contactNumber = user.contactNumber;
            } else if (user.role === 'participant') {
                userData.name = `${user.firstName} ${user.lastName}`;
                userData.firstName = user.firstName;
                userData.lastName = user.lastName;
                userData.contactNumber = user.contactNumber;
                userData.collegeName = user.collegeName;
                userData.participantType = user.participantType;
                userData.interests = user.interests;
                // Ensure isIIIT is current based on email, or just pass from DB
                userData.isIIIT = user.email.endsWith('iiit.ac.in');
            } else {
                userData.name = 'Admin';
            }

            res.json(userData);
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerParticipant, loginUser };
