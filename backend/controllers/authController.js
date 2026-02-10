
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
        const { firstName, lastName, email, password, contactNumber, collegeName, isIIIT, participantType, interests } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Domain validation for IIIT
        if (isIIIT) {
            if (!email.endsWith('iiit.ac.in')) { // Allow subdomains like students.iiit.ac.in
                return res.status(400).json({ message: 'Must use IIIT email for IIIT participant type (ends with iiit.ac.in)' });
            }
        }

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
