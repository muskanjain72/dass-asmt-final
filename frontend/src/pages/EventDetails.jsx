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

    if (loading) return (
        <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
    );
    if (!event) return <div className="p-20 text-center saas-card max-w-lg mx-auto mt-20">Event not found</div>;

    const isMerch = event.type === 'merchandise';
    const now = new Date();
    const isDeadlinePassed = event.registrationDeadline && now > new Date(event.registrationDeadline);
    const isFull = event.registrationLimit > 0 && event.registeredCount >= event.registrationLimit;
    const isOutOfStock = isMerch && event.merchandiseStock <= 0;
    const isDisabled = isDeadlinePassed || isFull || isOutOfStock;

    const getCTAButtonText = () => {
        if (registering) return 'Processing...';
        if (isDeadlinePassed) return 'Deadline Passed';
        if (isFull) return 'Registration Full';
        if (isOutOfStock) return 'Out of Stock';
        return isMerch ? 'Buy Merchandise' : 'Register Now';
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

            {/* Wide Banner Section */}
            <div className="relative h-64 md:h-80 w-full rounded-3xl overflow-hidden shadow-xl" style={{ background: 'var(--primary-gradient)' }}>
                <div className="absolute inset-0 bg-black bg-opacity-20 backdrop-blur-[2px]"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white">
                    <span className={`badge ${event.type === 'normal' ? 'badge-blue' : 'badge-green'} mb-4 border-2 border-white border-opacity-20`}>
                        {event.type.toUpperCase()}
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 drop-shadow-md">{event.name}</h1>
                    <p className="text-lg opacity-90 font-medium">organized by {event.organizer?.organizerName}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details & Discussion */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Tabs Navigation */}
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`pb-4 px-6 text-sm font-bold transition-all relative ${activeTab === 'details' ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Event Details
                            {activeTab === 'details' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full"></span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('discussion')}
                            className={`pb-4 px-6 text-sm font-bold transition-all relative ${activeTab === 'discussion' ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Discussion Forum
                            {activeTab === 'discussion' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full"></span>}
                        </button>
                    </div>

                    {activeTab === 'details' ? (
                        <div className="saas-card space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">About the Event</h3>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Schedule</h4>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Start Date</p>
                                            <p className="text-sm text-gray-500">{new Date(event.startDate).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">End Date</p>
                                            <p className="text-sm text-gray-500">{new Date(event.endDate).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">More Info</h4>
                                    <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Eligibility</span>
                                            <span className="font-bold text-gray-900">{event.eligibility}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Deadline</span>
                                            <span className={`font-bold ${isDeadlinePassed ? 'text-red-500' : 'text-gray-900'}`}>
                                                {event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleDateString() : 'None'}
                                            </span>
                                        </div>
                                        {isMerch && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Stock Available</span>
                                                <span className={`font-bold ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
                                                    {event.merchandiseStock} units
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="saas-card">
                            {user ? (
                                <Forum eventId={id} user={user} />
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <p>Please log in to participate in the discussion forum.</p>
                                    <button onClick={() => navigate('/login')} className="text-purple-600 font-bold mt-4">Log In &rarr;</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: CTA & Organizer Info */}
                <div className="space-y-6">
                    {/* CTA Card */}
                    <div className="saas-card !p-8 bg-white border-2 border-purple-100 shadow-2xl sticky top-24">
                        <div className="text-center mb-8">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Registration Fee</p>
                            <h2 className="text-4xl font-black text-gray-900">
                                {event.registrationFee === 0 ? "FREE" : `₹${event.registrationFee}`}
                            </h2>
                        </div>

                        {msg.text && (
                            <div className={`mb-6 p-3 rounded-xl text-center text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {msg.text}
                            </div>
                        )}

                        <button
                            onClick={handleRegister}
                            disabled={isDisabled || registering}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 ${isDisabled || registering
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'text-white hover:shadow-purple-200'
                                }`}
                            style={!(isDisabled || registering) ? { background: 'var(--primary-gradient)' } : {}}
                        >
                            {getCTAButtonText()}
                        </button>

                        {!user && <p className="mt-4 text-center text-xs text-gray-400">Please login to {isMerch ? 'buy' : 'register'}.</p>}

                        <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col items-center gap-4">
                            <AddToCalendarButton event={event} />
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">Secure transaction & confirmation</p>
                        </div>
                    </div>

                    {/* Organizer Card */}
                    <div className="saas-card">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Organizer Contact</h4>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl">
                                🏢
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{event.organizer?.organizerName}</p>
                                <p className="text-xs text-gray-500 capitalize">{event.organizer?.category} Club</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 line-clamp-3">{event.organizer?.description}</p>
                        <a href={`mailto:${event.organizer?.contactEmail}`} className="block text-center py-2 border border-gray-100 rounded-lg text-xs font-bold text-purple-600 hover:bg-gray-50 transition-colors">
                            Contact Organizer
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;
