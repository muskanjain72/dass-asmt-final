import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import QRScanner from './QRScanner';

const OrganizerEventDetails = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [stats, setStats] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [filteredParticipants, setFilteredParticipants] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, analytics, participants, scanner

    useEffect(() => {
        fetchEventData();
    }, [id]);

    useEffect(() => {
        if (participants.length > 0) {
            const filtered = participants.filter(p => {
                const searchLower = searchQuery.toLowerCase();
                const fullName = `${p.participantId.firstName} ${p.participantId.lastName}`.toLowerCase();
                return fullName.includes(searchLower) || p.participantId.email.toLowerCase().includes(searchLower) || p.ticketId.toLowerCase().includes(searchLower);
            });
            setFilteredParticipants(filtered);
        }
    }, [searchQuery, participants]);

    const fetchEventData = async () => {
        try {
            setLoading(true);
            const [eventRes, statsRes, participantsRes] = await Promise.all([
                api.get(`/events/${id}`),
                api.get(`/events/${id}/stats`),
                api.get(`/tickets/event/${id}`)
            ]);
            setEvent(eventRes.data);
            setStats(statsRes.data);
            setParticipants(participantsRes.data);
            setFilteredParticipants(participantsRes.data);
        } catch (error) {
            console.error("Error fetching event details", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!window.confirm(`Change status to ${newStatus}?`)) return;
        try {
            await api.put(`/events/${id}`, { status: newStatus });
            fetchEventData();
        } catch (error) {
            alert('Error updating status');
        }
    };

    const downloadCSV = () => {
        if (!participants.length) return;
        const headers = ['Name', 'Email', 'Registration Date', 'Status', 'Payment', 'Attendance'];
        const rows = participants.map(p => [
            `"${p.participantId.firstName} ${p.participantId.lastName}"`,
            `"${p.participantId.email}"`,
            `"${new Date(p.createdAt).toLocaleDateString()}"`,
            `"${p.status}"`,
            `"${p.paymentStatus}"`,
            `"${p.status === 'attended' ? 'Present' : 'Absent'}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers, ...rows].map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `participants_${event.name.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="text-center py-12"><div className="loader"></div><p style={{ marginTop: '12px', color: '#6b7280' }}>Loading Event Data...</p></div>;
    if (!event) return <div className="text-center py-12" style={{ color: '#dc2626', fontWeight: 'bold' }}>Event not found</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>{event.name}</h1>
                        <span className={`badge ${event.status === 'published' ? 'badge-green' : event.status === 'draft' ? 'badge-orange' : event.status === 'ongoing' ? 'badge-blue' : 'badge-gray'}`} style={{ textTransform: 'uppercase', fontSize: '0.75rem', padding: '6px 14px' }}>
                            {event.status}
                        </span>
                    </div>
                    <p style={{ color: '#6b7280', marginTop: '8px' }}>Created on {new Date(event.createdAt).toLocaleDateString()}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {event.status === 'draft' && (
                        <button onClick={() => handleStatusUpdate('published')} className="btn-primary" style={{ padding: '10px 20px', backgroundColor: '#10b981' }}>
                            Publish Event
                        </button>
                    )}
                    {(event.status === 'published' || event.status === 'ongoing') && (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => handleStatusUpdate('draft')} className="btn-outline" style={{ padding: '10px 20px', color: '#6b7280', borderColor: '#e5e7eb' }}>
                                Revert to Draft
                            </button>
                            <button onClick={() => handleStatusUpdate('closed')} className="btn-primary" style={{ padding: '10px 20px', backgroundColor: '#ef4444' }}>
                                Close Registrations
                            </button>
                        </div>
                    )}
                    <Link to={`/organizer/create-event?edit=${id}`} className="btn-outline" style={{ padding: '10px 20px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '32px', marginBottom: '32px', borderBottom: '1px solid #e5e7eb' }}>
                {['overview', 'analytics', 'participants', 'scanner'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '12px 4px',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '3px solid #6d28d9' : '3px solid transparent',
                            color: activeTab === tab ? '#6d28d9' : '#6b7280',
                            fontWeight: 'bold',
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="saas-card" style={{ padding: '0', overflow: 'hidden' }}>
                {activeTab === 'overview' && (
                    <div style={{ padding: '32px' }}>
                        <h3 className="section-title">Event Overview</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Type</p>
                                    <p style={{ fontWeight: 'bold', color: '#111827' }}>{event.type === 'normal' ? 'Workshop / Competition' : 'Merchandise Listing'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Eligibility</p>
                                    <p style={{ fontWeight: 'bold', color: '#111827' }}>{event.eligibility || 'Open to All'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Pricing</p>
                                    <p style={{ fontWeight: 'bold', color: '#111827' }}>{event.registrationFee > 0 ? `₹${event.registrationFee.toLocaleString()}` : 'Free'}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Registration Deadline</p>
                                    <p style={{ fontWeight: 'bold', color: '#111827' }}>{new Date(event.registrationDeadline).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Event Dates</p>
                                    <p style={{ fontWeight: 'bold', color: '#111827' }}>
                                        {new Date(event.startDate).toLocaleDateString()} — {new Date(event.endDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#4b5563', marginBottom: '8px' }}>Description</p>
                                <p style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.6' }}>{event.description}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && stats && (
                    <div style={{ padding: '32px' }}>
                        <h3 className="section-title">Deep-Dive Analytics</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                            <div className="saas-card" style={{ padding: '24px', backgroundColor: '#f8fafc' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Revenue</p>
                                <h4 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a', margin: '4px 0' }}>₹{stats.revenue.toLocaleString()}</h4>
                                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Total earnings generated</p>
                            </div>
                            <div className="saas-card" style={{ padding: '24px', backgroundColor: '#f0fdf4' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#166534', textTransform: 'uppercase', margin: 0 }}>Registrations</p>
                                <h4 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#14532d', margin: '4px 0' }}>{stats.registrations}</h4>
                                <p style={{ fontSize: '0.875rem', color: '#166534' }}>{((stats.registrations / (event.registrationLimit || 1)) * 100).toFixed(1)}% of capacity</p>
                            </div>
                            <div className="saas-card" style={{ padding: '24px', backgroundColor: '#eff6ff' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#1e40af', textTransform: 'uppercase', margin: 0 }}>Attendance</p>
                                <h4 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e3a8a', margin: '4px 0' }}>{participants.filter(p => !!p.scannedAt).length}</h4>
                                <p style={{ fontSize: '0.875rem', color: '#1e40af' }}>{((participants.filter(p => !!p.scannedAt).length / (stats.registrations || 1)) * 100).toFixed(1)}% turn-out</p>
                            </div>
                            <div className="saas-card" style={{ padding: '24px', backgroundColor: '#faf5ff' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#6b21a8', textTransform: 'uppercase', margin: 0 }}>Completion Rate</p>
                                <h4 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#581c87', margin: '4px 0' }}>100%</h4>
                                <p style={{ fontSize: '0.875rem', color: '#6b21a8' }}>Team data finalized</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'participants' && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                            <div className="input-with-icon" style={{ flex: 1, maxWidth: '400px' }}>
                                <span className="icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                </span>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Search by name, email or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button onClick={downloadCSV} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                Export CSV
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="saas-table">
                                <thead>
                                    <tr>
                                        <th style={{ padding: '20px 32px' }}>Participant</th>
                                        <th style={{ padding: '20px' }}>Reg Date</th>
                                        <th style={{ padding: '20px' }}>Ticket ID</th>
                                        <th style={{ padding: '20px' }}>Payment</th>
                                        <th style={{ padding: '20px' }}>Team</th>
                                        <th style={{ padding: '20px 32px' }}>Attendance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredParticipants.map((ticket) => (
                                        <tr key={ticket._id}>
                                            <td style={{ padding: '16px 32px' }}>
                                                <div>
                                                    <p style={{ fontWeight: 'bold', color: '#111827', margin: 0 }}>{ticket.participantId.firstName} {ticket.participantId.lastName}</p>
                                                    <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>{ticket.participantId.email}</p>
                                                </div>
                                            </td>
                                            <td style={{ color: '#6b7280' }}>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                            <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#4b5563' }}>{ticket.ticketId.slice(0, 8)}...</td>
                                            <td>
                                                <span className={`badge ${ticket.paymentStatus === 'completed' ? 'badge-green' : ticket.paymentStatus === 'free' ? 'badge-blue' : 'badge-orange'}`}>
                                                    {ticket.paymentStatus}
                                                </span>
                                            </td>
                                            <td style={{ color: '#6b7280' }}>Individual</td>
                                            <td style={{ padding: '16px 32px' }}>
                                                <span className={`badge ${ticket.scannedAt ? 'badge-green' : 'badge-gray'}`} style={{ width: '80px', textAlign: 'center' }}>
                                                    {ticket.scannedAt ? 'Present' : 'Absent'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredParticipants.length === 0 && (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '64px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                                                {searchQuery ? 'No participants match your search.' : 'No registrations yet.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'scanner' && (
                    <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                            <h3 className="section-title">Live Attendance Tracker</h3>
                            <p style={{ color: '#6b7280', marginBottom: '32px' }}>Scan participant QR codes to mark attendance and track live turn-out numbers.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '40px' }}>
                                <div style={{ backgroundColor: '#f0fdf4', padding: '24px', borderRadius: '16px', border: '1px solid #dcfce7' }}>
                                    <span style={{ display: 'block', fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{participants.filter(p => !!p.scannedAt).length}</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase' }}>Present</span>
                                </div>
                                <div style={{ backgroundColor: '#f9fafb', padding: '24px', borderRadius: '16px', border: '1px solid #f3f4f6' }}>
                                    <span style={{ display: 'block', fontSize: '2rem', fontWeight: 'bold', color: '#6b7280' }}>{participants.length - participants.filter(p => !!p.scannedAt).length}</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase' }}>Pending</span>
                                </div>
                            </div>

                            <QRScanner onScanSuccess={() => {
                                setTimeout(() => fetchEventData(), 800);
                            }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default OrganizerEventDetails;
