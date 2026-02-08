
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const seedAdmin = async () => {
    await connectDB();

    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
        console.log('Admin already exists');
        process.exit();
    }

    const admin = await User.create({
        role: 'admin',
        email: 'admin@system.local',
        password: 'adminpassword123', // In production using environment variable is better
        firstName: 'System',
        lastName: 'Admin'
    });

    console.log('Admin created:', admin.email);
    process.exit();
};

seedAdmin();
