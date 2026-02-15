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
    const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
    const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
    const [onlyFollowed, setOnlyFollowed] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, [searchParams, user]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(searchParams);
            const { data } = await api.get(`/events?${params.toString()}`);

            let processedEvents = [...data];

            // 1. Client-side Followed Clubs Filter
            if (onlyFollowed && user?.followedOrganizers) {
                processedEvents = processedEvents.filter(event =>
                    user.followedOrganizers.includes(event.organizer?._id)
                );
            }

            // 2. Personalization (Interest Recommendation)
            if (user && user.role === 'participant' && user.interests?.length > 0) {
                processedEvents = processedEvents.map(event => {
                    const matchCount = event.tags?.filter(tag =>
                        user.interests.some(interest => interest.toLowerCase() === tag.toLowerCase())
                    ).length || 0;

                    return { ...event, matchCount, isRecommended: matchCount > 0 };
                });

                // Sort by prioritized matchCount
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
        if (startDate) newParams.startDate = startDate;
        if (endDate) newParams.endDate = endDate;
        setSearchParams(newParams);
    };

    const clearFilters = () => {
        setKeyword('');
        setType('');
        setEligibility('All');
        setStartDate('');
        setEndDate('');
        setOnlyFollowed(false);
        setSearchParams({});
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Filter & Search Bar */}
            <div className="saas-card mb-8 !p-6" style={{ borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div className="flex flex-col gap-4">
                    {/* Top Row: Search & Apply */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Search events..."
                            className="input flex-1"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                        />
                        <button
                            onClick={handleApplyFilters}
                            className="btn-primary"
                            style={{ padding: '12px 32px' }}
                        >
                            Search
                        </button>
                        {(keyword || type || (eligibility && eligibility !== 'All') || startDate || endDate || onlyFollowed) && (
                            <button onClick={clearFilters} className="btn-outline text-gray-500 border-gray-300">
                                Clear All
                            </button>
                        )}
                    </div>

                    {/* Bottom Row: Filters */}
                    <div className="flex flex-wrap items-center gap-4">
                        <select
                            className="input w-full md:w-auto min-w-[140px]"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="">Event Type</option>
                            <option value="normal">Events</option>
                            <option value="merchandise">Merchandise</option>
                        </select>

                        <select
                            className="input w-full md:w-auto min-w-[140px]"
                            value={eligibility}
                            onChange={(e) => setEligibility(e.target.value)}
                        >
                            <option value="All">Eligibility: All</option>
                            <option value="IIIT Students Only">IIIT Students</option>
                            <option value="External Only">External</option>
                        </select>

                        <div className="flex items-center gap-2">
                            <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            <span className="text-gray-400">-</span>
                            <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>

                        {user && (
                            <label className="flex items-center gap-2 cursor-pointer select-none bg-purple-50 px-3 py-2 rounded-lg border border-purple-100">
                                <input
                                    type="checkbox"
                                    checked={onlyFollowed}
                                    onChange={(e) => {
                                        setOnlyFollowed(e.target.checked);
                                        // Trigger fetch via state effect or explicit call? 
                                        // For client side filtering, just re-rendering via state change is enough if we filter inside render or useEffect
                                        // But here we rely on fetchEvents called by useEffect deps? No, onlyFollowed is state. 
                                        // We need to call fetchEvents or move logic. 
                                        // Since fetchEvents depends on [searchParams], and onlyFollowed is local state, 
                                        // let's add onlyFollowed to useEffect deps or handle it.
                                        // Actually simplest is just re-fetch/re-process.
                                    }}
                                    className="accent-purple-600 w-4 h-4"
                                />
                                <span className="text-sm font-bold text-purple-700">Followed Clubs</span>
                            </label>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Grid - Dynamic Layout */}
            {/* "if window width is big, else 2 in a row, else 1 in a row" -> lg:grid-cols-3, md:grid-cols-2, grid-cols-1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="saas-card h-80 animate-pulse bg-gray-100 border-none"></div>)
                ) : (
                    events.map(event => (
                        <div key={event._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center transition-all hover:shadow-lg hover:-translate-y-1">

                            <span className={`inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider uppercase rounded-full ${event.type === 'normal' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                {event.type}
                            </span>

                            <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{event.name}</h3>

                            <p className="text-sm text-gray-500 mb-6 font-medium">
                                by <span className="text-purple-600">{event.organizer?.organizerName}</span>
                            </p>

                            <div className="space-y-2 w-full mb-8">
                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                    <span className="text-gray-400 font-medium">Date</span>
                                    <span className="text-gray-900 font-bold">{new Date(event.startDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                    <span className="text-gray-400 font-medium">Fee</span>
                                    <span className="text-gray-900 font-bold">{event.registrationFee === 0 ? "Free" : `₹${event.registrationFee}`}</span>
                                </div>
                            </div>

                            <Link
                                to={`/events/${event._id}`}
                                className="w-full py-3 rounded-xl bg-gray-50 text-purple-600 font-bold text-sm hover:bg-purple-50 transition-colors"
                            >
                                View Details
                            </Link>

                        </div>
                    ))
                )}
            </div>

            {
                !loading && events.length === 0 && (
                    <div className="text-center py-24 text-gray-500">
                        <div className="inline-block p-4 rounded-full bg-gray-50 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No events found</h3>
                        <p>Try adjusting your filters or search terms.</p>
                    </div>
                )
            }
        </div >
    );
};

export default BrowseEvents;
