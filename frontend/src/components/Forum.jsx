import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';

// Connect to socket only once or per instance? 
// Usually keep connection in context or top level, but for simplicity here we connect in component
// Note: Ensure URL matches backend
const SOCKET_URL = 'http://localhost:5000';

const Forum = ({ eventId, user }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Initialize Socket
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        // Join Room
        newSocket.emit('join_event', eventId);

        // Listen for messages
        newSocket.on('receive_message', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        newSocket.on('message_updated', (updatedMsg) => {
            setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
        });

        newSocket.on('message_deleted', (msgId) => {
            setMessages(prev => prev.filter(m => m._id !== msgId));
        });

        // Fetch initial history
        const fetchHistory = async () => {
            try {
                const { data } = await api.get(`/messages/${eventId}`);
                setMessages(data);
            } catch (err) {
                console.error("Failed to load messages", err);
            }
        };
        fetchHistory();

        return () => {
            newSocket.disconnect();
        };
    }, [eventId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await api.post('/messages', {
                eventId,
                content: newMessage
            });
            // Socket emission is handled by backend or we can optimistically add
            setNewMessage('');
        } catch (err) {
            console.error(err);
        }
    };

    const handlePin = async (msgId) => {
        try {
            await api.put(`/messages/${msgId}/pin`);
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (msgId) => {
        if (!window.confirm("Delete message?")) return;
        try {
            await api.delete(`/messages/${msgId}`);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="flex flex-col h-[500px] border rounded bg-gray-50">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && <p className="text-center text-gray-500 my-10">No messages yet. Start the discussion!</p>}

                {messages.map((msg) => (
                    <div key={msg._id} className={`flex flex-col ${msg.senderId._id === user._id ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.senderId._id === user._id ? 'bg-indigo-100' : 'bg-white border'}`}>
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-bold text-gray-700">
                                    {msg.senderId.firstName} {msg.senderId.role === 'organizer' && '👑'}
                                </span>
                                {msg.isPinned && <span className="text-xs bg-yellow-200 px-1 rounded">Pinned 📌</span>}
                                {user.role === 'organizer' && (
                                    <div className="flex gap-1">
                                        <button onClick={() => handlePin(msg._id)} className="text-xs text-gray-400 hover:text-yellow-600" title="Pin">📌</button>
                                        <button onClick={() => handleDelete(msg._id)} className="text-xs text-gray-400 hover:text-red-600" title="Delete">🗑</button>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                            <span className="text-[10px] text-gray-400 mt-1 block text-right">
                                {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
                    Send
                </button>
            </form>
        </div>
    );
};

export default Forum;
