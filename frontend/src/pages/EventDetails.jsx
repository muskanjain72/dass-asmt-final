import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Forum from '../components/Forum';
import AddToCalendarButton from '../components/AddToCalendarButton';
import toast from 'react-hot-toast';
import RegistrationModal from '../components/RegistrationModal';

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [showRegModal, setShowRegModal] = useState(false);

    useEffect(() => {
        const fetchEventAndStatus = async () => {
            try {
                const { data } = await api.get(`/events/${id}`);
                setEvent(data);

                if (user && user.role === 'participant') {
                    const { data: regData } = await api.get(`/tickets/check/${id}`);
                    setIsRegistered(regData.isRegistered);
                }
            } catch (error) {
                console.error("Error fetching event details", error);
                toast.error("Failed to load event details");
            } finally {
                setLoading(false);
            }
        };
        fetchEventAndStatus();
    }, [id, user]);

    const handleRegister = async (formResponses = {}) => {
        if (!user) {
            navigate('/login');
            return;
        }

        // If modal is not open and event has schema/is merch, open it
        if (!showRegModal && (isMerch || (event.formSchema && event.formSchema.length > 0))) {
            setShowRegModal(true);
            return;
        }

        setRegistering(true);

        try {
            const payload = {
                eventId: id,
                formResponses: event.type === 'merchandise' ? {
                    'Full Name': formResponses['Full Name'],
                    'Email ID': formResponses['Email ID'],
                    'Contact Number': formResponses['Contact Number']
                } : formResponses,
                purchaseData: event.type === 'merchandise' ? {
                    quantity: formResponses.quantity || 1,
                    variants: formResponses.variants || {}
                } : { quantity: 1 }
            };

            await api.post('/tickets', payload);
            toast.success(event.type === 'merchandise' ? 'Purchase successful!' : 'Registration request sent! Awaiting organizer review.');
            setShowRegModal(false);
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
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
        if (isRegistered) return isMerch ? 'Purchased' : 'Already Registered';
        if (isDeadlinePassed) return 'Deadline Passed';
        if (isFull) return 'Registration Full';
        if (isOutOfStock) return 'Out of Stock';
        return isMerch ? 'Buy Merchandise' : 'Register Now';
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 60px' }}>
            <div style={{
                background: 'white', borderRadius: '24px', padding: '40px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6',
                display: 'flex', flexDirection: 'column', alignItems: 'stretch'
            }}>
                <div className="text-center mb-8">
                    <span className={`inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider uppercase rounded-full ${event.type === 'normal' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {event.type}
                    </span>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">{event.name}</h1>
                    <p className="text-sm text-gray-500 font-medium">
                        organized by <span className="text-purple-600 font-bold">{event.organizer?.organizerName}</span>
                    </p>
                </div>

                {/* Tabs - Using auth-tabs style */}
                <div className="auth-tabs">
                    <button
                        className={`tab ${activeTab === 'details' ? 'active' : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Event Details
                    </button>
                    <button
                        className={`tab ${activeTab === 'discussion' ? 'active' : ''}`}
                        onClick={() => setActiveTab('discussion')}
                    >
                        Discussion
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="w-full flex-1 mb-8">
                    {activeTab === 'details' ? (
                        <div className="space-y-6 text-center">
                            {/* Key Info List - Centered and Inline */}
                            <div className="space-y-2">
                                <p className="text-gray-900 text-base">
                                    <span className="font-bold text-gray-700">Start:</span> {event.startDate ? new Date(event.startDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'TBA'}
                                </p>
                                <p className="text-gray-900 text-base">
                                    <span className="font-bold text-gray-700">End:</span> {event.endDate ? new Date(event.endDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'TBA'}
                                </p>
                                <p className="text-gray-900 text-base">
                                    <span className="font-bold text-gray-700">Fee:</span> {event.registrationFee === 0 ? "Free" : `₹${event.registrationFee}`}
                                </p>
                                <p className="text-gray-900 text-base">
                                    <span className="font-bold text-gray-700">Eligibility:</span> {event.eligibility}
                                </p>
                            </div>

                            <div className="w-16 h-1 bg-gray-100 mx-auto rounded-full"></div>

                            {/* Description */}
                            <div className="text-left px-4">
                                <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide text-center">About Event</h3>
                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap text-center">
                                    {event.description || "No description provided."}
                                </p>
                            </div>

                            {/* Additional Details */}
                            <div className="text-sm text-gray-500 pt-4 border-t border-gray-100 flex flex-col gap-1 items-center">
                                <p>
                                    <span className="font-semibold">Register By:</span> <span className={`${isDeadlinePassed ? 'text-red-500 font-bold' : ''}`}>{event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleDateString() : 'None'}</span>
                                </p>
                                {isMerch && (
                                    <p>
                                        <span className="font-semibold">Stock:</span> <span className={`${isOutOfStock ? 'text-red-500 font-bold' : ''}`}>{event.merchandiseStock} units</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-xl p-4 min-h-[300px] border border-gray-100 relative">
                            {user ? <Forum eventId={id} user={user} isRegistered={isRegistered || user.role === 'organizer'} /> : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-6 text-center">
                                    <p className="mb-4 text-sm font-medium">Join the discussion</p>
                                    <button onClick={() => navigate('/login')} className="text-purple-600 font-bold text-sm hover:underline">Log In to Chat</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="w-full space-y-4">
                    <button
                        onClick={handleRegister}
                        disabled={isDisabled || registering}
                        className={`btn-primary btn-block w-full py-3.5 rounded-xl font-bold text-base shadow-sm hover:shadow-md transition-all ${isDisabled || registering || isRegistered
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none border-none hover:bg-gray-200'
                            : ''
                            }`}
                    >
                        {getCTAButtonText()}
                    </button>

                    <div className="flex justify-center">
                        <AddToCalendarButton event={event} className="" />
                    </div>
                </div>

            </div>

            {showRegModal && (
                <RegistrationModal
                    event={event}
                    onClose={() => setShowRegModal(false)}
                    onSubmit={handleRegister}
                    submitting={registering}
                />
            )}
        </div>
    );
};

export default EventDetails;
