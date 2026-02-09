import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const OrganizerDashboard = () => {
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

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
    const totalAttendance = events.reduce((acc, event) => acc + (event.attendanceCount || 0), 0);
    const publishedEventsCount = events.filter(e => e.status === 'published' || e.status === 'ongoing').length;
    const draftsCount = events.filter(e => e.status === 'draft').length;

    if (loading) return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            <div className="loader"></div>
            <p style={{ marginTop: '16px', color: '#6b7280' }}>Fetching your events...</p>
        </div>
    );

    const handleQuickPublish = async (id) => {
        if (!window.confirm('Publish this event now? It will become visible to all users.')) return;
        try {
            await api.put(`/events/${id}`, { status: 'published' });
            fetchMyEvents();
        } catch (error) {
            alert('Error publishing event');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'dashboard' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827' }}>Organizer Overview</h1>
                            <p style={{ color: '#6b7280', marginTop: '4px' }}>Analyze your event performance and reach.</p>
                        </div>
                        <Link to="/organizer/create-event" className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Create New Event
                        </Link>
                    </div>

                    {/* Stats Grid */}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>Your Events</h2>
                            <Link to="/organizer/dashboard?tab=ongoing" style={{ fontSize: '0.875rem', color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>View All Table</Link>
                        </div>

                        {events.length > 0 ? (
                            <div style={{
                                display: 'flex',
                                gap: '20px',
                                overflowX: 'auto',
                                paddingBottom: '16px',
                                scrollSnapType: 'x mandatory',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none'
                            }} className="no-scrollbar">
                                {events.map((event) => (
                                    <div key={event._id} className="saas-card" style={{
                                        minWidth: '300px',
                                        flexShrink: 0,
                                        scrollSnapAlign: 'start',
                                        padding: '20px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <span className={`badge ${event.status === 'published' ? 'badge-green' : event.status === 'draft' ? 'badge-orange' : event.status === 'ongoing' ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                                                {event.status}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>{event.type}</span>
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>{event.name}</h4>
                                            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '4px 0 0 0' }}>{new Date(event.startDate).toLocaleDateString()}</p>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '12px', marginTop: '4px' }}>
                                            <div>
                                                <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>Regs</p>
                                                <p style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>{event.registeredCount}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {event.status === 'draft' && (
                                                    <button onClick={() => handleQuickPublish(event._id)} className="link" style={{ color: '#10b981' }}>Publish</button>
                                                )}
                                                <Link
                                                    to={`/organizer/event/${event._id}`}
                                                    className="link"
                                                    style={{ alignSelf: 'center', fontSize: '0.875rem', fontWeight: '600' }}
                                                >
                                                    Manage
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="saas-card" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                                No events found. Create your first event to get started!
                            </div>
                        )}
                    </div>

                    <div className="saas-card" style={{ padding: '32px', textAlign: 'center', backgroundColor: '#f9fafb', border: '2px dashed #e5e7eb' }}>
                        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                            <div style={{ backgroundColor: '#f3f4f6', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>Event Management</h3>
                            <p style={{ color: '#6b7280', marginTop: '8px' }}>Use the details page to track attendance, approve orders, and export participant lists.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="saas-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '32px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>My Events</h2>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>Manage your ongoing and upcoming event listings.</p>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: 'bold', backgroundColor: 'white', padding: '8px 16px', borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            Published: {publishedEventsCount}
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="saas-table" style={{ border: 'none' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '20px 32px' }}>Event Name</th>
                                    <th style={{ padding: '20px' }}>Type</th>
                                    <th style={{ padding: '20px' }}>Registrations</th>
                                    <th style={{ padding: '20px' }}>Start Date</th>
                                    <th style={{ padding: '20px' }}>Status</th>
                                    <th style={{ padding: '20px 32px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody style={{ borderTop: '1px solid #f3f4f6' }}>
                                {events.map((event) => (
                                    <tr key={event._id}>
                                        <td style={{ padding: '20px 32px', fontWeight: 'bold', color: '#111827' }}>{event.name}</td>
                                        <td>
                                            <span style={{ fontSize: '0.875rem', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '4px 10px', borderRadius: '6px' }}>
                                                {event.type === 'normal' ? 'Event' : 'Merchandise'}
                                            </span>
                                        </td>
                                        <td style={{ color: '#4b5563' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: 'bold', color: '#111827' }}>{event.registeredCount}</span>
                                                <span style={{ color: '#9ca3af' }}>/ {event.registrationLimit > 0 ? event.registrationLimit : '∞'}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: '#4b5563' }}>{new Date(event.startDate).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge ${event.status === 'published' ? 'badge-green' : event.status === 'draft' ? 'badge-orange' : 'badge-gray'}`} style={{ fontWeight: '900', padding: '6px 16px', borderRadius: '9999px' }}>
                                                {event.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                {event.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleQuickPublish(event._id)}
                                                        style={{
                                                            padding: '8px 16px', backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #d1fae5', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.875rem', cursor: 'pointer'
                                                        }}
                                                    >
                                                        Publish
                                                    </button>
                                                )}
                                                <Link
                                                    to={`/organizer/event/${event._id}`}
                                                    style={{
                                                        padding: '8px 16px', backgroundColor: '#f9fafb', color: '#2563eb', border: '1px solid #e5e7eb', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '4px'
                                                    }}
                                                >
                                                    Manage
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {events.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '80px 24px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                                            No events found. Click 'Create New Event' to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizerDashboard;
