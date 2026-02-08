import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

import Forum from '../components/Forum';
import AddToCalendarButton from '../components/AddToCalendarButton';

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('details');

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const { data } = await api.get(`/events/${id}`);
                setEvent(data);
            } catch (error) {
                console.error("Error fetching event", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    const handleRegister = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setRegistering(true);
        setMsg({ type: '', text: '' });

        try {
            await api.post('/tickets', {
                eventId: id,
                formResponses: {},
                purchaseData: { quantity: 1 }
            });
            setMsg({ type: 'success', text: 'Registration successful! Check your dashboard.' });
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (error) {
            setMsg({ type: 'error', text: error.response?.data?.message || 'Registration failed' });
        } finally {
            setRegistering(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!event) return <div className="p-8 text-center">Event not found</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`${activeTab === 'details' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Event Details
                    </button>
                    <button
                        onClick={() => setActiveTab('discussion')}
                        className={`${activeTab === 'discussion' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Discussion Forum
                    </button>
                </nav>
            </div>

            {activeTab === 'details' ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl leading-6 font-medium text-gray-900">{event.name}</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                by {event.organizer?.organizerName}
                            </p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${event.type === 'normal' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                            {event.type.toUpperCase()}
                        </span>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                        <dl className="sm:divide-y sm:divide-gray-200">
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Description</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{event.description}</dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Date</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {new Date(event.startDate).toLocaleString()} - {new Date(event.endDate).toLocaleString()}
                                </dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Registration Fee</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {event.registrationFee === 0 ? "Free" : `₹${event.registrationFee}`}
                                </dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Registration Deadline</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleDateString() : 'N/A'}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="px-4 py-5 sm:px-6 bg-gray-50 flex flex-col items-center">
                        {msg.text && (
                            <div className={`mb-4 p-2 rounded w-full text-center ${msg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {msg.text}
                            </div>
                        )}

                        <button
                            onClick={handleRegister}
                            disabled={registering}
                            className={`w-full sm:w-auto flex justify-center py-2 px-8 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${registering
                                ? 'bg-indigo-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none'
                                }`}
                        >
                            {registering ? 'Processing...' : (event.type === 'merchandise' ? 'Buy Now' : 'Register Now')}
                        </button>
                        {!user && (
                            <p className="mt-2 text-xs text-gray-500">Please login to register</p>
                        )}

                        {/* Calendar Button - Shown for convenience, theoretically should check registration status first */}
                        <div className="mt-4">
                            <AddToCalendarButton event={event} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg p-6">
                    {user ? (
                        <Forum eventId={id} user={user} />
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            Please <span className="text-indigo-600 cursor-pointer" onClick={() => navigate('/login')}>Login</span> to view discussions.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventDetails;
