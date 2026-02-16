import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api/axios';

const QRScanner = ({ onScanSuccess }) => {
    const scannerRef = useRef(null);
    const [manualId, setManualId] = useState('');
    const [scanResult, setScanResult] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        // Initialize Scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(handleScan, (err) => console.log(err));

        return () => {
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
        };
    }, []);

    const verifyTicket = async (payload, type = 'qr') => {
        setProcessing(true);
        setScanResult(null);
        try {
            const body = type === 'qr' ? { qrPayload: payload } : { manualTicketId: payload };
            // Pass eventId for strict validation
            const { data } = await api.post('/tickets/scan', { ...body, eventId: onScanSuccess?.eventId });
            setScanResult({ type: 'success', ...data });
            if (onScanSuccess) onScanSuccess.callback();
        } catch (error) {
            setScanResult({
                type: 'error',
                message: error.response?.data?.message || 'Verification Failed'
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleScan = (decodedText) => {
        // Debounce or just pause? Implementation of Html5QrcodeScanner usually pauses
        // But for continuous scanning we might want to be careful not to spam API
        // For now, let's just call verify
        console.log(`Scan result: ${decodedText}`);
        // Simple throttle to avoid rapid fires on same code if library doesn't handle it
        if (!processing) {
            verifyTicket(decodedText, 'qr');
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        verifyTicket(manualId, 'manual');
    };

    return (
        <div className="max-w-md mx-auto p-4 bg-white rounded shadow text-center">
            <h3 className="text-lg font-bold mb-4">Ticket Scanner</h3>

            <div id="reader" className="w-full mb-4"></div>

            <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Or enter ID manually</p>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        placeholder="TKT-XXXX..."
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <button type="submit" className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">Verify</button>
                </form>
            </div>

            {/* Result Display */}
            {scanResult && (
                <div className={`mt-4 p-4 rounded ${scanResult.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <p className="font-bold text-lg">
                        {scanResult.type === 'success' ? '✔ Valid Ticket' : '✖ Invalid / Error'}
                    </p>
                    <p className="mt-1">{scanResult.message}</p>
                    {scanResult.participant && (
                        <div className="mt-2 text-sm text-left bg-white p-2 rounded opacity-90">
                            <p><strong>Particpant:</strong> {scanResult.participant.firstName} {scanResult.participant.lastName}</p>
                            <p><strong>Email:</strong> {scanResult.participant.email}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QRScanner;
