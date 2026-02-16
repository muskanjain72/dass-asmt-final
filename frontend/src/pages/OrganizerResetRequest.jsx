import { useState } from 'react';
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

    const getStatusBadge = (s) => {
        switch (s) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Organizer Account Recovery
                </h2>
                <div className="mt-4 flex justify-center gap-4">
                    <button
                        onClick={() => { setMode('request'); setStatus({ type: '', msg: '' }); }}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${mode === 'request' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        New Request
                    </button>
                    <button
                        onClick={() => { setMode('status'); setStatus({ type: '', msg: '' }); }}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${mode === 'status' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Track Status
                    </button>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {status.msg && mode === 'request' && (
                        <div className={`mb-4 p-2 rounded text-sm ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {status.msg}
                        </div>
                    )}

                    {mode === 'request' ? (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Account Email</label>
                                <input
                                    type="email"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Organizer / Club Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.organizerName}
                                    onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Reason for Reset</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                                Submit Request
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <form onSubmit={checkStatus} className="flex gap-2">
                                <input
                                    type="email"
                                    required
                                    placeholder="Enter your email"
                                    className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                                    value={statusEmail}
                                    onChange={(e) => setStatusEmail(e.target.value)}
                                />
                                <button type="submit" disabled={searching} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                                    {searching ? '...' : 'Track'}
                                </button>
                            </form>

                            {status.msg && mode === 'status' && (
                                <p className="text-center text-sm text-red-500">{status.msg}</p>
                            )}

                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {history.map((req) => (
                                    <div key={req._id} className="border border-gray-100 p-4 rounded-lg bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${getStatusBadge(req.status)}`}>
                                                {req.status}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-800 mb-1">{req.reason}</p>
                                        {req.adminResponse && (
                                            <div className="mt-3 bg-white p-2 rounded border border-indigo-50 text-xs">
                                                <p className="font-bold text-indigo-600 mb-1">Admin Response:</p>
                                                <p className="text-gray-600 italic">"{req.adminResponse}"</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="mt-6 text-center">
                        <a href="/login" className="text-sm text-indigo-600 hover:text-indigo-500">Back to Login</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizerResetRequest;
