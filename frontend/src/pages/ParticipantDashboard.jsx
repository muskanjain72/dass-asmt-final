import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import AddToCalendarButton from '../components/AddToCalendarButton';
import { downloadICS } from '../utils/calendar';

const ParticipantDashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, history (normal), merch, completed, cancelled

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

    // Helper to categorize
    const getFilteredTickets = () => {
        const now = new Date();
        return tickets.filter(ticket => {
            const event = ticket.eventId;
            if (!event) return false;

            const eventDate = new Date(event.endDate || event.startDate);
            const isCancelled = ticket.status === 'cancelled';
            const isCompleted = !isCancelled && eventDate < now;
            const isUpcoming = !isCancelled && eventDate >= now;

            switch (activeTab) {
                case 'upcoming':
                    return isUpcoming && event.type === 'normal';
                case 'merch':
                    // Merch History or Orders
                    return event.type === 'merchandise' && !isCancelled;
                case 'completed':
                    return isCompleted && event.type === 'normal'; // Completed events
                case 'cancelled':
                    return isCancelled;
                default:
                    return true;
            }
        });
    };

    const handleUploadProof = async (ticketId, file) => {
        if (!file) return;
        const formData = new FormData();
        formData.append('proof', file);
        try {
            await api.post(`/tickets/${ticketId}/payment-proof`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Proof uploaded successfully");
            // Refresh logic - ideally update local state
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("Upload failed");
        }
    };

    const filteredTickets = getFilteredTickets();

    const handleBatchExport = () => {
        // Export all UPCOMING events across all tickets (ignoring merch usually for calendar)
        const eventsToExport = tickets
            .filter(t => t.eventId && t.eventId.type === 'normal' && t.status !== 'cancelled')
            .map(t => t.eventId);

        if (eventsToExport.length === 0) {
            alert("No events to export.");
            return;
        }
        downloadICS(eventsToExport);
    };

    const TabButton = ({ id, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`${activeTab === id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
        >
            {label}
        </button>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
                <button
                    onClick={handleBatchExport}
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50 text-sm"
                >
                    📆 Export All to Calendar
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6 overflow-x-auto">
                <nav className="-mb-px flex space-x-8">
                    <TabButton id="upcoming" label="Upcoming Events" />
                    <TabButton id="merch" label="Merchandise" />
                    <TabButton id="completed" label="Completed Events" />
                    <TabButton id="cancelled" label="Cancelled/Rejected" />
                </nav>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTickets.map((ticket) => (
                        <div key={ticket._id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 flex flex-col">
                            <div className="px-4 py-5 sm:p-6 flex-1">
                                <div className="flex justify-between items-start">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ticket.eventId?.type === 'normal' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {ticket.eventId?.type === 'normal' ? 'Event' : 'Merch'}
                                    </span>
                                    <span className="text-gray-400 text-xs">#{ticket.ticketId.substring(0, 8)}...</span>
                                </div>

                                <h3 className="mt-3 text-lg font-medium text-gray-900">{ticket.eventId?.name}</h3>
                                <p className="text-sm text-indigo-600 mb-2">{ticket.eventId?.organizer?.organizerName}</p>

                                <dl className="mt-2 text-sm text-gray-500 space-y-1">
                                    <div className="flex justify-between">
                                        <dt>Status:</dt>
                                        <dd className="font-medium capitalize">{ticket.status}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt>Date:</dt>
                                        <dd>{ticket.eventId?.startDate ? new Date(ticket.eventId.startDate).toLocaleDateString() : 'N/A'}</dd>
                                    </div>
                                    {ticket.qrCodeData && (
                                        <div className="mt-3 p-2 bg-gray-50 rounded text-center border text-xs">
                                            <p className="mb-1 font-semibold">Unique Ticket ID</p>
                                            <code className="text-gray-800 break-all">{ticket.ticketId}</code>
                                            <div className="mt-1 text-gray-400 italic">(QR Code)</div>
                                        </div>
                                    )}
                                    {/* Payment Upload for Pending Merch */}
                                    {ticket.eventId?.type === 'merchandise' && ticket.paymentStatus === 'pending' && (
                                        <div className="mt-3">
                                            <p className="text-xs text-red-600 mb-1">Payment Proof Required</p>
                                            <input
                                                type="file"
                                                className="text-xs w-full bg-gray-50 rounded border p-1"
                                                onChange={(e) => handleUploadProof(ticket._id, e.target.files[0])}
                                            />
                                        </div>
                                    )}
                                    {ticket.paymentStatus === 'pending_approval' && (
                                        <div className="mt-3 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                                            Payment Proof Uploaded. Pending Approval.
                                        </div>
                                    )}
                                    {ticket.paymentStatus === 'rejected' && (
                                        <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded">
                                            Order Rejected. Contact Organizer.
                                        </div>
                                    )}
                                </dl>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center">
                                <Link
                                    to={`/events/${ticket.eventId?._id}`}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    View Event Details
                                </Link>
                                {(activeTab === 'upcoming' || activeTab === 'completed') && (
                                    <AddToCalendarButton event={ticket.eventId} className="ml-2" />
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredTickets.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-10">
                            No records found in this category.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ParticipantDashboard;
