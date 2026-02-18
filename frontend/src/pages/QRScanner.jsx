import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api/axios';

const QRScanner = ({ onScanSuccess }) => {
    const [manualId, setManualId] = useState('');
    const [scanResult, setScanResult] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [scanLog, setScanLog] = useState([]); // last 5 scans
    const [scannerReady, setScannerReady] = useState(false);
    const scannerRef = useRef(null);
    const processingRef = useRef(false);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            'qr-reader',
            { fps: 10, qrbox: { width: 220, height: 220 }, rememberLastUsedCamera: true },
            false
        );

        scanner.render(
            (decodedText) => {
                if (!processingRef.current) {
                    verifyTicket(decodedText, 'qr');
                }
            },
            () => { }
        );

        scannerRef.current = scanner;
        setScannerReady(true);

        return () => {
            scanner.clear().catch(() => { });
        };
    }, []);

    const verifyTicket = async (payload, type = 'qr') => {
        processingRef.current = true;
        setProcessing(true);
        setScanResult(null);

        try {
            const body = type === 'qr' ? { qrPayload: payload } : { manualTicketId: payload };
            const { data } = await api.post('/tickets/scan', {
                ...body,
                eventId: onScanSuccess?.eventId
            });

            const entry = {
                id: Date.now(),
                type: 'success',
                name: data.participant ? `${data.participant.firstName} ${data.participant.lastName}` : 'Unknown',
                message: data.message,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                ticketId: payload.slice(0, 12)
            };

            setScanResult({ type: 'success', ...data });
            setScanLog(prev => [entry, ...prev].slice(0, 8));
            if (onScanSuccess?.callback) onScanSuccess.callback();
        } catch (error) {
            const entry = {
                id: Date.now(),
                type: 'error',
                name: error.response?.data?.participant
                    ? `${error.response.data.participant.firstName} ${error.response.data.participant.lastName}`
                    : 'Unknown',
                message: error.response?.data?.message || 'Verification Failed',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                ticketId: payload.slice(0, 12)
            };

            setScanResult({
                type: 'error',
                message: error.response?.data?.message || 'Verification Failed',
                scannedAt: error.response?.data?.scannedAt,
                participant: error.response?.data?.participant
            });
            setScanLog(prev => [entry, ...prev].slice(0, 8));
        } finally {
            setProcessing(false);
            // Allow next scan after 2.5s
            setTimeout(() => { processingRef.current = false; }, 2500);
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualId.trim()) return;
        verifyTicket(manualId.trim(), 'manual');
        setManualId('');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Scanner Card */}
            <div style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                borderRadius: '20px',
                padding: '24px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(167,139,250,0.2)', borderRadius: '10px', padding: '8px' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#a78bfa" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>QR Code Scanner</h4>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#a78bfa' }}>Point camera at participant's QR code</p>
                    </div>
                    {processing && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(167,139,250,0.2)', borderRadius: '20px', padding: '4px 12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa', animation: 'pulse 1s infinite' }} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a78bfa' }}>SCANNING</span>
                        </div>
                    )}
                </div>

                {/* Camera View */}
                <div style={{
                    background: '#0f0e1a',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '2px solid rgba(167,139,250,0.3)',
                    position: 'relative'
                }}>
                    <div id="qr-reader" style={{ width: '100%' }} />
                    {/* Corner brackets overlay */}
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                        <div style={{ position: 'absolute', top: '20px', left: '20px', width: '30px', height: '30px', borderTop: '3px solid #a78bfa', borderLeft: '3px solid #a78bfa', borderRadius: '4px 0 0 0' }} />
                        <div style={{ position: 'absolute', top: '20px', right: '20px', width: '30px', height: '30px', borderTop: '3px solid #a78bfa', borderRight: '3px solid #a78bfa', borderRadius: '0 4px 0 0' }} />
                        <div style={{ position: 'absolute', bottom: '20px', left: '20px', width: '30px', height: '30px', borderBottom: '3px solid #a78bfa', borderLeft: '3px solid #a78bfa', borderRadius: '0 0 0 4px' }} />
                        <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '30px', height: '30px', borderBottom: '3px solid #a78bfa', borderRight: '3px solid #a78bfa', borderRadius: '0 0 4px 0' }} />
                    </div>
                </div>

                {/* Scan Result */}
                {scanResult && (
                    <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        borderRadius: '14px',
                        background: scanResult.type === 'success'
                            ? 'rgba(16,185,129,0.15)'
                            : 'rgba(239,68,68,0.15)',
                        border: `1.5px solid ${scanResult.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                        animation: 'fadeIn 0.3s ease'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: scanResult.participant ? '10px' : 0 }}>
                            <span style={{ fontSize: '1.5rem' }}>
                                {scanResult.type === 'success' ? '✅' : '❌'}
                            </span>
                            <div>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: scanResult.type === 'success' ? '#6ee7b7' : '#fca5a5' }}>
                                    {scanResult.type === 'success' ? 'Verified Successfully!' : 'Verification Failed'}
                                </p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{scanResult.message}</p>
                            </div>
                        </div>
                        {scanResult.participant && (
                            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.8rem' }}>
                                <p style={{ margin: '0 0 4px', fontWeight: 700 }}>
                                    👤 {scanResult.participant.firstName} {scanResult.participant.lastName}
                                </p>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>{scanResult.participant.email}</p>
                                {scanResult.scannedAt && (
                                    <p style={{ margin: '4px 0 0', color: '#fbbf24', fontSize: '0.72rem', fontWeight: 700 }}>
                                        ⚠ Already scanned at {new Date(scanResult.scannedAt).toLocaleTimeString()}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Manual Entry */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1.5px solid #e5e7eb' }}>
                <p style={{ margin: '0 0 12px', fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Manual Override
                </p>
                <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        placeholder="Enter Ticket ID (TKT-XXXX...)"
                        style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1.5px solid #e5e7eb',
                            fontSize: '0.85rem',
                            fontFamily: 'monospace',
                            outline: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!manualId.trim() || processing}
                        style={{
                            padding: '10px 18px',
                            background: 'linear-gradient(135deg,#6d28d9,#7c3aed)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            cursor: processing ? 'not-allowed' : 'pointer',
                            opacity: processing ? 0.7 : 1
                        }}
                    >
                        Verify
                    </button>
                </form>
                <p style={{ margin: '8px 0 0', fontSize: '0.7rem', color: '#9ca3af' }}>
                    Use this for participants whose QR code cannot be scanned
                </p>
            </div>

            {/* Scan History Log */}
            {scanLog.length > 0 && (
                <div style={{ background: 'white', borderRadius: '16px', border: '1.5px solid #e5e7eb', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Recent Scans
                        </p>
                        <button
                            onClick={() => setScanLog([])}
                            style={{ background: 'none', border: 'none', fontSize: '0.7rem', color: '#9ca3af', cursor: 'pointer', fontWeight: 700 }}
                        >
                            Clear
                        </button>
                    </div>
                    <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {scanLog.map(entry => (
                            <div key={entry.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 20px',
                                borderBottom: '1px solid #f9fafb',
                                background: entry.type === 'success' ? '#f0fdf4' : '#fef2f2'
                            }}>
                                <span style={{ fontSize: '1rem' }}>{entry.type === 'success' ? '✅' : '❌'}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {entry.name}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#6b7280' }}>{entry.message}</p>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>{entry.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRScanner;
