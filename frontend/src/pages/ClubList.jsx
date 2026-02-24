import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

// ─── Category color map ───────────────────────────────────────────────────────
const categoryColors = {
    'Technical': { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    'Cultural': { bg: '#fdf4ff', text: '#9333ea', border: '#e9d5ff' },
    'Sports': { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    'Literary': { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    'Social': { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
};
const getCategoryStyle = (cat) => categoryColors[cat] || { bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb' };

// ─── Organizer Card ───────────────────────────────────────────────────────────
const OrganizerCard = ({ org, isFollowed, onFollowToggle, onViewProfile }) => {
    const [following, setFollowing] = useState(false);
    const catStyle = getCategoryStyle(org.category);

    const handleFollow = async () => {
        setFollowing(true);
        await onFollowToggle(org._id);
        setFollowing(false);
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #f3f4f6',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.10)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{
                    fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px',
                    padding: '4px 10px', borderRadius: '8px',
                    background: catStyle.bg, color: catStyle.text, border: `1.5px solid ${catStyle.border}`
                }}>
                    {org.category || 'Club'}
                </span>
                {org.isVerified && (
                    <span title="Verified" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '4px 8px', borderRadius: '8px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="#2563eb"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                        Verified
                    </span>
                )}
            </div>

            {/* Avatar + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                    width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0,
                    background: `linear-gradient(135deg, ${catStyle.text}22, ${catStyle.text}44)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem', fontWeight: 900, color: catStyle.text,
                    border: `2px solid ${catStyle.border}`
                }}>
                    {(org.organizerName || 'O')[0].toUpperCase()}
                </div>
                <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.2 }}>
                        {org.organizerName}
                    </h3>
                    {org.contactEmail && (
                        <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '4px 0 0 0', fontWeight: 600 }}>
                            {org.contactEmail}
                        </p>
                    )}
                </div>
            </div>

            {/* Description */}
            <p style={{
                fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.6, margin: 0,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
                {org.description || 'Connecting enthusiasts and local talents for amazing experiences.'}
            </p>

            {/* Footer actions */}
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px', display: 'flex', gap: '10px', marginTop: 'auto' }}>
                <button
                    onClick={() => onViewProfile(org._id)}
                    style={{
                        flex: 1, padding: '9px 0', borderRadius: '12px',
                        background: '#f9fafb', border: '2px solid #f3f4f6',
                        fontSize: '0.8rem', fontWeight: 800, color: '#374151',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.target.style.background = '#f3f4f6'; }}
                    onMouseLeave={e => { e.target.style.background = '#f9fafb'; }}
                >
                    View Profile
                </button>
                <button
                    onClick={handleFollow}
                    disabled={following}
                    style={{
                        flex: 1, padding: '9px 0', borderRadius: '12px',
                        background: isFollowed ? 'white' : 'linear-gradient(135deg, #6d28d9, #7c3aed)',
                        border: isFollowed ? '2px solid #e5e7eb' : '2px solid transparent',
                        fontSize: '0.8rem', fontWeight: 800,
                        color: isFollowed ? '#6b7280' : 'white',
                        cursor: following ? 'not-allowed' : 'pointer',
                        opacity: following ? 0.7 : 1,
                        transition: 'all 0.2s'
                    }}
                >
                    {following ? '...' : isFollowed ? '✓ Following' : '+ Follow'}
                </button>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ClubList = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followedIds, setFollowedIds] = useState([]);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    useEffect(() => {
        fetchOrganizers();
    }, []);

    useEffect(() => {
        if (user) setFollowedIds(user.followedOrganizers || []);
    }, [user]);

    const fetchOrganizers = async () => {
        try {
            const { data } = await api.get('/users/organizers');
            setOrganizers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowToggle = async (organizerId) => {
        if (!user) {
            toast.warning('Please login to follow clubs');
            return;
        }
        try {
            const { data } = await api.put(`/users/organizers/${organizerId}/follow`);
            setFollowedIds(data.followedOrganizers);
            toast.success('Follow status updated');
            updateUser({ followedOrganizers: data.followedOrganizers });
        } catch (e) {
            toast.error('Error updating follow status');
        }
    };

    // Derived filtered list
    const categories = [...new Set(organizers.map(o => o.category).filter(Boolean))];
    const filtered = organizers.filter(o => {
        const matchSearch = !search ||
            o.organizerName?.toLowerCase().includes(search.toLowerCase()) ||
            o.description?.toLowerCase().includes(search.toLowerCase()) ||
            o.category?.toLowerCase().includes(search.toLowerCase());
        const matchCat = !categoryFilter || o.category === categoryFilter;
        return matchSearch && matchCat;
    });

    const followedCount = followedIds.length;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 40px' }}>

            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#111827', margin: 0 }}>Clubs & Organizers</h1>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af', fontWeight: 600, marginTop: '6px' }}>
                    Discover clubs, follow your favourites, and stay updated on their events
                </p>
                {user && followedCount > 0 && (
                    <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f5f3ff', border: '1.5px solid #e9d5ff', borderRadius: '10px', padding: '6px 14px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6d28d9' }}>
                            ✓ Following {followedCount} club{followedCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>

            {/* Search + Filter bar */}
            <div style={{
                background: 'white', borderRadius: '18px', padding: '16px 20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '28px',
                border: '1px solid #f3f4f6', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center'
            }}>
                <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search clubs..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 14px 10px 38px',
                            background: '#f9fafb', border: '2px solid #f3f4f6',
                            borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600,
                            color: '#374151', outline: 'none', boxSizing: 'border-box'
                        }}
                        onFocus={e => { e.target.style.borderColor = '#6d28d9'; e.target.style.background = 'white'; }}
                        onBlur={e => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                    />
                </div>

                <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    style={{
                        padding: '10px 14px', background: categoryFilter ? '#f5f3ff' : '#f9fafb',
                        border: `2px solid ${categoryFilter ? '#6d28d9' : '#f3f4f6'}`,
                        borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700,
                        color: categoryFilter ? '#6d28d9' : '#6b7280', outline: 'none', cursor: 'pointer'
                    }}
                >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {user && (
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                        background: '#f9fafb', border: '2px solid #f3f4f6', borderRadius: '12px', padding: '8px 14px'
                    }}>
                        <input
                            type="checkbox"
                            onChange={e => {
                                if (e.target.checked) {
                                    setOrganizers(prev => [...prev].sort((a, b) =>
                                        followedIds.includes(b._id) - followedIds.includes(a._id)
                                    ));
                                }
                            }}
                            style={{ accentColor: '#6d28d9', width: '14px', height: '14px' }}
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#6b7280' }}>Following first</span>
                    </label>
                )}
            </div>

            {/* Results count */}
            {!loading && (
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 700, marginBottom: '16px' }}>
                    {filtered.length} club{filtered.length !== 1 ? 's' : ''} found
                </p>
            )}

            {/* Grid */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {[40, 60, 80, 40].map((w, j) => (
                                <div key={j} style={{ height: '14px', width: `${w}%`, background: '#f3f4f6', borderRadius: '8px' }} />
                            ))}
                        </div>
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {filtered.map(org => (
                        <OrganizerCard
                            key={org._id}
                            org={org}
                            isFollowed={followedIds.map(id => id.toString()).includes(org._id.toString())}
                            onFollowToggle={handleFollowToggle}
                            onViewProfile={(id) => navigate(`/clubs/${id}`)}
                        />
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ width: '72px', height: '72px', background: '#f5f3ff', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: 0 }}>No clubs found</h3>
                    <p style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 600, marginTop: '8px' }}>Try adjusting your search</p>
                </div>
            )}
        </div>
    );
};

export default ClubList;
