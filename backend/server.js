
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config();

connectDB();

const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Vite frontend port
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const eventRoutes = require('./routes/eventRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Socket.io
io.on('connection', (socket) => {
    // console.log('User connected:', socket.id);

    socket.on('join_event', (eventId) => {
        socket.join(eventId);
    });

    socket.on('leave_event', (eventId) => {
        socket.leave(eventId);
    });

    socket.on('send_message', (data) => {
        io.to(data.eventId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
    });
});

app.set('io', io);

const PORT = process.env.PORT || 5000;
const createAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });

        if (!adminExists) {
            await User.create({
                email: 'admin@system.com',
                password: 'admin123',
                role: 'admin'
            });

            console.log('Admin account created');
        } else {
            console.log('Admin already exists');
        }
    } catch (error) {
        console.error('Error creating admin:', error.message);
    }
};


server.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await createAdmin();
});
