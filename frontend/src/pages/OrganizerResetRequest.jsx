import { useState } from 'react';
import api from '../api/axios';

const OrganizerResetRequest = () => {
    const [formData, setFormData] = useState({
        email: '',
        organizerName: '',
        reason: ''
    });
    const [status, setStatus] = useState({ type: '', msg: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/reset-request', formData);
            setStatus({ type: 'success', msg: 'Reset request submitted. Admin will review and contact you.' });
        } catch (error) {
            setStatus({ type: 'error', msg: error.response?.data?.message || 'Submission failed' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Organizer Password Reset
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Submit a request to the Admin for account recovery.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {status.msg && (
                        <div className={`mb-4 p-2 rounded text-sm ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {status.msg}
                        </div>
                    )}
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

                        <div>
                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                                Submit Request
                            </button>
                        </div>
                        <div className="text-center">
                            <a href="/login" className="text-sm text-indigo-600 hover:text-indigo-500">Back to Login</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OrganizerResetRequest;
