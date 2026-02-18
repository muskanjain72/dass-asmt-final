import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import TicketModal from '../components/TicketModal';
import { downloadICS } from '../utils/calendar';
import QRCode from 'qrcode';

// ─── Download Ticket as PNG ────────────────────────────────────────────────────
const downloadTicketPNG = async (ticket) => {
    const event = ticket.eventId;
    const canvas = document.createElement('canvas');
    const W = 700, H = 420;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // ── Background ──────────────────────────────────────────────────────────────
    ctx.fillStyle = '#f5f3ff';
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 20);
    ctx.fill();

    // ── Purple header strip ──────────────────────────────────────────────────────
    ctx.fillStyle = '#6d28d9';
    ctx.beginPath();
    ctx.roundRect(0, 0, W, 90, [20, 20, 0, 0]);
    ctx.fill();

    // ── Subtle gradient overlay on header ───────────────────────────────────────
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'rgba(109,40,217,0)');
    grad.addColorStop(1, 'rgba(124,58,237,0.6)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, 90, [20, 20, 0, 0]);
    ctx.fill();

    // ── Header text ─────────────────────────────────────────────────────────────
    ctx.fillStyle = 'white';
    ctx.font = 'bold 26px Arial';
    ctx.fillText(event?.name || 'Event Ticket', 28, 42);
    ctx.font = '13px Arial';
    ctx.fillStyle = '#e9d5ff';
    ctx.fillText(event?.organizer?.organizerName || '', 28, 66);

    // ── Ticket ID badge ──────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(W - 200, 20, 172, 50, 10);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('TICKET ID', W - 188, 40);
    ctx.font = 'bold 12px monospace';
    ctx.fillText(ticket.ticketId, W - 188, 58);

    // ── Dashed perforation line ──────────────────────────────────────────────────
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#c4b5fd';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(28, 110);
    ctx.lineTo(W - 28, 110);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Left notch circles ───────────────────────────────────────────────────────
    ctx.fillStyle = '#f5f3ff';
    ctx.beginPath(); ctx.arc(0, 110, 16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W, 110, 16, 0, Math.PI * 2); ctx.fill();

    // ── Details section ──────────────────────────────────────────────────────────
    const labelStyle = () => { ctx.fillStyle = '#9ca3af'; ctx.font = 'bold 10px Arial'; };
    const valueStyle = () => { ctx.fillStyle = '#111827'; ctx.font = 'bold 14px Arial'; };

    const fields = [
        ['STATUS', ticket.status === 'Approved' ? '✓ Approved' : ticket.status],
        ['DATE', event?.startDate ? new Date(event.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'],
        ['QUANTITY', String(ticket.purchaseData?.quantity || 1)],
        ticket.purchaseData?.variant ? ['VARIANT', ticket.purchaseData.variant] : null,
        ['AMOUNT', `₹${event?.registrationFee || 0}`],
    ].filter(Boolean);

    let y = 148;
    fields.forEach(([label, value]) => {
        labelStyle();
        ctx.fillText(label, 36, y);
        valueStyle();
        ctx.fillText(value, 36, y + 18);
        y += 52;
    });

    // ── QR Code ──────────────────────────────────────────────────────────────────
    try {
        const qrDataUrl = await QRCode.toDataURL(ticket.ticketId, { width: 200, margin: 1, color: { dark: '#1a1a2e', light: '#ffffff' } });
        const img = new Image();
        img.src = qrDataUrl;
        await new Promise(r => { img.onload = r; });

        // QR background card
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.roundRect(W - 240, 120, 212, 260, 16);
        ctx.fill();
        ctx.strokeStyle = '#e9d5ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(W - 240, 120, 212, 260, 16);
        ctx.stroke();

        ctx.drawImage(img, W - 226, 134, 184, 184);

        ctx.fillStyle = '#6d28d9';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SCAN AT PICKUP', W - 134, 338);
        ctx.textAlign = 'left';
    } catch (_) { }

    // ── Footer ───────────────────────────────────────────────────────────────────
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px Arial';
    ctx.fillText('This ticket is non-transferable. Present this QR code at the event.', 36, H - 20);

    // ── Download ─────────────────────────────────────────────────────────────────
    const link = document.createElement('a');
    link.download = `ticket-${ticket.ticketId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
};


// ─── Payment Proof Uploader ────────────────────────────────────────────────────
const PaymentProofUploader = ({ ticket, onUploaded }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [done, setDone] = useState(false);
    const inputRef = useRef();

    const handleFile = (f) => {
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('paymentProof', file);
            await api.post(`/tickets/${ticket._id}/payment-proof`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setDone(true);
            onUploaded();
        } catch (e) {
            alert(e.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    if (done) {
        return (
            <div style={{ background: '#ecfdf5', border: '1.5px solid #6ee7b7', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem' }}>✅</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065f46' }}>Proof submitted! Awaiting organizer review.</span>
            </div>
        );
    }

    return (
        <div style={{ background: '#faf5ff', border: '1.5px dashed #c4b5fd', borderRadius: '12px', padding: '14px' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>Upload Payment Proof</p>
            {preview ? (
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <img src={preview} alt="preview" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e9d5ff' }} />
                    <button onClick={() => { setFile(null); setPreview(null); }} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', color: 'white', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                </div>
            ) : (
                <div onClick={() => inputRef.current?.click()} style={{ border: '2px dashed #c4b5fd', borderRadius: '8px', padding: '16px', textAlign: 'center', cursor: 'pointer', background: 'white', marginBottom: '10px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>📎 Click to select screenshot</p>
                </div>
            )}
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            <div style={{ display: 'flex', gap: '8px' }}>
                {!preview && <button onClick={() => inputRef.current?.click()} style={{ flex: 1, padding: '8px', background: '#f5f3ff', border: '1.5px solid #c4b5fd', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, color: '#6d28d9', cursor: 'pointer' }}>Choose File</button>}
                {preview && (
                    <button onClick={handleUpload} disabled={uploading} style={{ flex: 1, padding: '8px', background: 'linear-gradient(135deg,#6d28d9,#7c3aed)', border: 'none', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, color: 'white', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
                        {uploading ? 'Uploading...' : '⬆ Submit Proof'}
                    </button>
                )}
            </div>
        </div>
    );
};

const ParticipantDashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Normal'); // Tabs: Normal, Merchandise, Completed, Cancelled
    const [selectedTicket, setSelectedTicket] = useState(null);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const { data } = await api.get('/tickets/my-tickets');
                setTickets(data);
            } catch (error) {
                console.error("Error fetching tickets", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    const now = new Date();

    // Upcoming Events: Not cancelled, and event is in the future
    const upcomingTickets = tickets.filter(t => {
        const event = t.eventId;
        if (!event || t.status === 'cancelled') return false;
        return new Date(event.endDate || event.startDate) >= now;
    });

    // History: Filtered by active tab
    const historyTickets = tickets.filter(t => {
        const event = t.eventId;
        if (!event) return false;

        const eventDate = new Date(event.endDate || event.startDate);
        const isCancelled = t.status === 'cancelled' || t.paymentStatus === 'rejected';
        const isCompleted = eventDate < now && !isCancelled;

        switch (activeTab) {
            case 'All':
                return true;
            case 'Normal':
                return event.type === 'normal' && !isCancelled && !isCompleted;
            case 'Merchandise':
                return event.type === 'merchandise' && !isCancelled;
            case 'Completed':
                return isCompleted;
            case 'Cancelled/Rejected':
                return isCancelled || t.status?.toLowerCase() === 'rejected' || t.paymentStatus === 'rejected';
            default:
                return true;
        }
    });

    const getStatusBadgeClass = (ticket) => {
        const s = ticket.status?.toLowerCase();
        const p = ticket.paymentStatus?.toLowerCase();
        if (s === 'approved' || s === 'successful' || s === 'registered' || p === 'completed') return 'badge-green';
        if (s === 'attended') return 'badge-purple';
        if (s === 'cancelled' || s === 'rejected' || p === 'rejected') return 'badge-red';
        if (s === 'pending_payment' && p === 'pending_approval') return 'badge-orange';
        if (s === 'pending_payment' || s === 'pending') return 'badge-orange';
        return 'badge-gray';
    };

    const getStatusLabel = (ticket) => {
        const s = ticket.status;
        const p = ticket.paymentStatus;
        if (s === 'Approved' || p === 'completed') return '✓ Approved';
        if (s === 'pending_payment' && p === 'pending_approval') return '⏳ Proof Submitted';
        if (s === 'pending_payment') return '📤 Upload Proof';
        if (s === 'pending') return '⏳ Pending Review';
        if (s === 'Rejected' || p === 'rejected') return '✕ Rejected';
        if (s === 'attended') return '✓ Attended';
        if (s === 'cancelled') return 'Cancelled';
        return s?.replace('_', ' ') || 'Unknown';
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div style={{ visibility: 'hidden', height: 0 }}>Dashboard</div>
                <Link to="/events" className="btn btn-primary" style={{ background: 'var(--primary-gradient)' }}>
                    Browse More Events
                </Link>
            </div>

            {/* Upcoming Events Section */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-8 bg-purple-600 rounded-full" style={{ background: 'var(--primary-gradient)' }}></div>
                        <h2 className="section-title mb-0">Upcoming Events</h2>
                    </div>
                    {upcomingTickets.length > 0 && (
                        <button
                            onClick={() => downloadICS(upcomingTickets.map(t => t.eventId))}
                            className="text-sm font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-all"
                        >
                            📅 Export All
                        </button>
                    )}
                </div>

                {upcomingTickets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingTickets.map(ticket => {
                            const isMerch = ticket.eventId?.type === 'merchandise';
                            const isApproved = ticket.status === 'Approved' || ticket.paymentStatus === 'completed';
                            const needsProof = isMerch && ticket.paymentStatus === 'pending' && ticket.status === 'pending_payment';
                            const proofSubmitted = isMerch && ticket.paymentStatus === 'pending_approval';
                            const isRejected = ticket.status === 'Rejected' || ticket.paymentStatus === 'rejected';

                            return (
                                <div key={ticket._id} className="saas-card flex flex-col justify-between" style={{ gap: '12px' }}>
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`badge ${isMerch ? 'badge-green' : 'badge-blue'}`}>
                                                {isMerch ? '🛍 Merch' : '🎟 Event'}
                                            </span>
                                            <span className={`badge ${getStatusBadgeClass(ticket)}`}>
                                                {getStatusLabel(ticket)}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">{ticket.eventId.name}</h3>
                                        <p className="text-purple-600 text-sm font-medium mb-4">{ticket.eventId.organizer?.organizerName}</p>

                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center text-sm text-gray-500 gap-2">
                                                <span>{new Date(ticket.eventId.startDate).toLocaleDateString()} at {new Date(ticket.eventId.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>

                                        {/* Merch: upload proof if needed */}
                                        {needsProof && (
                                            <PaymentProofUploader ticket={ticket} onUploaded={() => {
                                                setTickets(prev => prev.map(t => t._id === ticket._id ? { ...t, paymentStatus: 'pending_approval', status: 'pending_payment' } : t));
                                            }} />
                                        )}

                                        {/* Merch: proof submitted, awaiting review */}
                                        {proofSubmitted && (
                                            <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: '12px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>⏳</span>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400e' }}>Proof submitted — awaiting organizer review</span>
                                            </div>
                                        )}

                                        {/* Merch: rejected */}
                                        {isRejected && (
                                            <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '12px', padding: '10px 14px' }}>
                                                <p style={{ fontSize: '0.78rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>✕ Payment rejected — contact organizer</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                                        <button
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors"
                                        >
                                            View Ticket
                                        </button>
                                        {/* Download ticket for approved merch orders */}
                                        {isMerch && isApproved && (
                                            <button
                                                onClick={() => downloadTicketPNG(ticket)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 800, color: '#6d28d9', background: '#f5f3ff', border: '1.5px solid #c4b5fd', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}
                                            >
                                                ⬇ Download Ticket
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="saas-card text-center py-12">
                        <p className="text-gray-500">No upcoming events found. Time to explore!</p>
                        <Link to="/events" className="text-purple-600 font-bold mt-2 inline-block">Browse Events &rarr;</Link>
                    </div>
                )}
            </section>

            {/* Participation History Section */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-8 bg-purple-600 rounded-full" style={{ background: 'var(--primary-gradient)' }}></div>
                    <h2 className="section-title mb-0">Participation History</h2>
                </div>

                <div className="saas-card overflow-hidden !p-0">
                    <div className="border-b border-gray-100 px-6 pt-4 flex gap-8 overflow-x-auto scroller-hide">
                        {['All', 'Normal', 'Merchandise', 'Completed', 'Cancelled/Rejected'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 px-2 text-sm font-semibold transition-all relative ${activeTab === tab ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full"></span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="saas-table-container !border-none">
                        <table className="saas-table">
                            <thead>
                                <tr>
                                    <th>Event Name</th>
                                    <th>Event Type</th>
                                    <th>Organizer</th>
                                    <th>Participation Status</th>
                                    <th>Team Name</th>
                                    <th>Ticket ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyTickets.map(ticket => (
                                    <tr key={ticket._id}>
                                        <td className="font-semibold text-gray-900">{ticket.eventId?.name}</td>
                                        <td>
                                            <span className={`badge ${ticket.eventId?.type === 'normal' ? 'badge-blue' : 'badge-green'}`}>
                                                {ticket.eventId?.type}
                                            </span>
                                        </td>
                                        <td className="text-gray-600">{ticket.eventId?.organizer?.organizerName}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(ticket)}`}>
                                                {getStatusLabel(ticket)}
                                            </span>
                                        </td>
                                        <td className="text-gray-500">{ticket.responses?.teamName || '-'}</td>
                                        <td>
                                            <button
                                                onClick={() => setSelectedTicket(ticket)}
                                                className="text-purple-600 font-bold hover:underline"
                                            >
                                                #{ticket.ticketId}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {historyTickets.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12 text-gray-500">
                                            No records found for this category.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Ticket Modal */}
            {selectedTicket && (
                <TicketModal
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                />
            )}
        </div>
    );
};

export default ParticipantDashboard;
