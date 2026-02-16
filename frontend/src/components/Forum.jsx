import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api/axios';
import toast from 'react-hot-toast';

const SOCKET_URL = 'http://localhost:5000';

const Forum = ({ eventId, user, isRegistered }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);
        newSocket.emit('join_event', eventId);

        newSocket.on('receive_message', (message) => {
            setMessages((prev) => [...prev, message]);
            if (message.isAnnouncement && message.senderId._id !== user._id) {
                toast(`New Announcement: ${message.content.substring(0, 30)}...`, { icon: '📢' });
            }
        });

        newSocket.on('message_updated', (updatedMsg) => {
            setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
        });

        newSocket.on('message_deleted', (msgId) => {
            setMessages(prev => prev.filter(m => m._id !== msgId));
        });

        const fetchHistory = async () => {
            try {
                const { data } = await api.get(`/messages/${eventId}`);
                setMessages(data);
            } catch (err) {
                console.error("Failed to load messages", err);
            }
        };
        fetchHistory();

        return () => newSocket.disconnect();
    }, [eventId, user._id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !isRegistered) return;

        try {
            await api.post('/messages', {
                eventId,
                content: newMessage,
                parentMessageId: replyTo?._id,
                isAnnouncement: isAnnouncement && user.role === 'organizer'
            });
            setNewMessage('');
            setIsAnnouncement(false);
            setReplyTo(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send message");
        }
    };

    const handleReact = async (msgId, emoji) => {
        try {
            await api.put(`/messages/${msgId}/react`, { emoji });
        } catch (err) { console.error(err); }
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

    const MessageBubble = ({ msg, isReply = false }) => {
        const reactions = msg.reactions || {};
        const isOwn = msg.senderId._id === user._id;
        const isOrg = msg.senderId.role === 'organizer';

        return (
            <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${isReply ? 'ml-8 mt-1' : 'mt-4'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm relative ${msg.isAnnouncement ? 'bg-amber-50 border-2 border-amber-200 w-full' :
                        isOwn ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                    }`}>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isOwn ? 'text-indigo-100' : 'text-gray-400'}`}>
                            {msg.senderId.firstName} {isOrg && '• ORGANIZER 👑'}
                        </span>
                        <div className="flex items-center gap-1">
                            {msg.isPinned && <span className="text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded font-bold">PINNED</span>}
                            {user.role === 'organizer' && (
                                <div className="flex bg-black bg-opacity-5 rounded px-1">
                                    <button onClick={() => handlePin(msg._id)} className="p-1 hover:scale-110 transition-transform">📌</button>
                                    <button onClick={() => handleDelete(msg._id)} className="p-1 hover:scale-110 transition-transform">🗑</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.isAnnouncement ? 'font-medium text-amber-900' : ''}`}>
                        {msg.isAnnouncement && <span className="mr-2">📢</span>}
                        {msg.content}
                    </p>

                    {/* Reactions & Actions */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        {Object.entries(reactions).map(([emoji, users]) => (
                            <button
                                key={emoji}
                                onClick={() => handleReact(msg._id, emoji)}
                                className={`text-xs px-2 py-0.5 rounded-full border transition-all ${users.includes(user._id) ? 'bg-indigo-50 border-indigo-200 scale-105' : 'bg-white border-gray-100'
                                    }`}
                            >
                                <span className="mr-1">{emoji}</span>
                                <span className={users.includes(user._id) ? 'text-indigo-600 font-bold' : 'text-gray-400'}>{users.length}</span>
                            </button>
                        ))}

                        {!isReply && (
                            <button
                                onClick={() => setReplyTo(msg)}
                                className={`text-[10px] font-bold hover:underline ${isOwn ? 'text-indigo-200' : 'text-indigo-600'}`}
                            >
                                REPLY
                            </button>
                        )}

                        <div className="group relative">
                            <button className={`text-[10px] p-1 rounded-full hover:bg-black hover:bg-opacity-5 opacity-40 hover:opacity-100`}>➕</button>
                            <div className="hidden group-hover:flex absolute bottom-full left-0 bg-white shadow-xl border rounded-full p-1 gap-1 mb-1 z-10 animate-in fade-in slide-in-from-bottom-1">
                                {['👍', '❤️', '🔥', '😂', '😮', '🙌'].map(e => (
                                    <button key={e} onClick={() => handleReact(msg._id, e)} className="hover:scale-125 transition-transform p-1">{e}</button>
                                ))}
                            </div>
                        </div>

                        <span className={`text-[9px] ml-auto opacity-50`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                {/* Replies */}
                {messages.filter(m => m.parentMessageId === msg._id).map(reply => (
                    <MessageBubble key={reply._id} msg={reply} isReply={true} />
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[600px] bg-gray-50 rounded-2xl overflow-hidden animate-in fade-in">
            {/* Header */}
            <div className="bg-white px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-gray-900">Event Discussion</h3>
                    <p className="text-[10px] text-gray-500 font-medium">{messages.length} messages shared</p>
                </div>
                {!isRegistered && (
                    <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-full font-bold">READ ONLY</span>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {messages.filter(m => !m.parentMessageId).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <p className="text-sm font-medium italic">No messages yet. Be the first!</p>
                    </div>
                ) : (
                    messages.filter(m => !m.parentMessageId).map(msg => (
                        <MessageBubble key={msg._id} msg={msg} />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
                {replyTo && (
                    <div className="mb-3 flex items-center justify-between bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase">Replying to {replyTo.senderId.firstName}</span>
                            <span className="text-xs text-indigo-400 truncate max-w-[200px]">"{replyTo.content}"</span>
                        </div>
                        <button onClick={() => setReplyTo(null)} className="text-indigo-400 hover:text-indigo-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                )}

                <form onSubmit={handleSend} className="relative">
                    <textarea
                        disabled={!isRegistered}
                        rows={isAnnouncement ? 3 : 1}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isRegistered ? "Type your message..." : "Register to join the conversation"}
                        className={`w-full border border-gray-200 rounded-xl px-4 py-3 pb-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none shadow-sm ${!isRegistered ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                    />

                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {user.role === 'organizer' && (
                                <button
                                    type="button"
                                    onClick={() => setIsAnnouncement(!isAnnouncement)}
                                    className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all border ${isAnnouncement ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-gray-50 border-gray-200 text-gray-500'
                                        }`}
                                >
                                    ANNOUNCEMENT {isAnnouncement ? 'ON' : 'OFF'}
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || !isRegistered}
                            className={`bg-indigo-600 text-white px-6 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:shadow-none`}
                        >
                            SEND
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Forum;
