import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const BrowseEvents = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters State
    const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
    const [type, setType] = useState(searchParams.get('type') || '');
    const [eligibility, setEligibility] = useState(searchParams.get('eligibility') || '');

    useEffect(() => {
        fetchEvents();
    }, [searchParams, user]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(searchParams);
            const { data } = await api.get(`/events?${params.toString()}`);

            let processedEvents = [...data];

            // If participant is logged in, prioritize events matching their interests
            if (user && user.role === 'participant' && user.interests?.length > 0) {
                processedEvents = processedEvents.map(event => {
                    const matchCount = event.tags?.filter(tag =>
                        user.interests.some(interest => interest.toLowerCase() === tag.toLowerCase())
                    ).length || 0;

                    return { ...event, matchCount, isRecommended: matchCount > 0 };
                });

                // Sort by matchCount descending
                processedEvents.sort((a, b) => (b.matchCount || 0) - (a.matchCount || 0));
            }

            setEvents(processedEvents);
        } catch (error) {
            console.error("Error fetching events", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        const newParams = {};
        if (keyword) newParams.keyword = keyword;
        if (type) newParams.type = type;
        if (eligibility && eligibility !== 'All') newParams.eligibility = eligibility;
        setSearchParams(newParams);
    };

    const clearFilters = () => {
        setKeyword('');
        setType('');
        setEligibility('All');
        setSearchParams({});
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Minimalist Search Bar */}
            <div className="saas-card mb-8 !p-4" style={{ borderRadius: '16px' }}>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <input
                        type="text"
                        placeholder="Search events..."
                        className="input flex-1"
                        style={{ margin: 0 }}
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                    />
                    <select
                        className="input w-full md:w-48"
                        style={{ margin: 0 }}
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="normal">Events</option>
                        <option value="merchandise">Merch</option>
                    </select>
                    <button
                        onClick={handleApplyFilters}
                        className="btn-primary"
                        style={{ padding: '12px 24px', whiteSpace: 'nowrap' }}
                    >
                        Find Events
                    </button>
                    {keyword || type || (eligibility && eligibility !== 'All') ? (
                        <button onClick={clearFilters} className="link small">Clear</button>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Simplified Results Grid */}
                <main className="flex-1">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map(i => <div key={i} className="saas-card h-48 animate-pulse"></div>)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {events.map(event => (
                                <div key={event._id} className="saas-card group flex flex-col hover:border-purple-200 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-2 items-center">
                                            <span className={`badge ${event.type === 'normal' ? 'badge-blue' : 'badge-green'}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                {event.type}
                                            </span>
                                            {event.isRecommended && (
                                                <span className="badge badge-purple" style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>⭐ Recommended</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">
                                            {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
                                        </p>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{event.name}</h3>
                                    <p className="text-xs text-purple-600 font-bold mb-3">{event.organizer?.organizerName}</p>

                                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-6">
                                        {event.description}
                                    </p>

                                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            {new Date(event.startDate).toLocaleDateString()}
                                        </div>
                                        <Link
                                            to={`/events/${event._id}`}
                                            className="link font-bold px-2 py-1"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                            {events.length === 0 && (
                                <div className="col-span-full saas-card text-center py-20 bg-gray-50">
                                    <h4 className="text-lg font-bold text-gray-900">No events found</h4>
                                    <p className="text-sm text-gray-500 mt-1">Try adjusting your filters.</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                {/* Optional Mini-Sidebar for Eligibility only if needed, otherwise integrated into search */}
                <aside className="w-full lg:w-56 space-y-4">
                    <div className="saas-card">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Eligibility</label>
                        <select
                            className="input w-full"
                            style={{ margin: 0, fontSize: '0.8rem' }}
                            value={eligibility}
                            onChange={(e) => {
                                setEligibility(e.target.value);
                                // Auto apply for sidebar
                                const newParams = { ...Object.fromEntries(searchParams) };
                                if (e.target.value && e.target.value !== 'All') newParams.eligibility = e.target.value;
                                else delete newParams.eligibility;
                                setSearchParams(newParams);
                            }}
                        >
                            <option value="All">Anyone</option>
                            <option value="IIIT Students Only">IIIT Students</option>
                            <option value="External Only">External</option>
                        </select>
                    </div>

                    <div className="saas-card bg-purple-50 border-purple-100 text-center">
                        <h4 className="font-bold text-purple-900 text-xs">Stay Updated</h4>
                        <Link to="/clubs" className="mt-3 inline-block text-[10px] font-black text-purple-700 uppercase tracking-wider">Follow Clubs</Link>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default BrowseEvents;
