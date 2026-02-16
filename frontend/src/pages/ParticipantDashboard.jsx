import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import TicketModal from '../components/TicketModal';

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
                return isCancelled;
            default:
                return true;
        }
    });

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'registered': return 'badge-blue';
            case 'successful':
            case 'confirmed': return 'badge-green';
            case 'attended': return 'badge-purple';
            case 'cancelled':
            case 'rejected': return 'badge-red';
            case 'pending': return 'badge-gray';
            case 'pending_approval': return 'badge-orange';
            default: return 'badge-gray';
        }
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
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-8 bg-purple-600 rounded-full" style={{ background: 'var(--primary-gradient)' }}></div>
                    <h2 className="section-title mb-0">Upcoming Events</h2>
                </div>

                {upcomingTickets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {upcomingTickets.map(ticket => (
                            <div key={ticket._id} className="saas-card flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`badge ${ticket.eventId.type === 'normal' ? 'badge-blue' : 'badge-green'}`}>
                                            {ticket.eventId.type}
                                        </span>
                                        <span className={`badge ${getStatusBadgeClass(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{ticket.eventId.name}</h3>
                                    <p className="text-purple-600 text-sm font-medium mb-4">{ticket.eventId.organizer?.organizerName}</p>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center text-sm text-gray-500 gap-2">
                                            <span>{new Date(ticket.eventId.startDate).toLocaleDateString()} at {new Date(ticket.eventId.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500 gap-2">
                                            <span>Main Campus</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <button
                                        onClick={() => setSelectedTicket(ticket)}
                                        className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors"
                                    >
                                        View Ticket
                                    </button>
                                </div>
                            </div>
                        ))}
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
                                            <span className={`badge ${getStatusBadgeClass(ticket.paymentStatus === 'pending_approval' || ticket.paymentStatus === 'rejected' ? ticket.paymentStatus : ticket.status)}`}>
                                                {(ticket.paymentStatus === 'pending_approval' || ticket.paymentStatus === 'rejected' ? ticket.paymentStatus : ticket.status).replace('_', ' ')}
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
