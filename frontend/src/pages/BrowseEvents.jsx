import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const BrowseEvents = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    const [trendingEvents, setTrendingEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters State
    const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
    const [type, setType] = useState(searchParams.get('type') || '');
    const [eligibility, setEligibility] = useState(searchParams.get('eligibility') || '');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchEvents();
        fetchTrending();
    }, [searchParams]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(searchParams);
            const { data } = await api.get(`/events?${params.toString()}`);
            setEvents(data);
        } catch (error) {
            console.error("Error fetching events", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrending = async () => {
        try {
            const { data } = await api.get('/events?sort=trending&limit=5');
            setTrendingEvents(data);
        } catch (error) {
            console.error("Error fetching trending events", error);
        }
    };

    const handleApplyFilters = () => {
        const newParams = {};
        if (keyword) newParams.keyword = keyword;
        if (type) newParams.type = type;
        if (eligibility && eligibility !== 'All') newParams.eligibility = eligibility;
        if (dateRange.start) newParams.startDate = dateRange.start;
        if (dateRange.end) newParams.endDate = dateRange.end;
        setSearchParams(newParams);
    };

    const clearFilters = () => {
        setKeyword('');
        setType('');
        setEligibility('All');
        setDateRange({ start: '', end: '' });
        setSearchParams({});
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

            {/* Page Header & Search */}
            <div className="text-center max-w-2xl mx-auto space-y-4">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Discover Amazing Events</h1>
                <p className="text-lg text-gray-500">Find the best campus experiences, workshops, and merchandise.</p>

                <div className="flex bg-white p-2 rounded-2xl shadow-lg border border-gray-100 max-w-xl mx-auto mt-8">
                    <div className="flex-1 flex items-center px-4 gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search events or organizers..."
                            className="w-full py-2 focus:outline-none text-gray-700 bg-transparent"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                        />
                    </div>
                    <button
                        onClick={handleApplyFilters}
                        className="btn btn-primary px-6 py-2 rounded-xl"
                        style={{ background: 'var(--primary-gradient)' }}
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Trending Section */}
            {trendingEvents.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-2xl">🔥</span>
                        <h2 className="section-title mb-0">Trending Now</h2>
                        <span className="text-xs text-gray-400 font-medium ml-2 uppercase tracking-widest">Top 5 in last 24h</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {trendingEvents.map(event => (
                            <Link to={`/events/${event._id}`} key={event._id} className="saas-card !p-4 group hover:-translate-y-1 transition-all">
                                <div className="h-24 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-3xl group-hover:bg-purple-50 transition-colors">
                                    {event.type === 'normal' ? '🎓' : '👕'}
                                </div>
                                <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{event.name}</h3>
                                <p className="text-[10px] text-purple-600 font-semibold uppercase mt-1">{event.organizer?.organizerName}</p>
                                <div className="mt-2 flex justify-between items-center text-[10px] text-gray-400">
                                    <span>{new Date(event.startDate).toLocaleDateString()}</span>
                                    <span className="font-bold text-gray-900">₹{event.registrationFee}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Sidebar Filters */}
                <aside className="w-full lg:w-64 space-y-6 lg:sticky lg:top-24">
                    <div className="saas-card">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900">Filters</h3>
                            <button onClick={clearFilters} className="text-xs text-purple-600 hover:underline font-medium">Clear All</button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Event Type</label>
                                <select
                                    className="w-full bg-gray-50 border-none rounded-lg p-2.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-500 transition-all"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    <option value="normal">Normal Events</option>
                                    <option value="merchandise">Merchandise</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Eligibility</label>
                                <select
                                    className="w-full bg-gray-50 border-none rounded-lg p-2.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-500 transition-all"
                                    value={eligibility}
                                    onChange={(e) => setEligibility(e.target.value)}
                                >
                                    <option value="All">Anyone</option>
                                    <option value="IIIT Students Only">IIIT Students Only</option>
                                    <option value="External Only">External Only</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Date Range</label>
                                <div className="space-y-3">
                                    <input
                                        type="date"
                                        className="w-full bg-gray-50 border-none rounded-lg p-2.5 text-xs font-medium text-gray-600 focus:ring-2 focus:ring-purple-500"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    />
                                    <input
                                        type="date"
                                        className="w-full bg-gray-50 border-none rounded-lg p-2.5 text-xs font-medium text-gray-600 focus:ring-2 focus:ring-purple-500"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleApplyFilters}
                                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
                                style={{ background: 'var(--primary-gradient)' }}
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>

                    {/* Fun Badge */}
                    <div className="bg-gradient-to-br from-purple-100 to-indigo-50 p-6 rounded-2xl border border-purple-100 flex flex-col items-center text-center">
                        <span className="text-3xl mb-2">🎈</span>
                        <h4 className="font-bold text-purple-900 text-sm">Follow Clubs</h4>
                        <p className="text-[10px] text-purple-600 mt-1">Get instant updates from your favorite campus organizers.</p>
                        <Link to="/clubs" className="mt-4 text-xs font-extrabold text-purple-700 bg-white px-4 py-2 rounded-lg shadow-sm">Explore Clubs</Link>
                    </div>
                </aside>

                {/* Main Grid */}
                <main className="flex-1">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                            {[1, 2, 3, 4].map(i => <div key={i} className="bg-gray-200 h-64 rounded-2xl"></div>)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {events.map(event => (
                                <div key={event._id} className="saas-card group flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`badge ${event.type === 'normal' ? 'badge-blue' : 'badge-green'}`}>
                                            {event.type}
                                        </span>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entry Fee</p>
                                            <p className="text-lg font-black text-gray-900">
                                                {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
                                            </p>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">{event.name}</h3>
                                    <p className="text-sm text-gray-500 font-medium mb-4">by {event.organizer?.organizerName}</p>

                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-6">
                                            {event.description}
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between mt-auto">
                                        <div className="text-xs text-gray-400 space-y-1">
                                            <p className="flex items-center gap-1 font-medium">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {new Date(event.startDate).toLocaleDateString()}
                                            </p>
                                            <p className="flex items-center gap-1 font-medium">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                                                </svg>
                                                {event.eligibility}
                                            </p>
                                        </div>
                                        <Link
                                            to={`/events/${event._id}`}
                                            className="px-5 py-2.5 bg-purple-50 text-purple-700 rounded-xl font-bold text-sm hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                                        >
                                            Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                            {events.length === 0 && (
                                <div className="col-span-full saas-card text-center py-20 bg-gray-50 border-dashed border-2">
                                    <span className="text-5xl mb-4 block">🔍</span>
                                    <h4 className="text-xl font-bold text-gray-900">No events found</h4>
                                    <p className="text-gray-500 mt-1">Try adjusting your search or filters to find what you're looking for.</p>
                                    <button onClick={clearFilters} className="mt-6 text-purple-600 font-bold hover:underline">Clear all filters</button>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default BrowseEvents;
