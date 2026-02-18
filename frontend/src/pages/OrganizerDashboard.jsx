import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Carousel from '../components/Carousel';

const OrganizerDashboard = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subStatusTab, setSubStatusTab] = useState('all'); // all, drafts, live
    const [pendingVerifications, setPendingVerifications] = useState([]);

    const fetchPendingVerifications = async () => {
        try {
            const { data } = await api.get('/tickets/organizer/pending');
            setPendingVerifications(data);
        } catch (error) {
            console.error("Error fetching verifications", error);
        }
    };

    useEffect(() => {
        if (activeTab === 'verifications') {
            fetchPendingVerifications();
        }
    }, [activeTab]);

    const handleApprove = async (ticketId) => {
        if (!window.confirm('Approve this payment?')) return;
        try {
            await api.put(`/tickets/${ticketId}/approve`);
            fetchPendingVerifications(); // Refresh list
            fetchMyEvents(); // Refresh stats/analytics if needed
            alert('Order Approved');
        } catch (error) {
            alert(error.response?.data?.message || 'Approval failed');
        }
    };

    const handleReject = async (ticketId) => {
        if (!window.confirm('Reject this payment?')) return;
        try {
            await api.put(`/tickets/${ticketId}/reject`);
            fetchPendingVerifications();
            alert('Order Rejected');
        } catch (error) {
            alert(error.response?.data?.message || 'Rejection failed');
        }
    };

    useEffect(() => {
        const tab = searchParams.get('tab') || 'dashboard';
        setActiveTab(tab);
    }, [searchParams]);

    const fetchMyEvents = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/events/my-events');
            console.log("Fetched events for organizer:", data);
            setEvents(data);
        } catch (error) {
            console.error("Error fetching my events", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyEvents();
    }, []);

    // Simple analytics calculation
    const totalRegistrations = events.reduce((acc, event) => acc + (event.registeredCount || 0), 0);
    const totalRevenue = events.reduce((acc, event) => acc + ((event.registeredCount || 0) * (event.registrationFee || 0)), 0);
    const publishedEventsCount = events.filter(e => e.status === 'published' || e.status === 'ongoing').length;
    const draftsCount = events.filter(e => e.status === 'draft').length;

    // Filter events based on sub-tab
    const filteredEvents = events.filter(e => {
        if (subStatusTab === 'drafts') return e.status === 'draft';
        if (subStatusTab === 'live') return e.status === 'published' || e.status === 'ongoing';
        return true;
    });

    if (loading) return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            <div className="loader"></div>
            <p style={{ marginTop: '16px', color: '#6b7280' }}>Fetching your events...</p>
        </div>
    );

    const handleQuickPublish = async (id, e) => {
        e.stopPropagation(); // Prevent navigation
        if (!window.confirm('Publish this event now? It will become visible to all users.')) return;
        try {
            await api.put(`/events/${id}`, { status: 'published' });
            fetchMyEvents();
        } catch (error) {
            alert('Error publishing event');
        }
    };

    // Filter for completed events (ended or closed)
    const completedEvents = events.filter(e => {
        const isEnded = new Date(e.endDate) < new Date();
        const isClosed = e.status === 'closed' || e.status === 'completed';
        return (e.status === 'published' || e.status === 'ongoing' || isClosed) && (isEnded || isClosed);
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

            {activeTab === 'dashboard' && (
                <>
                    {/* Stats Grid - Unchanged */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div className="saas-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '10px', borderRadius: '10px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', margin: 0 }}>Total Events</p>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: '2px 0 0 0' }}>{events.length}</h3>
                            </div>
                        </div>

                        <div className="saas-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ backgroundColor: '#fff7ed', color: '#ea580c', padding: '10px', borderRadius: '10px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', margin: 0 }}>Drafts</p>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ea580c', margin: '2px 0 0 0' }}>{draftsCount}</h3>
                            </div>
                        </div>

                        <div className="saas-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '10px', borderRadius: '10px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', margin: 0 }}>Registrations</p>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: '2px 0 0 0' }}>{totalRegistrations}</h3>
                            </div>
                        </div>

                        <div className="saas-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ backgroundColor: '#fdf2f8', color: '#db2777', padding: '10px', borderRadius: '10px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', margin: 0 }}>Revenue</p>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: '2px 0 0 0' }}>₹{totalRevenue.toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Events Carousel Section */}
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>All Events</h2>
                        {events.length > 0 ? (
                            <Carousel>
                                {events.map((event) => (
                                    <div key={event._id}
                                        className="saas-card hover:shadow-lg transition-shadow cursor-pointer"
                                        onClick={() => navigate(`/organizer/event/${event._id}`)}
                                        style={{
                                            minWidth: '320px',
                                            flexShrink: 0,
                                            scrollSnapAlign: 'start',
                                            padding: '24px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px',
                                            borderLeft: event.status === 'draft' ? '6px solid #f59e0b' : '1px solid #e5e7eb'
                                        }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <span className={`badge ${event.status === 'published' ? 'badge-green' : event.status === 'draft' ? 'badge-orange' : event.status === 'ongoing' ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                                                {event.status}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' }}>{event.type}</span>
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>{event.name}</h4>
                                            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '4px 0 0 0' }}>
                                                {new Date(event.startDate).toLocaleDateString()}
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '16px', marginTop: 'auto' }}>
                                            <div>
                                                <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>Registrations</p>
                                                <p style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '2px 0 0 0', color: '#111827' }}>{event.registeredCount}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {event.status === 'draft' && (
                                                    <button
                                                        onClick={(e) => handleQuickPublish(event._id, e)}
                                                        className="link"
                                                        style={{ color: '#10b981', background: '#ecfdf5', padding: '6px 12px', borderRadius: '8px' }}
                                                    >
                                                        Publish
                                                    </button>
                                                )}
                                                <span className="link" style={{ color: '#6d28d9', fontWeight: '800' }}>Manage</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Carousel>
                        ) : (
                            <div className="saas-card" style={{ padding: '60px', textAlign: 'center', backgroundColor: '#f9fafb', border: '1px dashed #e5e7eb' }}>
                                <div style={{ color: '#9ca3af', marginBottom: '16px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                                </div>
                                <p style={{ color: '#6b7280', fontWeight: 'bold' }}>No events created yet.</p>
                                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Your event dashboard will come alive once you create your first listing.</p>
                            </div>
                        )}
                    </div>

                    {/* Added Event Analytics (Completed Events Only) */}
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Event Analytics (Completed)</h2>
                        {completedEvents.length > 0 ? (
                            <div className="saas-card" style={{ overflow: 'hidden', padding: 0 }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="saas-table">
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '20px' }}>Event Name</th>
                                                <th style={{ padding: '20px' }}>Registrations</th>
                                                <th style={{ padding: '20px' }}>Attendance</th>
                                                <th style={{ padding: '20px' }}>Sales (Revenue)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {completedEvents.map(event => (
                                                <tr key={event._id}>
                                                    <td style={{ padding: '20px', fontWeight: 'bold', color: '#111827' }}>{event.name}</td>
                                                    <td style={{ padding: '20px', color: '#4b5563' }}>{event.registeredCount}</td>
                                                    <td style={{ padding: '20px', color: '#4b5563' }}>
                                                        {event.attendanceCount !== undefined ? event.attendanceCount : 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '20px', color: '#16a34a', fontWeight: 'bold' }}>
                                                        ₹{(event.registeredCount * (event.registrationFee || 0)).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="saas-card" style={{ padding: '32px', textAlign: 'center', backgroundColor: '#f9fafb', border: '1px dashed #e5e7eb' }}>
                                <p style={{ color: '#6b7280' }}>No completed events to show analytics for.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'ongoing' && (
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Ongoing Events</h2>
                    {events.filter(e => e.status === 'published' || e.status === 'ongoing').length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {events.filter(e => e.status === 'published' || e.status === 'ongoing').map((event) => (
                                <div key={event._id}
                                    className="saas-card hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => navigate(`/organizer/event/${event._id}`)}
                                    style={{
                                        padding: '24px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <span className={`badge ${event.status === 'published' ? 'badge-green' : 'badge-blue'}`} style={{ fontSize: '0.7rem' }}>
                                            {event.status}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' }}>{event.type}</span>
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>{event.name}</h4>
                                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '4px 0 0 0' }}>
                                            {new Date(event.startDate).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '16px', marginTop: 'auto' }}>
                                        <div>
                                            <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>Registrations</p>
                                            <p style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '2px 0 0 0', color: '#111827' }}>{event.registeredCount}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span className="link" style={{ color: '#6d28d9', fontWeight: '800' }}>Manage</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="saas-card" style={{ padding: '60px', textAlign: 'center', backgroundColor: '#f9fafb', border: '1px dashed #e5e7eb' }}>
                            <p style={{ color: '#6b7280', fontWeight: 'bold' }}>No ongoing events at the moment.</p>
                        </div>
                    )}
                </div>
            )}
            {activeTab === 'verifications' && (
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Pending Payment Verifications</h2>
                    {pendingVerifications.length > 0 ? (
                        <div className="saas-card" style={{ overflow: 'hidden', padding: 0 }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="saas-table">
                                    <thead>
                                        <tr>
                                            <th>Ticket ID</th>
                                            <th>Event</th>
                                            <th>Participant</th>
                                            <th>Amount</th>
                                            <th>Proof</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingVerifications.map(ticket => (
                                            <tr key={ticket._id}>
                                                <td className="font-mono text-xs">{ticket.ticketId}</td>
                                                <td>
                                                    <div className="font-bold text-gray-900">{ticket.eventId?.name}</div>
                                                    <div className="text-xs text-gray-500 capitalize">{ticket.eventId?.type}</div>
                                                </td>
                                                <td>
                                                    <div className="text-sm text-gray-900">{ticket.participantId?.firstName} {ticket.participantId?.lastName}</div>
                                                    <div className="text-xs text-gray-500">{ticket.participantId?.email}</div>
                                                </td>
                                                <td className="font-bold text-green-600">₹{ticket.eventId?.registrationFee}</td>
                                                <td>
                                                    {ticket.paymentProof ? (
                                                        <a href={`${import.meta.env.VITE_API_URL}${ticket.paymentProof}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                                                            View Proof
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">No file</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleApprove(ticket._id)}
                                                            className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-sm font-semibold hover:bg-green-200"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(ticket._id)}
                                                            className="bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-200"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="saas-card" style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9fafb' }}>
                            <p className="text-gray-500">No pending verifications found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OrganizerDashboard;
