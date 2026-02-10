require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const User = require('./backend/models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        const users = await User.find({}).select('email role firstName lastName organizerName');
        console.log('\n=== Existing Users ===');
        console.log(JSON.stringify(users, null, 2));
        console.log(`\nTotal users: ${users.length}`);
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
