import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// ─── Utility ────────────────────────────────────────────────────────────────
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const formatFee = (fee) => fee === 0 ? 'FREE' : `₹${fee}`;

// ─── Sub-components ──────────────────────────────────────────────────────────

const EventCard = ({ event, isTrending = false, rank }) => {
    const isMerch = event.type === 'merchandise';
    const isRecommended = event.matchScore > 0;

    return (
        <div
            onClick={() => window.location.href = `/events/${event._id}`}
            style={{
                background: 'white',
                borderRadius: '20px',
                padding: '24px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                border: '1px solid #f3f4f6',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                borderLeft: isMerch ? '4px solid #10b981' : isRecommended ? '4px solid #6d28d9' : '4px solid transparent',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
            }}
        >
            {/* Trending rank badge */}
            {isTrending && rank && (
                <div style={{
                    position: 'absolute', top: '16px', right: '16px',
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    color: 'white', borderRadius: '10px', padding: '4px 10px',
                    fontSize: '0.65rem', fontWeight: 900, letterSpacing: '1px',
                    display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                    🔥 #{rank}
                </div>
            )}

            {/* Top row: badges + fee */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className={`badge ${isMerch ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {isMerch ? '🛍 Merch' : '🎟 Event'}
                    </span>
                    {isRecommended && !isTrending && (
                        <span className="badge badge-purple" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            ✨ For You
                        </span>
                    )}
                </div>
                <span style={{
                    fontSize: '0.85rem', fontWeight: 900,
                    color: event.registrationFee === 0 ? '#10b981' : '#6d28d9',
                    background: event.registrationFee === 0 ? '#ecfdf5' : '#f5f3ff',
                    padding: '4px 10px', borderRadius: '8px'
                }}>
                    {formatFee(event.registrationFee)}
                </span>
            </div>

            {/* Event info */}
            <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.3 }}>
                    {event.name}
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '6px 0 0 0', fontWeight: 600 }}>
                    by {event.organizer?.organizerName || 'Unknown'}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    {formatDate(event.startDate)}
                </p>
                {event.eligibility && event.eligibility !== 'All' && (
                    <p style={{ fontSize: '0.65rem', color: '#9ca3af', margin: '4px 0 0 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {event.eligibility}
                    </p>
                )}
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {isMerch ? (
                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800 }}>
                        {event.merchandiseStock > 0 ? `${event.merchandiseStock} in stock` : 'Out of stock'}
                    </span>
                ) : (
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 700 }}>
                        {event.registeredCount || 0} registered
                    </span>
                )}
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View Details
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </span>
            </div>
        </div>
    );
};

const SkeletonCard = () => (
    <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[40, 80, 60, 40].map((w, i) => (
            <div key={i} style={{ height: '14px', width: `${w}%`, background: '#f3f4f6', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
    </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const BrowseEvents = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [events, setEvents] = useState([]);
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trendingLoading, setTrendingLoading] = useState(true);

    // Filters
    const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
    const [type, setType] = useState(searchParams.get('type') || '');
    const [eligibility, setEligibility] = useState(searchParams.get('eligibility') || '');
    const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
    const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
    const [onlyFollowed, setOnlyFollowed] = useState(false);

    const debounceRef = useRef(null);

    // ── Fetch trending (once) ──────────────────────────────────────────────
    useEffect(() => {
        const fetchTrending = async () => {
            setTrendingLoading(true);
            try {
                const { data } = await api.get('/events/trending');
                setTrending(data);
            } catch (e) {
                console.error('Trending fetch failed', e);
            } finally {
                setTrendingLoading(false);
            }
        };
        fetchTrending();
    }, []);

    // ── Fetch events ───────────────────────────────────────────────────────
    const fetchEvents = useCallback(async (params) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/events?${params.toString()}`);
            let processed = [...data];

            if (onlyFollowed && user?.followedOrganizers?.length > 0) {
                processed = processed.filter(e => user.followedOrganizers.includes(e.organizer?._id));
            }

            setEvents(processed);
        } catch (e) {
            console.error('Events fetch failed', e);
        } finally {
            setLoading(false);
        }
    }, [onlyFollowed, user]);

    useEffect(() => {
        fetchEvents(searchParams);
    }, [searchParams, fetchEvents]);

    // ── Live search debounce ───────────────────────────────────────────────
    const handleKeywordChange = (val) => {
        setKeyword(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const p = buildParams({ keyword: val });
            setSearchParams(p);
        }, 400);
    };

    const buildParams = (overrides = {}) => {
        const merged = { keyword, type, eligibility, startDate, endDate, ...overrides };
        const p = {};
        if (merged.keyword) p.keyword = merged.keyword;
        if (merged.type) p.type = merged.type;
        if (merged.eligibility && merged.eligibility !== 'All') p.eligibility = merged.eligibility;
        if (merged.startDate) p.startDate = merged.startDate;
        if (merged.endDate) p.endDate = merged.endDate;
        return p;
    };

    const applyFilters = () => setSearchParams(buildParams());

    const clearFilters = () => {
        setKeyword(''); setType(''); setEligibility(''); setStartDate(''); setEndDate(''); setOnlyFollowed(false);
        setSearchParams({});
    };

    const hasActiveFilters = keyword || type || (eligibility && eligibility !== 'All') || startDate || endDate || onlyFollowed;

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 40px' }}>

            {/* ── Page Header ── */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#111827', margin: 0 }}>Browse Events</h1>
                <p style={{ fontSize: '0.9rem', color: '#9ca3af', fontWeight: 600, marginTop: '6px' }}>
                    Discover events, workshops, and merchandise from clubs across campus
                </p>
            </div>

            {/* ── Search & Filter Bar ── */}
            <div style={{
                background: 'white', borderRadius: '20px', padding: '20px 24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: '32px',
                border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
                {/* Search row */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search events, organizers, tags..."
                            value={keyword}
                            onChange={e => handleKeywordChange(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyFilters()}
                            style={{
                                width: '100%', padding: '12px 16px 12px 42px',
                                background: '#f9fafb', border: '2px solid #f3f4f6',
                                borderRadius: '14px', fontSize: '0.9rem', fontWeight: 600,
                                color: '#374151', outline: 'none', boxSizing: 'border-box',
                                transition: 'all 0.2s'
                            }}
                            onFocus={e => { e.target.style.borderColor = '#6d28d9'; e.target.style.background = 'white'; }}
                            onBlur={e => { e.target.style.borderColor = '#f3f4f6'; e.target.style.background = '#f9fafb'; }}
                        />
                    </div>
                    <button
                        onClick={applyFilters}
                        className="btn btn-primary"
                        style={{ borderRadius: '14px', padding: '12px 28px', whiteSpace: 'nowrap' }}
                    >
                        Search
                    </button>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="btn btn-outline"
                            style={{ borderRadius: '14px', padding: '12px 20px', whiteSpace: 'nowrap', color: '#6b7280', borderColor: '#e5e7eb' }}
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {/* Filter chips row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    {/* Type */}
                    <select
                        value={type}
                        onChange={e => { setType(e.target.value); setSearchParams(buildParams({ type: e.target.value })); }}
                        style={filterSelectStyle(!!type)}
                    >
                        <option value="">All Types</option>
                        <option value="normal">Normal Events</option>
                        <option value="merchandise">Merchandise</option>
                    </select>

                    {/* Eligibility */}
                    <select
                        value={eligibility}
                        onChange={e => { setEligibility(e.target.value); setSearchParams(buildParams({ eligibility: e.target.value })); }}
                        style={filterSelectStyle(!!eligibility && eligibility !== 'All')}
                    >
                        <option value="All">All Eligibility</option>
                        <option value="IIIT Students Only">IIIT Students Only</option>
                        <option value="External Only">External Only</option>
                    </select>

                    {/* Date range */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            style={{ ...filterSelectStyle(!!startDate), padding: '8px 12px' }}
                            title="From date"
                        />
                        <span style={{ color: '#9ca3af', fontWeight: 700, fontSize: '0.8rem' }}>to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            style={{ ...filterSelectStyle(!!endDate), padding: '8px 12px' }}
                            title="To date"
                        />
                        {(startDate || endDate) && (
                            <button onClick={applyFilters} style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6d28d9', background: '#f5f3ff', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}>Apply</button>
                        )}
                    </div>

                    {/* Followed clubs */}
                    {user && (
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                            background: onlyFollowed ? '#f5f3ff' : '#f9fafb',
                            border: `2px solid ${onlyFollowed ? '#6d28d9' : '#f3f4f6'}`,
                            borderRadius: '12px', padding: '8px 14px', transition: 'all 0.2s'
                        }}>
                            <input
                                type="checkbox"
                                checked={onlyFollowed}
                                onChange={e => setOnlyFollowed(e.target.checked)}
                                style={{ accentColor: '#6d28d9', width: '14px', height: '14px' }}
                            />
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: onlyFollowed ? '#6d28d9' : '#6b7280' }}>
                                Followed Clubs
                            </span>
                        </label>
                    )}
                </div>
            </div>

            {/* ── Trending Section ── */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.3rem' }}>🔥</span>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#111827', margin: 0 }}>Trending Now</h2>
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f59e0b', background: '#fef3c7', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Top 5 / 24h
                    </span>
                </div>

                {trendingLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                        {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : trending.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                        {trending.map((event, i) => (
                            <EventCard key={event._id} event={event} isTrending rank={i + 1} />
                        ))}
                    </div>
                ) : (
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
                        <p style={{ color: '#9ca3af', fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>No trending events in the last 24 hours</p>
                    </div>
                )}
            </div>

            {/* ── Divider ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                    {hasActiveFilters ? `Filtered Results` : 'All Events'}
                </span>
                <div style={{ flex: 1, height: '1px', background: '#f3f4f6' }} />
            </div>

            {/* ── Events Grid ── */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : events.length > 0 ? (
                <>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 700, marginBottom: '16px' }}>
                        {events.length} event{events.length !== 1 ? 's' : ''} found
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {events.map(event => <EventCard key={event._id} event={event} />)}
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ width: '72px', height: '72px', background: '#f5f3ff', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: 0 }}>No events found</h3>
                    <p style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 600, marginTop: '8px' }}>Try adjusting your search or filters</p>
                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="btn btn-outline" style={{ marginTop: '16px', borderRadius: '12px' }}>
                            Clear Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const filterSelectStyle = (active) => ({
    padding: '8px 14px',
    background: active ? '#f5f3ff' : '#f9fafb',
    border: `2px solid ${active ? '#6d28d9' : '#f3f4f6'}`,
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: active ? '#6d28d9' : '#6b7280',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
});

export default BrowseEvents;
