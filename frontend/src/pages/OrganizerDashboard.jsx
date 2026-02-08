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
    const publishedEventsCount = events.filter(e => e.status === 'published').length;

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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                        <div className="saas-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '12px', borderRadius: '12px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#6b7280', margin: 0 }}>Total Events</p>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '4px 0 0 0' }}>{events.length}</h3>
                            </div>
                        </div>

                        <div className="saas-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ backgroundColor: '#f0fdf4', color: '#16a34a', padding: '12px', borderRadius: '12px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#6b7280', margin: 0 }}>Total Registrations</p>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '4px 0 0 0' }}>{totalRegistrations}</h3>
                            </div>
                        </div>

                        <div className="saas-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ backgroundColor: '#fff7ed', color: '#ea580c', padding: '12px', borderRadius: '12px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#6b7280', margin: 0 }}>Est. Revenue</p>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '4px 0 0 0' }}>₹{totalRevenue.toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="saas-card" style={{ padding: '32px', textAlign: 'center', backgroundColor: '#f9fafb', border: '2px dashed #e5e7eb' }}>
                        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                            <div style={{ backgroundColor: '#f3f4f6', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>Quick Tip</h3>
                            <p style={{ color: '#6b7280', marginTop: '8px' }}>Keep your event status as 'published' to allow participants to discover and register for them.</p>
                            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                                <div style={{ textAlign: 'left', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', flex: 1 }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', margin: 0 }}>Active Now</p>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>{publishedEventsCount}</p>
                                </div>
                                <div style={{ textAlign: 'left', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', flex: 1 }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', margin: 0 }}>Drafts</p>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ea580c', margin: 0 }}>{events.length - publishedEventsCount}</p>
                                </div>
                            </div>
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
                                            <Link
                                                to={`/organizer/event/${event._id}`}
                                                style={{
                                                    padding: '8px 16px', backgroundColor: '#f9fafb', color: '#2563eb', border: '1px solid #e5e7eb', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '4px'
                                                }}
                                            >
                                                Manage
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                                            </Link>
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
