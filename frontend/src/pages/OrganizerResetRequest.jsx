import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const OrganizerResetRequest = () => {
    const [mode, setMode] = useState('request'); // 'request' or 'status'
    const [formData, setFormData] = useState({
        email: '',
        organizerName: '',
        reason: ''
    });
    const [statusEmail, setStatusEmail] = useState('');
    const [history, setHistory] = useState([]);
    const [searching, setSearching] = useState(false);
    const [status, setStatus] = useState({ type: '', msg: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/reset-request', formData);
            setStatus({ type: 'success', msg: 'Reset request submitted. Admin will review and contact you.' });
            setFormData({ email: '', organizerName: '', reason: '' });
        } catch (error) {
            setStatus({ type: 'error', msg: error.response?.data?.message || 'Submission failed' });
        }
    };

    const checkStatus = async (e) => {
        e.preventDefault();
        setSearching(true);
        try {
            const { data } = await api.get(`/auth/reset-status/${statusEmail}`);
            setHistory(data);
            if (data.length === 0) setStatus({ type: 'error', msg: 'No requests found for this email' });
            else setStatus({ type: '', msg: '' });
        } catch (error) {
            setStatus({ type: 'error', msg: 'Failed to fetch status' });
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
            <div className="w-full max-w-lg">
                <header className="text-center mb-10">
                    <h1 className="dashboard-title">Account Recovery</h1>
                    <p className="dashboard-subtitle">Request a password reset or track your request status</p>
                </header>

                <div className="saas-card !p-0 overflow-hidden">
                    {/* Minimal Tabs */}
                    <div className="border-b border-gray-100 px-8 pt-4 flex gap-8">
                        {['request', 'status'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setMode(tab); setStatus({ type: '', msg: '' }); }}
                                className={`pb-4 text-sm font-bold transition-all relative ${mode === tab ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {tab === 'request' ? 'New Request' : 'Track Status'}
                                {mode === tab && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600"></span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-8">
                        {status.msg && mode === 'request' && (
                            <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                {status.msg}
                            </div>
                        )}

                        {mode === 'request' ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Registered Email</label>
                                    <input
                                        className="input" type="email" required placeholder="Enter your login or contact email"
                                        value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Organizer / Club Name</label>
                                    <input
                                        className="input" type="text" required placeholder="e.g. Photography Club"
                                        value={formData.organizerName} onChange={e => setFormData({ ...formData, organizerName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Reason for recovery</label>
                                    <textarea
                                        className="input min-h-[100px]" required placeholder="Please provide details to help admin verify your identity"
                                        value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    />
                                </div>
                                <button type="submit" className="btn-primary btn-block py-4">
                                    Submit Recovery Request
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-8">
                                <form onSubmit={checkStatus} className="flex gap-3">
                                    <input
                                        className="input flex-1" type="email" required placeholder="Enter your email to track"
                                        value={statusEmail} onChange={e => setStatusEmail(e.target.value)}
                                    />
                                    <button type="submit" disabled={searching} className="btn-primary px-8">
                                        {searching ? '...' : 'Find'}
                                    </button>
                                </form>

                                {status.msg && mode === 'status' && (
                                    <p className="text-center text-sm font-medium text-red-500">{status.msg}</p>
                                )}

                                <div className="space-y-4">
                                    {history.map((req) => (
                                        <div key={req._id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className={`badge ${req.status === 'approved' ? 'badge-green' : req.status === 'rejected' ? 'badge-red' : 'badge-blue'} !text-[10px]`}>
                                                    {req.status}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                                    {new Date(req.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-800 leading-relaxed mb-3">{req.reason}</p>
                                            {req.adminResponse && (
                                                <div className="p-3 rounded-xl bg-white border border-purple-100">
                                                    <p className="text-[10px] font-black text-purple-600 uppercase mb-1">Admin Response</p>
                                                    <p className="text-xs text-gray-600 italic">"{req.adminResponse}"</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {history.length === 0 && !searching && !status.msg && (
                                        <div className="py-12 text-center">
                                            <p className="text-sm text-gray-400 font-medium">Enter your email above to see the status of your requests.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-10 pt-6 border-t border-gray-50 text-center">
                            <Link to="/login" className="text-sm font-black text-purple-600 hover:text-purple-700 uppercase tracking-widest">
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizerResetRequest;
