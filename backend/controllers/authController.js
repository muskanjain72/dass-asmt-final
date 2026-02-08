
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
        const { firstName, lastName, email, password, contactNumber, collegeName, isIIIT, interests } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Domain validation for IIIT
        if (isIIIT) {
            if (!email.endsWith('@iiit.ac.in') && !email.endsWith('@students.iiit.ac.in')) { // Adjust domain as needed
                return res.status(400).json({ message: 'Must use IIIT email for IIIT participant type' });
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
            interests
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: `${user.firstName} ${user.lastName}`,
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
            if (user.role === 'participant') {
                userData.name = `${user.firstName} ${user.lastName}`;
            } else if (user.role === 'organizer') {
                userData.name = user.organizerName;
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
