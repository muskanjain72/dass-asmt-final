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
    const [activeTab, setActiveTab] = useState('overview'); // overview, analytics, participants, registrations, scanner
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [reviewing, setReviewing] = useState(false);

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

    const handleAcceptRegistration = async (ticketId) => {
        if (!window.confirm('Accept this registration?')) return;
        try {
            await api.put(`/tickets/${ticketId}/accept`);
            fetchEventData();
            setSelectedTicket(null);
        } catch (error) {
            alert(error.response?.data?.message || 'Error accepting registration');
        }
    };

    const handleRejectRegistration = async (ticketId) => {
        if (!reviewing && !window.confirm('Reject this registration?')) return;
        try {
            await api.put(`/tickets/${ticketId}/reject`);
            fetchEventData();
            setSelectedTicket(null);
        } catch (error) {
            alert(error.response?.data?.message || 'Error rejecting registration');
        }
    };

    const handleApprovePayment = async (ticketId) => {
        if (!window.confirm('Are you sure you want to approve this payment? This will decrement stock and generate a QR code.')) return;
        try {
            await api.put(`/tickets/${ticketId}/accept`); // Using unified accept endpoint
            fetchEventData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error approving payment');
        }
    };

    const handleRejectPayment = async (ticketId) => {
        if (!window.confirm('Reject this payment proof?')) return;
        try {
            await api.put(`/tickets/${ticketId}/reject`); // Using unified reject endpoint
            fetchEventData();
        } catch (error) {
            console.error("Error rejecting payment", error);
        }
    };

    const handleMarkAttendance = async (ticketId) => {
        if (!window.confirm('Manually mark this participant as attended?')) return;
        try {
            await api.post('/tickets/scan', { manualTicketId: ticketId, eventId: id });
            fetchEventData();
        } catch (error) {
            console.error("Error marking attendance", error);
            alert(error.response?.data?.message || 'Error marking attendance');
        }
    };

    const handleExportAttendance = async () => {
        try {
            const response = await api.get(`/tickets/event/${id}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance-${event.name.replace(/\s+/g, '_')}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error exporting attendance", error);
            alert('Error exporting attendance data.');
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
            <div style={{ display: 'flex', gap: '32px', marginBottom: '32px', borderBottom: '1px solid #e5e7eb', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                {['overview', 'analytics', 'participants', 'registrations', 'scanner'].map((tab) => (
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
                        {tab === 'registrations' ? 'Pending Reviews' : tab}
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
                                {event.tags && event.tags.length > 0 && (
                                    <div>
                                        <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Tags</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {event.tags.map((tag, i) => (
                                                <span key={i} className="badge badge-gray" style={{ fontSize: '0.65rem' }}>{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                                {event.type === 'normal' && (
                                    <div>
                                        <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '4px' }}>Capacity</p>
                                        <p style={{ fontWeight: 'bold', color: '#111827' }}>{event.registrationLimit > 0 ? `${event.registrationLimit} Participants` : 'Unlimited'}</p>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Description</p>
                                    <p style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.5' }}>{event.description}</p>
                                </div>
                                {event.type === 'merchandise' && (
                                    <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #e0f2fe' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: '900', color: '#0369a1', textTransform: 'uppercase', marginBottom: '12px' }}>Merchandise Details</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Stock:</span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{event.merchandiseStock} units</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Limit/Person:</span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{event.purchaseLimit}</span>
                                            </div>
                                            {event.merchandiseVariants?.length > 0 && (
                                                <div style={{ borderTop: '1px solid #bae6fd', paddingTop: '8px', marginTop: '4px' }}>
                                                    {event.merchandiseVariants.map((v, i) => (
                                                        <div key={i} style={{ marginBottom: '4px' }}>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#0c4a6e' }}>{v.category}: </span>
                                                            <span style={{ fontSize: '0.75rem', color: '#334155' }}>{v.options.join(', ')}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderBottom: '1px solid #f3f4f6' }}>
                            <div className="flex items-center gap-4">
                                <h3 className="section-title" style={{ margin: 0 }}>Participant List</h3>
                                <button onClick={handleExportAttendance} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', padding: '6px 12px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export CSV Report
                                </button>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        padding: '10px 16px',
                                        paddingLeft: '40px',
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '0.9rem',
                                        width: '280px',
                                        outline: 'none'
                                    }}
                                />
                                <svg
                                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                                    xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="saas-table-container">
                            <table className="saas-table">
                                <thead>
                                    <tr>
                                        <th style={{ padding: '20px 32px' }}>Participant</th>
                                        <th style={{ padding: '20px' }}>Reg Date</th>
                                        <th style={{ padding: '20px' }}>Ticket ID</th>
                                        <th style={{ padding: '20px' }}>Payment</th>
                                        <th style={{ padding: '20px' }}>Team</th>
                                        <th style={{ padding: '20px' }}>Attendance</th>
                                        <th style={{ padding: '20px 32px' }}>Action</th>
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
                                            <td style={{ padding: '16px' }}>
                                                <span className={`badge ${ticket.scannedAt ? 'badge-green' : 'badge-gray'}`} style={{ width: '80px', textAlign: 'center' }}>
                                                    {ticket.scannedAt ? 'Present' : 'Absent'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 32px' }}>
                                                {!ticket.scannedAt && (ticket.status === 'Successful' || ticket.paymentStatus === 'free') && (
                                                    <button
                                                        onClick={() => handleMarkAttendance(ticket.ticketId)}
                                                        className="text-purple-600 font-bold hover:underline text-xs"
                                                    >
                                                        Check-in
                                                    </button>
                                                )}
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

                {activeTab === 'registrations' && (
                    <div style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 className="section-title" style={{ margin: 0 }}>Pending Registrations</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <span className="badge badge-orange">
                                    {participants.filter(p => p.status === 'pending').length} Needs Review
                                </span>
                            </div>
                        </div>

                        <div className="saas-table-container">
                            <table className="saas-table">
                                <thead>
                                    <tr>
                                        <th>Participant</th>
                                        <th>Ticket ID</th>
                                        <th>Reg. Date</th>
                                        <th>Form Responses</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {participants.filter(p => p.status === 'pending').map((ticket) => (
                                        <tr key={ticket._id}>
                                            <td>
                                                <p style={{ fontWeight: 'bold', margin: 0 }}>{ticket.participantId.firstName} {ticket.participantId.lastName}</p>
                                                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>{ticket.participantId.email}</p>
                                            </td>
                                            <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>#{ticket.ticketId.slice(0, 8)}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button
                                                    onClick={() => { setSelectedTicket(ticket); setReviewing(true); }}
                                                    className="text-purple-600 font-bold hover:underline py-1 px-3 rounded-lg bg-purple-50"
                                                    style={{ fontSize: '0.8rem' }}
                                                >
                                                    View Responses
                                                </button>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => handleAcceptRegistration(ticket._id)}
                                                        className="btn-primary"
                                                        style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#10b981' }}
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectRegistration(ticket._id)}
                                                        className="btn-outline"
                                                        style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {participants.filter(p => p.status === 'pending').length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                                                No pending registrations to review.
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

                            <QRScanner onScanSuccess={{
                                eventId: id,
                                callback: () => {
                                    setTimeout(() => fetchEventData(), 800);
                                }
                            }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {reviewing && selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
                        <div className="px-6 py-4 bg-purple-600 text-white flex justify-between items-center" style={{ background: 'var(--primary-gradient)' }}>
                            <h2 className="text-xl font-bold">Review Registration</h2>
                            <button onClick={() => setReviewing(false)} className="text-white hover:text-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{selectedTicket.participantId.firstName} {selectedTicket.participantId.lastName}</h3>
                                <p className="text-sm text-gray-500">{selectedTicket.participantId.email}</p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Form Responses</h4>
                                {selectedTicket.responses && Object.keys(selectedTicket.responses).length > 0 ? (
                                    <div className="grid gap-4">
                                        {Object.entries(selectedTicket.responses).map(([label, value], i) => (
                                            <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">{label}</p>
                                                <div className="text-sm text-gray-900 font-medium">
                                                    {typeof value === 'string' && value.startsWith('http') ? (
                                                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline flex items-center gap-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                            View File
                                                        </a>
                                                    ) : (
                                                        Array.isArray(value) ? value.join(', ') : (value?.toString() || 'No response')
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No custom form responses provided.</p>
                                )}
                            </div>

                            {selectedTicket.paymentProof && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payment Proof</h4>
                                    <img
                                        src={`${api.defaults.baseURL.replace('/api', '')}${selectedTicket.paymentProof}`}
                                        alt="Payment Proof"
                                        className="w-full rounded-xl border border-gray-200"
                                    />
                                </div>
                            )}

                            <div className="pt-6 border-t border-gray-100 flex gap-4">
                                <button
                                    onClick={() => handleRejectRegistration(selectedTicket._id)}
                                    className="flex-1 px-4 py-3 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-bold text-sm"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleAcceptRegistration(selectedTicket._id)}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-bold text-sm"
                                >
                                    Accept
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default OrganizerEventDetails;
