import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const OrganizerDashboard = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyEvents = async () => {
            // Assuming we have an endpoint for my-events or we filter
            try {
                // We actually need this endpoint in backend, let's assume it exists as per previous plan
                const { data } = await api.get('/events/my-events');
                setEvents(data);
            } catch (error) {
                console.error("Error fetching my events", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyEvents();
    }, []);

    // Simple analytics calculation
    const totalRegistrations = events.reduce((acc, event) => acc + (event.registeredCount || 0), 0);
    // Revenue would need more data but for now placeholder
    const totalRevenue = events.reduce((acc, event) => acc + ((event.registeredCount || 0) * (event.registrationFee || 0)), 0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
                <Link
                    to="/organizer/create-event"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
                >
                    + Create New Event
                </Link>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{events.length}</dd>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Registrations</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalRegistrations}</dd>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Est. Revenue</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">₹{totalRevenue}</dd>
                    </div>
                </div>
            </div>

            {/* Events List */}
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Events</h2>
            {loading ? (
                <div className="text-center py-4">Loading...</div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {events.length > 0 ? events.map((event) => (
                            <li key={event._id}>
                                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <p className="text-sm font-medium text-indigo-600 truncate">{event.name}</p>
                                            <p className="text-sm text-gray-500">{event.type === 'normal' ? 'Event' : 'Merchandise'}</p>
                                        </div>
                                        <div className="ml-2 flex-shrink-0 flex">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${event.status === 'published' ? 'bg-green-100 text-green-800' :
                                                event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {event.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                Registrations: {event.registeredCount}/{event.registrationLimit > 0 ? event.registrationLimit : '∞'}
                                            </p>
                                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                                Date: {new Date(event.startDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm sm:mt-0">
                                            <Link
                                                to={`/organizer/event/${event._id}`}
                                                className="text-indigo-600 hover:text-indigo-900 font-medium"
                                            >
                                                Manage
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        )) : (
                            <li className="px-4 py-4 sm:px-6 text-center text-gray-500">No events created yet.</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default OrganizerDashboard;
