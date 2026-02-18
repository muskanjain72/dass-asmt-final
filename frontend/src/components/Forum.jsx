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
    const [unreadCount, setUnreadCount] = useState(0);
    const [isFocused, setIsFocused] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // msgId pending delete
    const [pinnedOpen, setPinnedOpen] = useState(true);
    const messagesEndRef = useRef(null);
    const isFocusedRef = useRef(true);

    useEffect(() => {
        isFocusedRef.current = isFocused;
    }, [isFocused]);

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);
        newSocket.emit('join_event', eventId);

        newSocket.on('receive_message', (message) => {
            setMessages((prev) => [...prev, message]);
            // Count unread if not focused
            if (!isFocusedRef.current) {
                setUnreadCount(c => c + 1);
            }
            if (message.isAnnouncement && message.senderId._id !== user._id) {
                toast(`📢 ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`, {
                    duration: 5000,
                    style: { background: '#fffbeb', border: '1.5px solid #fcd34d', color: '#92400e', fontWeight: 700 }
                });
            } else if (message.senderId._id !== user._id && !isFocusedRef.current) {
                toast(`💬 ${message.senderId.firstName}: ${message.content.substring(0, 40)}...`, { duration: 3000 });
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
                console.error('Failed to load messages', err);
            }
        };
        fetchHistory();

        return () => newSocket.disconnect();
    }, [eventId, user._id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFocus = () => {
        setIsFocused(true);
        setUnreadCount(0);
    };

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
            toast.error(err.response?.data?.message || 'Failed to send message');
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
        try {
            await api.delete(`/messages/${msgId}`);
            setDeleteConfirm(null);
        } catch (err) { console.error(err); }
    };

    // Pinned messages
    const pinnedMessages = messages.filter(m => m.isPinned);
    const topLevelMessages = messages.filter(m => !m.parentMessageId);

    const MessageBubble = ({ msg, isReply = false }) => {
        const reactions = msg.reactions || {};
        const isOwn = msg.senderId._id === user._id;
        const isOrg = msg.senderId.role === 'organizer';
        const isPendingDelete = deleteConfirm === msg._id;

        return (
            <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${isReply ? 'ml-8 mt-1' : 'mt-4'}`}>
                {/* Announcement Banner */}
                {msg.isAnnouncement ? (
                    <div style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                        border: '2px solid #fcd34d',
                        borderRadius: '16px',
                        padding: '14px 16px',
                        marginBottom: '4px',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '1.1rem' }}>📢</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#92400e', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Announcement
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#b45309', marginLeft: 'auto' }}>
                                {msg.senderId.firstName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {user.role === 'organizer' && (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button onClick={() => handlePin(msg._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', opacity: 0.7 }} title="Pin">📌</button>
                                    {isPendingDelete ? (
                                        <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            <button onClick={() => handleDelete(msg._id)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '2px 8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}>Delete</button>
                                            <button onClick={() => setDeleteConfirm(null)} style={{ background: '#e5e7eb', border: 'none', borderRadius: '6px', padding: '2px 8px', fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                        </span>
                                    ) : (
                                        <button onClick={() => setDeleteConfirm(msg._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', opacity: 0.7 }} title="Delete">🗑</button>
                                    )}
                                </div>
                            )}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#78350f', lineHeight: 1.5 }}>{msg.content}</p>
                        {/* Reactions */}
                        {Object.keys(reactions).length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                                {Object.entries(reactions).map(([emoji, users]) => (
                                    <button key={emoji} onClick={() => handleReact(msg._id, emoji)}
                                        style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '20px', border: `1px solid ${users.includes(user._id) ? '#fcd34d' : '#e5e7eb'}`, background: users.includes(user._id) ? '#fef3c7' : 'white', cursor: 'pointer' }}>
                                        {emoji} {users.length}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm relative ${isOwn ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}>
                        {/* Header */}
                        <div className="flex items-center justify-between gap-4 mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isOwn ? 'text-indigo-100' : 'text-gray-400'}`}>
                                {msg.senderId.firstName} {isOrg && '• ORGANIZER 👑'}
                            </span>
                            <div className="flex items-center gap-1">
                                {msg.isPinned && <span className="text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded font-bold">PINNED</span>}
                                {user.role === 'organizer' && (
                                    <div className="flex bg-black bg-opacity-5 rounded px-1">
                                        <button onClick={() => handlePin(msg._id)} className="p-1 hover:scale-110 transition-transform" title="Pin/Unpin">📌</button>
                                        {isPendingDelete ? (
                                            <span style={{ display: 'flex', gap: '3px', alignItems: 'center', marginLeft: '2px' }}>
                                                <button onClick={() => handleDelete(msg._id)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', padding: '1px 6px', fontSize: '0.6rem', fontWeight: 800, cursor: 'pointer' }}>✓</button>
                                                <button onClick={() => setDeleteConfirm(null)} style={{ background: '#e5e7eb', border: 'none', borderRadius: '5px', padding: '1px 6px', fontSize: '0.6rem', fontWeight: 800, cursor: 'pointer' }}>✕</button>
                                            </span>
                                        ) : (
                                            <button onClick={() => setDeleteConfirm(msg._id)} className="p-1 hover:scale-110 transition-transform" title="Delete">🗑</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap`}>{msg.content}</p>

                        {/* Reactions & Actions */}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            {Object.entries(reactions).map(([emoji, users]) => (
                                <button key={emoji} onClick={() => handleReact(msg._id, emoji)}
                                    className={`text-xs px-2 py-0.5 rounded-full border transition-all ${users.includes(user._id) ? 'bg-indigo-50 border-indigo-200 scale-105' : 'bg-white border-gray-100'}`}>
                                    <span className="mr-1">{emoji}</span>
                                    <span className={users.includes(user._id) ? 'text-indigo-600 font-bold' : 'text-gray-400'}>{users.length}</span>
                                </button>
                            ))}

                            {!isReply && (
                                <button onClick={() => setReplyTo(msg)}
                                    className={`text-[10px] font-bold hover:underline ${isOwn ? 'text-indigo-200' : 'text-indigo-600'}`}>
                                    REPLY
                                </button>
                            )}

                            <div className="group relative">
                                <button className="text-[10px] p-1 rounded-full hover:bg-black hover:bg-opacity-5 opacity-40 hover:opacity-100">➕</button>
                                <div className="hidden group-hover:flex absolute bottom-full left-0 bg-white shadow-xl border rounded-full p-1 gap-1 mb-1 z-10">
                                    {['👍', '❤️', '🔥', '😂', '😮', '🙌'].map(e => (
                                        <button key={e} onClick={() => handleReact(msg._id, e)} className="hover:scale-125 transition-transform p-1">{e}</button>
                                    ))}
                                </div>
                            </div>

                            <span className="text-[9px] ml-auto opacity-50">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                )}

                {/* Replies */}
                {messages.filter(m => m.parentMessageId === msg._id).map(reply => (
                    <MessageBubble key={reply._id} msg={reply} isReply={true} />
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col bg-gray-50 rounded-2xl overflow-hidden animate-in fade-in" style={{ height: '640px' }}>
            {/* Header */}
            <div className="bg-white px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-gray-900">Event Discussion</h3>
                    <p className="text-[10px] text-gray-500 font-medium">{messages.length} messages</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {unreadCount > 0 && (
                        <span style={{ background: '#6d28d9', color: 'white', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px' }}>
                            {unreadCount} new
                        </span>
                    )}
                    {!isRegistered && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-full font-bold">READ ONLY</span>
                    )}
                </div>
            </div>

            {/* Pinned Messages Section */}
            {pinnedMessages.length > 0 && (
                <div style={{ background: '#fefce8', borderBottom: '1px solid #fde68a', padding: '0' }}>
                    <button
                        onClick={() => setPinnedOpen(o => !o)}
                        style={{ width: '100%', padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}
                    >
                        <span style={{ fontSize: '0.8rem' }}>📌</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {pinnedMessages.length} Pinned Message{pinnedMessages.length > 1 ? 's' : ''}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#b45309' }}>{pinnedOpen ? '▲' : '▼'}</span>
                    </button>
                    {pinnedOpen && (
                        <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {pinnedMessages.map(msg => (
                                <div key={msg._id} style={{ background: 'white', borderRadius: '10px', padding: '10px 14px', border: '1px solid #fde68a', fontSize: '0.82rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 800, color: '#92400e', fontSize: '0.7rem' }}>
                                            {msg.senderId.firstName} {msg.senderId.role === 'organizer' ? '👑' : ''}
                                        </span>
                                        <span style={{ fontSize: '0.65rem', color: '#b45309' }}>
                                            {new Date(msg.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, color: '#374151', lineHeight: 1.4 }}>{msg.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar" onClick={handleFocus}>
                {topLevelMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <p className="text-sm font-medium italic">No messages yet. Be the first!</p>
                    </div>
                ) : (
                    topLevelMessages.map(msg => (
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

                {isAnnouncement && (
                    <div style={{ marginBottom: '8px', padding: '6px 12px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📢 This will be posted as an announcement visible to all participants
                    </div>
                )}

                <form onSubmit={handleSend} className="relative">
                    <textarea
                        disabled={!isRegistered}
                        rows={isAnnouncement ? 3 : 1}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onFocus={handleFocus}
                        placeholder={isRegistered ? (isAnnouncement ? 'Type your announcement...' : 'Type your message...') : 'Register to join the conversation'}
                        className={`w-full border border-gray-200 rounded-xl px-4 py-3 pb-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none shadow-sm ${!isRegistered ? 'bg-gray-50 cursor-not-allowed' : ''} ${isAnnouncement ? 'border-amber-300 bg-amber-50' : ''}`}
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
                                    className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all border ${isAnnouncement ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                                >
                                    📢 {isAnnouncement ? 'ANNOUNCEMENT ON' : 'ANNOUNCEMENT'}
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || !isRegistered}
                            className={`px-6 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all disabled:opacity-50 disabled:shadow-none text-white ${isAnnouncement ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {isAnnouncement ? '📢 POST' : 'SEND'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Forum;
