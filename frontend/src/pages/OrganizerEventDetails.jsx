import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import QRScanner from './QRScanner';
import Forum from '../components/Forum';
import { useAuth } from '../context/AuthContext';

const OrganizerEventDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [stats, setStats] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [filteredParticipants, setFilteredParticipants] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, analytics, participants, registrations, scanner
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [reviewing, setReviewing] = useState(false);
    const [actionLoading, setActionLoading] = useState(null); // ticketId being actioned

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
        try {
            await api.put(`/events/${id}`, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            fetchEventData();
        } catch (error) {
            toast.error('Error updating status');
        }
    };

    const handleAcceptRegistration = async (ticketId) => {
        try {
            await api.put(`/tickets/${ticketId}/accept`);
            toast.success('Registration accepted');
            fetchEventData();
            setSelectedTicket(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error accepting registration');
        }
    };

    const handleRejectRegistration = async (ticketId) => {
        try {
            await api.put(`/tickets/${ticketId}/reject`);
            toast.success('Registration rejected');
            fetchEventData();
            setSelectedTicket(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error rejecting registration');
        }
    };

    const handleApprovePayment = async (ticketMongoId) => {
        setActionLoading(ticketMongoId);
        try {
            await api.put(`/tickets/${ticketMongoId}/approve`);
            toast.success('Payment approved');
            fetchEventData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error approving payment');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectPayment = async (ticketMongoId) => {
        setActionLoading(ticketMongoId);
        try {
            await api.put(`/tickets/${ticketMongoId}/reject-payment`);
            toast.success('Payment rejected');
            fetchEventData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error rejecting payment');
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkAttendance = async (ticketId) => {
        try {
            await api.post('/tickets/scan', { manualTicketId: ticketId, eventId: id });
            toast.success('Attendance marked');
            fetchEventData();
        } catch (error) {
            console.error("Error marking attendance", error);
            toast.error(error.response?.data?.message || 'Error marking attendance');
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
            toast.error('Error exporting attendance data.');
        }
    };

    const getMerchStatusBadge = (ticket) => {
        const ps = ticket.paymentStatus;
        const s = ticket.status;
        if (ps === 'completed' || s === 'Approved') return { label: '✓ Approved', color: '#059669', bg: '#d1fae5', border: '#6ee7b7' };
        if (ps === 'rejected' || s === 'Rejected') return { label: '✕ Rejected', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' };
        if (ps === 'pending_approval') return { label: '⏳ Pending', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' };
        return { label: '📤 Awaiting Proof', color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' };
    };

    if (loading) return <div className="text-center py-12"><div className="loader"></div><p style={{ marginTop: '12px', color: '#6b7280' }}>Loading Event Data...</p></div>;
    if (!event) return <div className="text-center py-12" style={{ color: '#dc2626', fontWeight: 'bold' }}>Event not found</div>;

    // Pending counts for badge
    const pendingMerchCount = participants.filter(p => p.paymentStatus === 'pending_approval').length;
    const pendingNormalCount = participants.filter(p => p.status === 'pending' && p.paymentStatus !== 'pending_approval').length;
    const totalPendingCount = pendingMerchCount + pendingNormalCount;

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
                {['overview', 'analytics', 'participants', 'registrations', 'scanner', 'discussion'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            paddingBottom: '16px',
                            paddingTop: '8px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: activeTab === tab ? '700' : '500',
                            color: activeTab === tab ? '#7c3aed' : '#6b7280',
                            borderBottom: activeTab === tab ? '2px solid #7c3aed' : '2px solid transparent',
                            textTransform: 'capitalize',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {tab === 'registrations' ? 'Pending Reviews' : tab}
                        {tab === 'registrations' && totalPendingCount > 0 && (
                            <span style={{ background: '#ef4444', color: 'white', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', lineHeight: '1.4' }}>{totalPendingCount}</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="saas-card" style={{ padding: '0', overflow: 'hidden' }}>

                {/* ─── OVERVIEW TAB ─────────────────────────────────────────── */}
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

                {/* ─── ANALYTICS TAB ────────────────────────────────────────── */}
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

                {/* ─── PARTICIPANTS TAB ──────────────────────────────────────── */}
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
                                                <span className={`badge ${ticket.status === 'Approved' || ticket.paymentStatus === 'completed' ? 'badge-green' : ticket.paymentStatus === 'free' ? 'badge-blue' : 'badge-orange'}`}>
                                                    {ticket.status === 'Approved' ? 'Approved' : (ticket.paymentStatus?.replace('_', ' ') || ticket.status)}
                                                </span>
                                            </td>
                                            <td style={{ color: '#6b7280' }}>Individual</td>
                                            <td style={{ padding: '16px' }}>
                                                <span className={`badge ${ticket.scannedAt ? 'badge-green' : 'badge-gray'}`} style={{ width: '80px', textAlign: 'center' }}>
                                                    {ticket.scannedAt ? 'Present' : 'Absent'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 32px' }}>
                                                {!ticket.scannedAt && (ticket.status === 'Approved' || ticket.status === 'Successful' || ticket.paymentStatus === 'free') && (
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
                                            <td colSpan="7" style={{ padding: '64px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                                                {searchQuery ? 'No participants match your search.' : 'No registrations yet.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ─── PENDING REVIEWS TAB ──────────────────────────────────── */}
                {activeTab === 'registrations' && (() => {
                    // Merch orders: only relevant when the event itself is merchandise type
                    const merchOrders = event.type === 'merchandise'
                        ? participants.filter(p =>
                            p.paymentStatus === 'pending_approval' ||
                            p.paymentStatus === 'completed' ||
                            p.paymentStatus === 'rejected' ||
                            p.status === 'Approved' ||
                            p.status === 'Rejected' ||
                            p.status === 'pending_payment')
                        : [];

                    // Normal event pending registrations (not merch)
                    const normalPending = event.type !== 'merchandise'
                        ? participants.filter(p => p.status === 'pending' && p.paymentStatus !== 'pending_approval')
                        : [];
                    const pendingMerch = merchOrders.filter(p => p.paymentStatus === 'pending_approval');

                    return (
                        <div style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 className="section-title" style={{ margin: 0 }}>Pending Reviews</h3>
                                <span className="badge badge-orange">{totalPendingCount} Needs Review</span>
                            </div>

                            {/* ── Merch Payment Proofs ─────────────────────────────── */}
                            {event.type === 'merchandise' && (
                                <div style={{ marginBottom: '36px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '1rem' }}>🛍</span>
                                        <h4 style={{ margin: 0, fontWeight: 800, color: '#374151', fontSize: '1rem' }}>Merchandise Orders</h4>
                                        {pendingMerch.length > 0 && (
                                            <span className="badge badge-orange" style={{ fontSize: '0.7rem' }}>{pendingMerch.length} pending</span>
                                        )}
                                    </div>

                                    {merchOrders.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                                            <p style={{ fontSize: '2rem', marginBottom: '8px' }}>📦</p>
                                            <p style={{ fontWeight: 700, color: '#6b7280' }}>No orders yet</p>
                                            <p style={{ fontSize: '0.85rem' }}>Orders will appear here once participants place them.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                            {merchOrders.map(ticket => {
                                                const badge = getMerchStatusBadge(ticket);
                                                const isPending = ticket.paymentStatus === 'pending_approval';
                                                const isApproved = ticket.paymentStatus === 'completed' || ticket.status === 'Approved';
                                                const isRejected = ticket.paymentStatus === 'rejected' || ticket.status === 'Rejected';
                                                const isActioning = actionLoading === ticket._id;

                                                return (
                                                    <div key={ticket._id} style={{
                                                        background: 'white',
                                                        border: `1.5px solid ${badge.border}`,
                                                        borderRadius: '16px',
                                                        overflow: 'hidden',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                                        opacity: isActioning ? 0.7 : 1,
                                                        transition: 'opacity 0.2s'
                                                    }}>
                                                        {/* Payment Proof Image */}
                                                        {ticket.paymentProof ? (
                                                            <div style={{ position: 'relative', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                                <img
                                                                    src={ticket.paymentProof}
                                                                    alt="Payment Proof"
                                                                    style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', display: 'block' }}
                                                                />
                                                                <a
                                                                    href={ticket.paymentProof}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '8px', padding: '4px 10px', fontSize: '0.7rem', fontWeight: 800, textDecoration: 'none' }}
                                                                >
                                                                    🔍 Full View
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <div style={{ height: '100px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e5e7eb' }}>
                                                                <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: 0 }}>📤 No proof uploaded yet</p>
                                                            </div>
                                                        )}

                                                        {/* Ticket Details */}
                                                        <div style={{ padding: '16px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                                                <div>
                                                                    <p style={{ fontWeight: 800, margin: '0 0 2px', color: '#111827' }}>{ticket.participantId.firstName} {ticket.participantId.lastName}</p>
                                                                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>{ticket.participantId.email}</p>
                                                                </div>
                                                                {/* Status Badge */}
                                                                <span style={{
                                                                    background: badge.bg,
                                                                    color: badge.color,
                                                                    border: `1px solid ${badge.border}`,
                                                                    borderRadius: '8px',
                                                                    padding: '3px 10px',
                                                                    fontSize: '0.72rem',
                                                                    fontWeight: 800,
                                                                    whiteSpace: 'nowrap'
                                                                }}>
                                                                    {badge.label}
                                                                </span>
                                                            </div>

                                                            {/* Purchase details */}
                                                            <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '8px 12px', marginBottom: '12px', fontSize: '0.78rem', color: '#374151' }}>
                                                                <span style={{ fontWeight: 700 }}>Qty:</span> {ticket.purchaseData?.quantity || 1}
                                                                {ticket.purchaseData?.variant && <span style={{ marginLeft: '12px' }}><span style={{ fontWeight: 700 }}>Variant:</span> {ticket.purchaseData.variant}</span>}
                                                                {ticket.purchaseData?.variants && Object.entries(Object.fromEntries(ticket.purchaseData.variants || new Map())).map(([k, v]) => (
                                                                    <span key={k} style={{ marginLeft: '12px' }}><span style={{ fontWeight: 700 }}>{k}:</span> {v}</span>
                                                                ))}
                                                                <span style={{ marginLeft: '12px', fontWeight: 700 }}>₹{event.registrationFee || 0}</span>
                                                            </div>

                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                                <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: 0 }}>
                                                                    {ticket.paymentProof ? `Submitted ${new Date(ticket.updatedAt).toLocaleDateString()}` : `Ordered ${new Date(ticket.createdAt).toLocaleDateString()}`}
                                                                </p>
                                                                <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#9ca3af', background: '#f3f4f6', padding: '2px 8px', borderRadius: '6px' }}>#{ticket.ticketId.slice(0, 8)}</span>
                                                            </div>

                                                            {/* Action Buttons — only for pending_approval */}
                                                            {isPending && (
                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                    <button
                                                                        onClick={() => handleRejectPayment(ticket._id)}
                                                                        disabled={isActioning}
                                                                        style={{ flex: 1, padding: '8px', background: 'white', border: '1.5px solid #fca5a5', borderRadius: '10px', color: '#dc2626', fontWeight: 800, fontSize: '0.8rem', cursor: isActioning ? 'not-allowed' : 'pointer' }}
                                                                    >
                                                                        {isActioning ? '...' : '✕ Reject'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleApprovePayment(ticket._id)}
                                                                        disabled={isActioning}
                                                                        style={{ flex: 1, padding: '8px', background: 'linear-gradient(135deg,#059669,#10b981)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 800, fontSize: '0.8rem', cursor: isActioning ? 'not-allowed' : 'pointer' }}
                                                                    >
                                                                        {isActioning ? '...' : '✓ Approve'}
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {/* Already processed — show info */}
                                                            {isApproved && (
                                                                <div style={{ background: '#d1fae5', borderRadius: '8px', padding: '8px 12px', textAlign: 'center', fontSize: '0.78rem', fontWeight: 800, color: '#065f46' }}>
                                                                    ✓ Order Approved — QR & ticket sent to participant
                                                                </div>
                                                            )}
                                                            {isRejected && (
                                                                <div style={{ background: '#fee2e2', borderRadius: '8px', padding: '8px 12px', textAlign: 'center', fontSize: '0.78rem', fontWeight: 800, color: '#991b1b' }}>
                                                                    ✕ Payment Rejected — participant notified
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Normal Event Registrations ───────────────────────── */}
                            {normalPending.length > 0 && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                        <span style={{ fontSize: '1rem' }}>🎟</span>
                                        <h4 style={{ margin: 0, fontWeight: 800, color: '#374151', fontSize: '1rem' }}>Event Registrations</h4>
                                        <span className="badge badge-orange" style={{ fontSize: '0.7rem' }}>{normalPending.length}</span>
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
                                                {normalPending.map((ticket) => (
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
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* All caught up */}
                            {totalPendingCount === 0 && pendingMerch.length === 0 && normalPending.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '64px 0', color: '#9ca3af' }}>
                                    <p style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</p>
                                    <p style={{ fontWeight: 700, color: '#6b7280' }}>All caught up!</p>
                                    <p style={{ fontSize: '0.85rem' }}>No pending registrations or payment proofs to review.</p>
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* ─── SCANNER TAB ──────────────────────────────────────────── */}
                {activeTab === 'scanner' && (() => {
                    const scannedCount = participants.filter(p => !!p.scannedAt).length;
                    const totalCount = participants.filter(p => p.status === 'Approved' || p.paymentStatus === 'free' || p.status === 'attended').length || participants.length;
                    const attendancePct = totalCount > 0 ? Math.round((scannedCount / totalCount) * 100) : 0;

                    return (
                        <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: '32px', alignItems: 'start' }}>
                            {/* Left: Stats + Scanner */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <h3 className="section-title" style={{ marginBottom: '4px' }}>Live Attendance Dashboard</h3>
                                    <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>Scan QR codes to mark attendance in real-time</p>
                                </div>

                                {/* Stats Row */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', padding: '20px', borderRadius: '16px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                                        <span style={{ display: 'block', fontSize: '2.2rem', fontWeight: 900, color: '#16a34a' }}>{scannedCount}</span>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✓ Present</span>
                                    </div>
                                    <div style={{ background: 'linear-gradient(135deg,#fef2f2,#fee2e2)', padding: '20px', borderRadius: '16px', border: '1px solid #fecaca', textAlign: 'center' }}>
                                        <span style={{ display: 'block', fontSize: '2.2rem', fontWeight: 900, color: '#dc2626' }}>{totalCount - scannedCount}</span>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⏳ Absent</span>
                                    </div>
                                    <div style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', padding: '20px', borderRadius: '16px', border: '1px solid #ddd6fe', textAlign: 'center' }}>
                                        <span style={{ display: 'block', fontSize: '2.2rem', fontWeight: 900, color: '#7c3aed' }}>{totalCount}</span>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>👥 Total</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1.5px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>Attendance Rate</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#7c3aed' }}>{attendancePct}%</span>
                                    </div>
                                    <div style={{ height: '10px', background: '#f3f4f6', borderRadius: '9999px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${attendancePct}%`,
                                            background: 'linear-gradient(90deg, #7c3aed, #10b981)',
                                            borderRadius: '9999px',
                                            transition: 'width 0.5s ease'
                                        }} />
                                    </div>
                                    <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: '8px 0 0' }}>
                                        {scannedCount} of {totalCount} registered participants have checked in
                                    </p>
                                </div>

                                {/* Participant List with Attendance Status */}
                                <div style={{ background: 'white', borderRadius: '16px', border: '1.5px solid #e5e7eb', overflow: 'hidden' }}>
                                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#374151' }}>Participant Attendance</p>
                                        <button
                                            onClick={handleExportAttendance}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#6d28d9', background: '#f5f3ff', border: '1.5px solid #c4b5fd', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}
                                        >
                                            ⬇ Export CSV
                                        </button>
                                    </div>
                                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                                        {participants.length === 0 ? (
                                            <p style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '0.85rem' }}>No participants yet</p>
                                        ) : (
                                            participants.map(ticket => (
                                                <div key={ticket._id} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    padding: '12px 20px',
                                                    borderBottom: '1px solid #f9fafb',
                                                    background: ticket.scannedAt ? '#f0fdf4' : 'white'
                                                }}>
                                                    <div style={{
                                                        width: '32px', height: '32px', borderRadius: '50%',
                                                        background: ticket.scannedAt ? '#dcfce7' : '#f3f4f6',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.9rem', flexShrink: 0
                                                    }}>
                                                        {ticket.scannedAt ? '✅' : '⏳'}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', color: '#111827' }}>
                                                            {ticket.participantId.firstName} {ticket.participantId.lastName}
                                                        </p>
                                                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#6b7280' }}>{ticket.participantId.email}</p>
                                                    </div>
                                                    {ticket.scannedAt ? (
                                                        <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                            {new Date(ticket.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleMarkAttendance(ticket.ticketId)}
                                                            style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6d28d9', background: '#f5f3ff', border: '1px solid #c4b5fd', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                        >
                                                            Check-in
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: QR Scanner */}
                            <div>
                                <QRScanner onScanSuccess={{
                                    eventId: id,
                                    callback: () => { setTimeout(() => fetchEventData(), 800); }
                                }} />
                            </div>
                        </div>
                    );
                })()}

                {/* ─── DISCUSSION TAB ─────────────────────────────────────── */}
                {activeTab === 'discussion' && user && (
                    <div style={{ padding: '32px' }}>
                        <h3 className="section-title" style={{ marginBottom: '16px' }}>Event Discussion Forum</h3>
                        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '20px' }}>
                            Moderate the discussion — pin important messages 📌, delete inappropriate ones 🗑, and post announcements 📢.
                        </p>
                        <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #e5e7eb' }}>
                            <Forum eventId={id} user={user} isRegistered={true} />
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Review Modal ──────────────────────────────────────────────── */}
            {reviewing && selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
                        <div className="px-6 py-4 bg-purple-600 text-white flex justify-between items-center" style={{ background: 'var(--primary-gradient)' }}>
                            <h2 className="text-xl font-bold">Review Registration</h2>
                            <button onClick={() => { setReviewing(false); setSelectedTicket(null); }} className="text-white hover:text-gray-200">
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
                                        src={selectedTicket.paymentProof}
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
