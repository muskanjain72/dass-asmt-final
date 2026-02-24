import React, { useState } from 'react';
import api from '../api/axios';
import AddToCalendarButton from './AddToCalendarButton';

const TicketModal = ({ ticket, onClose }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    if (!ticket) return null;

    const event = ticket.eventId;
    const isMerch = event?.type === 'merchandise';
    const showUpload = ticket.paymentStatus === 'pending' || ticket.paymentStatus === 'rejected';
    const isPendingApproval = ticket.status === 'pending';

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a file first");
            return;
        }

        const formData = new FormData();
        formData.append('paymentProof', file);

        try {
            setUploading(true);
            await api.post(`/tickets/${ticket._id}/payment-proof`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Payment proof uploaded successfully! Awaiting approval.');
            window.location.reload(); // Simple refresh to show updated status
        } catch (error) {
            console.error(error);
            alert('Failed to upload proof.');
        } finally {
            setUploading(false);
        }
    };

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

                    {/* QR Code / Payment Status */}
                    <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mb-6 border-2 border-dashed border-purple-200 relative overflow-hidden">
                        {ticket.qrCodeData ? (
                            <div className="text-center p-4">
                                <div className="bg-white p-2 rounded shadow-sm inline-block">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(ticket.qrCodeData)}`}
                                        alt="Ticket QR Code"
                                        className="w-32 h-32"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">Scan for verification</p>
                            </div>
                        ) : (
                            <div className="text-center p-4 w-full">
                                {isPendingApproval ? (
                                    <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '1.5px solid #fcd34d' }}>
                                        <p style={{ fontWeight: 800, color: '#92400e', margin: '0 0 4px', fontSize: '0.9rem' }}>⏳ Pending Approval</p>
                                        <p style={{ fontSize: '0.78rem', color: '#b45309', margin: 0 }}>Your registration is being reviewed by the organizer.</p>
                                    </div>
                                ) : showUpload ? (
                                    <div className="space-y-2">
                                        <p className="font-bold text-gray-700">Payment Required</p>
                                        <p className="text-xs text-red-500 mb-2">{ticket.paymentStatus === 'rejected' ? 'Previous proof rejected.' : 'Upload screenshot of payment.'}</p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setFile(e.target.files[0])}
                                            className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                        />
                                        {file && (
                                            <button
                                                onClick={handleUpload}
                                                disabled={uploading}
                                                className="w-full bg-purple-600 text-white text-xs py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                            >
                                                {uploading ? 'Uploading...' : 'Upload Proof'}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-sm">No QR available</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Ticket Details */}
                    <div className="w-full space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-100 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Participant</span>
                            <span className="font-bold text-gray-900">{ticket.participantId?.firstName} {ticket.participantId?.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Email</span>
                            <span className="text-gray-900">{ticket.participantId?.email}</span>
                        </div>
                        <div className="border-t border-gray-200 my-2"></div>
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
                            <span className="text-gray-500">Cost/Fee</span>
                            <span className="font-semibold text-green-600">
                                {event?.registrationFee ? `₹${event.registrationFee}` : 'Free'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-4">
                    <div className="flex gap-4 items-center">
                        {/* Only show Print Ticket for approved/registered/attended tickets */}
                        {['Approved', 'Successful', 'registered', 'attended'].includes(ticket.status) && (
                            <button
                                onClick={() => {
                                    const printWindow = window.open('', '_blank', 'width=500,height=700');
                                    printWindow.document.write(`
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <title>Ticket - ${event?.name || 'Event'}</title>
                                            <style>
                                                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f9fafb; }
                                                .ticket { max-width: 420px; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
                                                .header { background: linear-gradient(135deg, #6d28d9, #7c3aed); padding: 24px; text-align: center; color: white; }
                                                .header h2 { margin: 0; font-size: 1.3rem; }
                                                .header p { margin: 6px 0 0; font-size: 0.85rem; opacity: 0.85; }
                                                .body { background: white; padding: 24px; }
                                                .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 0.9rem; }
                                                .row:last-child { border-bottom: none; }
                                                .label { color: #9ca3af; font-weight: bold; text-transform: uppercase; font-size: 0.75rem; }
                                                .value { color: #111827; font-weight: 600; }
                                                .qr-section { text-align: center; padding: 20px; background: #f5f3ff; border-radius: 12px; margin-top: 16px; border: 2px dashed #c4b5fd; }
                                                .qr-section p { color: #6d28d9; font-weight: bold; font-size: 0.8rem; margin: 0 0 12px; }
                                                .qr-section img { width: 180px; height: 180px; }
                                                .footer { text-align: center; padding: 12px; font-size: 0.7rem; color: #9ca3af; }
                                                @media print { body { background: white; } .ticket { box-shadow: none; } }
                                            </style>
                                        </head>
                                        <body>
                                            <div class="ticket">
                                                <div class="header">
                                                    <h2>${event?.name || 'Event Ticket'}</h2>
                                                    <p>${event?.organizer?.organizerName || ''}</p>
                                                </div>
                                                <div class="body">
                                                    <div class="row"><span class="label">Ticket ID</span><span class="value" style="font-family:monospace">#${ticket.ticketId}</span></div>
                                                    <div class="row"><span class="label">Type</span><span class="value">${isMerch ? 'Merchandise' : 'Normal Event'}</span></div>
                                                    <div class="row"><span class="label">Date</span><span class="value">${event?.startDate ? new Date(event.startDate).toLocaleDateString() : 'N/A'}</span></div>
                                                    <div class="row"><span class="label">Fee</span><span class="value" style="color:#059669">${event?.registrationFee ? '₹' + event.registrationFee : 'Free'}</span></div>
                                                    <div class="row"><span class="label">Status</span><span class="value" style="color:#059669">✓ ${ticket.status}</span></div>
                                                    ${ticket.qrCodeData ? `
                                                    <div class="qr-section">
                                                        <p>SCAN FOR VERIFICATION</p>
                                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticket.qrCodeData)}" alt="QR Code" />
                                                        <p style="font-size:0.7rem;color:#9ca3af;margin:12px 0 0">${ticket.ticketId}</p>
                                                    </div>` : ''}
                                                </div>
                                                <div class="footer">Present this ticket at the event • Non-transferable</div>
                                            </div>
                                        </body>
                                        </html>
                                    `);
                                    printWindow.document.close();
                                    printWindow.onload = () => {
                                        printWindow.print();
                                    };
                                }}
                                className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-sm"
                            >
                                Print Ticket
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm"
                            style={{ background: 'var(--primary-gradient)' }}
                        >
                            Close
                        </button>
                        <AddToCalendarButton event={event} compact />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketModal;
