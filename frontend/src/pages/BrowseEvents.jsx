import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const BrowseEvents = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters State matching URL params or default
    const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
    const [type, setType] = useState(searchParams.get('type') || '');
    const [eligibility, setEligibility] = useState(searchParams.get('eligibility') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || 'upcoming');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchEvents();
    }, [searchParams]); // Re-fetch when URL params change

    // Sync state with params if needed or just use params directly. 
    // Simplified: local state drives UI, search applies to URL/API

    const fetchEvents = async () => {
        setLoading(true);
        try {
            // Build query
            const params = new URLSearchParams();
            if (keyword) params.append('keyword', keyword);
            if (type) params.append('type', type);
            if (eligibility) params.append('eligibility', eligibility);
            if (sort) params.append('sort', sort);
            if (dateRange.start) params.append('startDate', dateRange.start);
            if (dateRange.end) params.append('endDate', dateRange.end);
            // Limit? Maybe not for browse page, only for trending widget if separate

            const { data } = await api.get(`/events?${params.toString()}`);
            setEvents(data);
        } catch (error) {
            console.error("Error fetching events", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchEvents();
        // optionally update URL to make shareable
        // setSearchParams({ keyword, type, ... });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Events</h1>

            {/* Trending Section (Could be separate component) */}
            {/* If sort is NOT trending, maybe show a "Trending Now" carousel at top? 
                For now keeping it simple as part of the list or just a filter option 
            */}

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <div className="w-full lg:w-1/4 space-y-6">
                    <div className="bg-white p-4 shadow rounded-lg">
                        <h3 className="font-semibold mb-4 text-gray-900">Filters</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <input
                                type="text"
                                placeholder="Event name..."
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                value={type}
                                onChange={e => setType(e.target.value)}
                            >
                                <option value="">All Types</option>
                                <option value="normal">Normal Events</option>
                                <option value="merchandise">Merchandise</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                            <select
                                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                value={sort}
                                onChange={e => setSort(e.target.value)}
                            >
                                <option value="upcoming">Upcoming</option>
                                <option value="trending">Trending (Top 24h)</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                            <div className="space-y-2">
                                <input type="date" className="w-full border p-2 rounded text-sm" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                                <input type="date" className="w-full border p-2 rounded text-sm" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                            </div>
                        </div>

                        <button
                            onClick={handleSearch}
                            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 font-medium"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>

                {/* Event List */}
                <div className="flex-1">
                    {loading ? (
                        <div className="text-center py-10">Loading events...</div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                            {events.map(event => (
                                <div key={event._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
                                    <div className="p-5 flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.type === 'normal' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {event.type === 'normal' ? 'Event' : 'Merch'}
                                            </span>
                                            <span className="text-gray-900 font-bold text-sm">
                                                {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{event.name}</h3>
                                        <p className="text-sm text-indigo-600 mb-2">{event.organizer?.organizerName}</p>
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-4">{event.description}</p>

                                        <div className="text-xs text-gray-500">
                                            <p className="flex items-center">
                                                📅 {new Date(event.startDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-5 py-3">
                                        <Link
                                            to={`/events/${event._id}`}
                                            className="block w-full text-center text-indigo-600 font-medium hover:text-indigo-900"
                                        >
                                            View Details &rarr;
                                        </Link>
                                    </div>
                                </div>
                            ))}
                            {events.length === 0 && (
                                <div className="text-center py-10 text-gray-500 w-full col-span-2">
                                    No events found. Try adjusting filters.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BrowseEvents;
