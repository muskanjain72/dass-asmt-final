
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

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

server.listen(PORT, console.log(`Server running on port ${PORT}`));
