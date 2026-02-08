import React from 'react';

const TicketModal = ({ ticket, onClose }) => {
    if (!ticket) return null;

    const event = ticket.eventId;
    const isMerch = event?.type === 'merchandise';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
                {/* Header */}
                <div className="px-6 py-4 bg-purple-600 text-white flex justify-between items-center" style={{ background: 'var(--primary-gradient)' }}>
                    <h2 className="text-xl font-bold">Event Ticket</h2>
                    <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col items-center">
                    {/* Event Name */}
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">{event?.name || 'Event Name'}</h3>
                        <p className="text-purple-600 font-medium">{event?.organizer?.organizerName || 'Organizer'}</p>
                    </div>

                    {/* QR Code Placeholder */}
                    <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mb-6 border-2 border-dashed border-purple-200">
                        {ticket.qrCodeData ? (
                            <div className="text-center p-4">
                                {/* In a real app, use a QR component here */}
                                <div className="bg-white p-2 rounded shadow-sm inline-block">
                                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900">
                                        <rect x="3" y="3" width="7" height="7"></rect>
                                        <rect x="14" y="3" width="7" height="7"></rect>
                                        <rect x="3" y="14" width="7" height="7"></rect>
                                        <rect x="14" y="14" width="7" height="7"></rect>
                                        <path d="M7 7h.01M17 7h.01M7 17h.01"></path>
                                    </svg>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">Scan for verification</p>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm">No QR available</p>
                        )}
                    </div>

                    {/* Ticket Details */}
                    <div className="w-full space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-100 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Ticket ID</span>
                            <span className="font-mono font-bold text-gray-900">#{ticket.ticketId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Type</span>
                            <span className="font-semibold text-gray-900 capitalize">{isMerch ? 'Merchandise' : 'Normal Event'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Date</span>
                            <span className="font-semibold text-gray-900">{event?.startDate ? new Date(event.startDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Venue/Mode</span>
                            <span className="font-semibold text-gray-900">Main Campus</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex gap-4">
                    <button
                        onClick={() => window.print()}
                        className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-sm"
                    >
                        Print Ticket
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm"
                        style={{ background: 'var(--primary-gradient)' }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TicketModal;
