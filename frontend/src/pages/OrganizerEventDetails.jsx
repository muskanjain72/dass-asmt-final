import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import QRScanner from './QRScanner';

const OrganizerEventDetails = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [stats, setStats] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, analytics, participants, orders, scanner

    useEffect(() => {
        fetchEventData();
    }, [id]);

    const fetchEventData = async () => {
        try {
            const [eventRes, statsRes, participantsRes] = await Promise.all([
                api.get(`/events/${id}`),
                api.get(`/events/${id}/stats`),
                api.get(`/tickets/event/${id}`)
            ]);
            setEvent(eventRes.data);
            setStats(statsRes.data);
            setParticipants(participantsRes.data);
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

    const handleOrderAction = async (ticketId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this order?`)) return;
        try {
            await api.put(`/tickets/${ticketId}/${action}`);
            fetchEventData(); // Refresh list
        } catch (error) {
            alert(`Failed to ${action} order`);
        }
    };

    const downloadCSV = () => {
        if (!participants.length) return;
        const headers = ['Name', 'Email', 'Contact', 'Ticket ID', 'Status', 'Payment Status'];
        const rows = participants.map(p => [
            `${p.participantId.firstName} ${p.participantId.lastName}`,
            p.participantId.email,
            p.participantId.contactNumber || 'N/A',
            p.ticketId,
            p.status,
            p.paymentStatus
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers, ...rows].map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `participants_${event.name}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;
    if (!event) return <div className="text-center py-8">Event not found</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">{event.name}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Status: <span className="font-semibold uppercase">{event.status}</span>
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-2">
                    {event.status === 'draft' && (
                        <button onClick={() => handleStatusUpdate('published')} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700">
                            Publish Event
                        </button>
                    )}
                    {event.status === 'published' && (
                        <button onClick={() => handleStatusUpdate('closed')} className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700">
                            Close Registrations
                        </button>
                    )}
                    {/* Assuming separate Edit page or modal exists, keeping link for now */}
                    <Link to={`/organizer/edit-event/${id}`} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow hover:bg-gray-50">
                        Edit Details
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {['overview', 'analytics', 'participants'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`${activeTab === tab
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                        >
                            {tab}
                        </button>
                    ))}
                    {event.type === 'merchandise' && (
                        <button onClick={() => setActiveTab('orders')} className={`${activeTab === 'orders' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}>
                            Orders
                        </button>
                    )}
                    <button onClick={() => setActiveTab('scanner')} className={`${activeTab === 'scanner' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}>
                        Attendance / Scanner
                    </button>
                </nav>
            </div>

            {/* Tab Contents */}
            {activeTab === 'overview' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Event Information</h3>
                    </div>
                    <div className="border-t border-gray-200">
                        <dl>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Description</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{event.description}</dd>
                            </div>
                            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Dates</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {new Date(event.startDate).toLocaleString()} - {new Date(event.endDate).toLocaleString()}
                                </dd>
                            </div>
                            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                <dt className="text-sm font-medium text-gray-500">Pricing</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                    {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            )}

            {activeTab === 'analytics' && stats && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">₹{stats.revenue}</dd>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Registrations / Sales</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.registrations}</dd>
                    </div>
                </div>
            )}

            {activeTab === 'participants' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Participant List</h3>
                        <button onClick={downloadCSV} className="bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700">Export CSV</button>
                    </div>
                    <div className="border-t border-gray-200">
                        <ul className="divide-y divide-gray-200">
                            {participants.map((ticket) => (
                                <li key={ticket._id} className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-medium text-indigo-600">{ticket.participantId.firstName} {ticket.participantId.lastName}</div>
                                        <div>
                                            {ticket.status === 'attended' && <span className="mr-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Attended</span>}
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ticket.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {ticket.paymentStatus}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-500">{ticket.participantId.email}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Merchandise Orders (Pending)</h3>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {participants.filter(p => p.paymentStatus === 'pending_approval' || p.paymentStatus === 'pending').map((ticket) => (
                            <li key={ticket._id} className="px-4 py-4 sm:px-6">
                                <div className="md:flex md:justify-between">
                                    <div className="mb-4 md:mb-0">
                                        <p className="font-semibold">{ticket.participantId.firstName} {ticket.participantId.lastName}</p>
                                        <p className="text-sm text-gray-500">Ticket ID: {ticket.ticketId}</p>
                                        <p className="text-sm">Status: <span className="font-bold uppercase text-yellow-600">{ticket.paymentStatus}</span></p>
                                        {ticket.paymentProof ? (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-500 mb-1">Payment Proof:</p>
                                                <a href={`http://localhost:5000${ticket.paymentProof}`} target="_blank" rel="noopener noreferrer">
                                                    <img src={`http://localhost:5000${ticket.paymentProof}`} alt="Proof" className="h-32 w-auto object-cover border rounded" />
                                                </a>
                                            </div>
                                        ) : (
                                            <p className="mt-2 text-xs text-red-500">No proof uploaded yet.</p>
                                        )}
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <button
                                            onClick={() => handleOrderAction(ticket._id, 'approve')}
                                            disabled={!ticket.paymentProof}
                                            className={`px-4 py-2 rounded text-white text-sm ${!ticket.paymentProof ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleOrderAction(ticket._id, 'reject')}
                                            className="px-4 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {participants.filter(p => p.paymentStatus === 'pending_approval' || p.paymentStatus === 'pending').length === 0 && (
                            <li className="px-4 py-10 text-center text-gray-500">No pending orders.</li>
                        )}
                    </ul>
                </div>
            )}

            {activeTab === 'scanner' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Live Attendance</h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-green-50 p-4 rounded text-center">
                            <span className="block text-2xl font-bold text-green-600">{participants.filter(p => p.scannedAt).length}</span>
                            <span className="text-sm text-gray-600">Scanned / Present</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded text-center">
                            <span className="block text-2xl font-bold text-gray-600">{participants.length - participants.filter(p => p.scannedAt).length}</span>
                            <span className="text-sm text-gray-600">Pending</span>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        {/* Ensure onScanSuccess updates the list properly */}
                        <QRScanner onScanSuccess={() => {
                            // Wait a moment then refresh
                            setTimeout(() => fetchEventData(), 1000);
                        }} />
                    </div>
                </div>
            )}

        </div>
    );
};
export default OrganizerEventDetails;
