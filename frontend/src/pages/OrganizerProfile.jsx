import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const formatFee = (fee) => fee === 0 ? 'FREE' : `₹${fee}`;

const categoryColors = {
    'Technical': { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    'Cultural': { bg: '#fdf4ff', text: '#9333ea', border: '#e9d5ff' },
    'Sports': { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    'Literary': { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    'Social': { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
};
const getCategoryStyle = (cat) => categoryColors[cat] || { bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb' };

// ─── Event Card ───────────────────────────────────────────────────────────────
const EventCard = ({ event }) => {
    const navigate = useNavigate();
    const isMerch = event.type === 'merchandise';
    return (
        <div
            onClick={() => navigate(`/events/${event._id}`)}
            style={{
                background: 'white', borderRadius: '16px', padding: '20px',
                border: '1px solid #f3f4f6', cursor: 'pointer',
                borderLeft: isMerch ? '4px solid #10b981' : '4px solid #6d28d9',
                transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '10px'
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge ${isMerch ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                    {isMerch ? '🛍 Merch' : '🎟 Event'}
                </span>
                <span style={{
                    fontSize: '0.8rem', fontWeight: 900,
                    color: event.registrationFee === 0 ? '#10b981' : '#6d28d9',
                    background: event.registrationFee === 0 ? '#ecfdf5' : '#f5f3ff',
                    padding: '3px 8px', borderRadius: '6px'
                }}>
                    {formatFee(event.registrationFee)}
                </span>
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827', margin: 0 }}>{event.name}</h4>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                {formatDate(event.startDate)}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6d28d9' }}>View Details →</span>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const OrganizerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const isOwnProfile = user && user.role === 'organizer' && user._id === id;

    const [organizer, setOrganizer] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [isFollowed, setIsFollowed] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get(`/users/organizers/${id}`);
                setOrganizer(data.organizer);
                setEditData(data.organizer);
                setEvents(data.events || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    useEffect(() => {
        if (user?.followedOrganizers) {
            setIsFollowed(user.followedOrganizers.map(i => i.toString()).includes(id));
        }
    }, [user, id]);

    const handleFollowToggle = async () => {
        if (!user) { toast.warning('Please login to follow clubs'); return; }
        setFollowLoading(true);
        try {
            const { data } = await api.put(`/users/organizers/${id}/follow`);
            setIsFollowed(!isFollowed);
            toast.success(isFollowed ? 'Unfollowed successfully' : 'Followed successfully');
            updateUser({ followedOrganizers: data.followedOrganizers });
        } catch (e) {
            toast.error('Error updating follow status');
        } finally {
            setFollowLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const { data } = await api.put('/users/profile', {
                organizerName: editData.organizerName,
                category: editData.category,
                description: editData.description,
                contactEmail: editData.contactEmail,
                discordWebhookUrl: editData.discordWebhookUrl
            });
            setOrganizer({ ...organizer, ...data });
            setEditMode(false);
            toast.success('Profile updated successfully!');
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Error updating profile');
        } finally {
            setSaving(false);
        }
    };

    // Split events into upcoming and past
    const now = new Date();
    const upcoming = events.filter(e => new Date(e.startDate) >= now || e.status === 'ongoing' || e.status === 'published');
    const past = events.filter(e => new Date(e.startDate) < now && e.status === 'completed');

    const displayedEvents = activeTab === 'upcoming' ? upcoming : past;

    if (loading) {
        return (
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
                <div style={{ background: 'white', borderRadius: '24px', padding: '40px', border: '1px solid #f3f4f6' }}>
                    {[60, 40, 80, 60].map((w, i) => (
                        <div key={i} style={{ height: '16px', width: `${w}%`, background: '#f3f4f6', borderRadius: '8px', marginBottom: '16px' }} />
                    ))}
                </div>
            </div>
        );
    }

    if (!organizer) {
        return (
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
                <h2 style={{ color: '#111827' }}>Organizer not found</h2>
                <button onClick={() => navigate('/clubs')} className="btn btn-primary" style={{ marginTop: '16px', borderRadius: '12px' }}>
                    Back to Clubs
                </button>
            </div>
        );
    }

    const catStyle = getCategoryStyle(organizer.category);

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 40px' }}>

            {/* Header controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <button
                    onClick={() => navigate('/clubs')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '0.85rem', fontWeight: 700, color: '#6b7280',
                        padding: '8px 0'
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Back to Clubs
                </button>
                {isOwnProfile && !editMode && (
                    <button
                        onClick={() => setEditMode(true)}
                        className="btn-primary"
                        style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            {/* Profile Card */}
            <div style={{
                background: 'white', borderRadius: '24px', overflow: 'hidden',
                border: '1px solid #f3f4f6', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                marginBottom: '28px'
            }}>
                {/* Banner */}
                <div style={{
                    height: '100px',
                    background: `linear-gradient(135deg, ${catStyle.text}18, ${catStyle.text}35)`,
                    borderBottom: `3px solid ${catStyle.border}`
                }} />

                {/* Profile info */}
                <div style={{ padding: '0 32px 32px' }}>
                    {/* Avatar */}
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '20px',
                        background: `linear-gradient(135deg, ${catStyle.text}33, ${catStyle.text}66)`,
                        border: `3px solid white`, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', fontWeight: 900, color: catStyle.text,
                        marginTop: '-40px', marginBottom: '16px'
                    }}>
                        {(organizer.organizerName || 'O')[0].toUpperCase()}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            {editMode ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', minWidth: '300px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Organizer Name</label>
                                        <input
                                            type="text"
                                            value={editData.organizerName || ''}
                                            onChange={e => setEditData({ ...editData, organizerName: e.target.value })}
                                            className="input"
                                            style={{ marginTop: '4px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Category</label>
                                            <select
                                                value={editData.category || ''}
                                                onChange={e => setEditData({ ...editData, category: e.target.value })}
                                                className="input"
                                                style={{ marginTop: '4px' }}
                                            >
                                                <option value="">Select Category</option>
                                                <option value="Technical">Technical</option>
                                                <option value="Cultural">Cultural</option>
                                                <option value="Sports">Sports</option>
                                                <option value="Literary">Literary</option>
                                                <option value="Social">Social</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Contact Email</label>
                                            <input
                                                type="email"
                                                value={editData.contactEmail || ''}
                                                onChange={e => setEditData({ ...editData, contactEmail: e.target.value })}
                                                className="input"
                                                style={{ marginTop: '4px' }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Login Email (Cannot be changed)</label>
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="input"
                                            style={{ marginTop: '4px', backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#9ca3af' }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#111827', margin: 0 }}>
                                            {organizer.organizerName}
                                        </h1>
                                        {organizer.isVerified && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '4px 10px', borderRadius: '8px' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="#2563eb"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                                        {organizer.category && (
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px',
                                                padding: '4px 10px', borderRadius: '8px',
                                                background: catStyle.bg, color: catStyle.text, border: `1.5px solid ${catStyle.border}`
                                            }}>
                                                {organizer.category}
                                            </span>
                                        )}
                                        {organizer.contactEmail && (
                                            <a href={`mailto:${organizer.contactEmail}`} style={{
                                                fontSize: '0.75rem', fontWeight: 700, color: '#6b7280',
                                                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px'
                                            }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                                {organizer.contactEmail}
                                            </a>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Follow button */}
                        <button
                            onClick={handleFollowToggle}
                            disabled={followLoading}
                            style={{
                                padding: '12px 28px', borderRadius: '14px',
                                background: isFollowed ? 'white' : 'linear-gradient(135deg, #6d28d9, #7c3aed)',
                                border: isFollowed ? '2px solid #e5e7eb' : '2px solid transparent',
                                fontSize: '0.9rem', fontWeight: 800,
                                color: isFollowed ? '#6b7280' : 'white',
                                cursor: followLoading ? 'not-allowed' : 'pointer',
                                opacity: followLoading ? 0.7 : 1,
                                transition: 'all 0.2s', whiteSpace: 'nowrap'
                            }}
                        >
                            {followLoading ? '...' : isFollowed ? '✓ Following' : '+ Follow'}
                        </button>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        {editMode ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Description</label>
                                    <textarea
                                        value={editData.description || ''}
                                        onChange={e => setEditData({ ...editData, description: e.target.value })}
                                        className="input"
                                        rows={4}
                                        style={{ marginTop: '4px', resize: 'vertical' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Discord Webhook URL (For Event Announcements)</label>
                                    <input
                                        type="url"
                                        placeholder="https://discord.com/api/webhooks/..."
                                        value={editData.discordWebhookUrl || ''}
                                        onChange={e => setEditData({ ...editData, discordWebhookUrl: e.target.value })}
                                        className="input"
                                        style={{ marginTop: '4px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                    <button
                                        onClick={() => { setEditMode(false); setEditData(organizer); }}
                                        style={{ padding: '10px 20px', borderRadius: '10px', background: '#f3f4f6', color: '#4b5563', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        className="btn-primary"
                                        style={{ padding: '10px 24px', borderRadius: '10px' }}
                                        disabled={saving}
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            organizer.description && (
                                <p style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: 1.7, marginBottom: 0 }}>
                                    {organizer.description}
                                </p>
                            )
                        )}
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: '24px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f3f4f6' }}>
                        <div>
                            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111827', margin: 0 }}>{events.length}</p>
                            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Events</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111827', margin: 0 }}>{upcoming.length}</p>
                            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upcoming</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111827', margin: 0 }}>{past.length}</p>
                            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Past</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Events Section */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#111827', margin: 0 }}>Events</h2>
                    {/* Tabs */}
                    <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '12px', padding: '4px', gap: '4px' }}>
                        {['upcoming', 'past'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '7px 18px', borderRadius: '9px', border: 'none',
                                    fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer',
                                    background: activeTab === tab ? 'white' : 'transparent',
                                    color: activeTab === tab ? '#111827' : '#9ca3af',
                                    boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                    transition: 'all 0.2s', textTransform: 'capitalize'
                                }}
                            >
                                {tab} ({tab === 'upcoming' ? upcoming.length : past.length})
                            </button>
                        ))}
                    </div>
                </div>

                {displayedEvents.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                        {displayedEvents.map(event => <EventCard key={event._id} event={event} />)}
                    </div>
                ) : (
                    <div style={{
                        background: 'white', borderRadius: '20px', padding: '48px 24px',
                        textAlign: 'center', border: '1px solid #f3f4f6'
                    }}>
                        <p style={{ fontSize: '0.9rem', color: '#9ca3af', fontWeight: 700, margin: 0 }}>
                            No {activeTab} events
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizerProfile;
