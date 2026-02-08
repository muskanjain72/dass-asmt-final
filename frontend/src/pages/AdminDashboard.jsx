import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const AdminDashboard = () => {
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('clubs');

    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Create Organizer Form State
    const [newOrg, setNewOrg] = useState({ organizerName: '', category: '', description: '', contactEmail: '' });
    const [createdCredentials, setCreatedCredentials] = useState(null); // To show updated email/password onc
    const [creating, setCreating] = useState(false);

    const [requests, setRequests] = useState([]);
    const [requestLoading, setRequestLoading] = useState(false);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    useEffect(() => {
        if (activeTab === 'clubs') {
            fetchOrganizers();
        } else if (activeTab === 'password-requests') {
            fetchRequests();
        }
    }, [activeTab]);

    const fetchRequests = async () => {
        try {
            setRequestLoading(true);
            const { data } = await api.get('/admin/reset-requests');
            setRequests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setRequestLoading(false);
        }
    };

    const fetchOrganizers = async () => {
        try {
            const { data } = await api.get('/admin/organizers');
            setOrganizers(data);
        } catch (error) {
            console.error("Error fetching organizers", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        setCreatedCredentials(null);
        try {
            const { data } = await api.post('/admin/organizers', newOrg);
            // data.organizer key contains credentials per our backend controller
            setCreatedCredentials(data.organizer);
            setNewOrg({ organizerName: '', category: '', description: '', contactEmail: '' });
            fetchOrganizers(); // Refresh list
        } catch (error) {
            alert('Error creating organizer');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this organizer?')) return;
        try {
            await api.delete(`/admin/organizers/${id}`);
            fetchOrganizers();
        } catch (error) {
            alert('Error deleting organizer');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await api.put(`/admin/organizers/${id}/status`);
            fetchOrganizers();
        } catch (error) {
            alert('Error updating status');
        }
    };

    const handleRequestAction = async (id, status) => {
        const comments = window.prompt("Optional Admin Comments:");
        try {
            const { data } = await api.put(`/admin/reset-requests/${id}`, { status, comments });
            alert(data.message);
            if (data.newPassword) {
                window.prompt("Detailed Success! COPY THIS NEW PASSWORD NOW:", data.newPassword);
            }
            fetchRequests();
        } catch (error) {
            alert(error.response?.data?.message || 'Action failed');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('clubs')}
                        className={`${activeTab === 'clubs'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Manage Clubs & Organizers
                    </button>
                    <button
                        onClick={() => setActiveTab('password-requests')}
                        className={`${activeTab === 'password-requests'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Password Reset Requests
                    </button>
                </nav>
            </div>

            {activeTab === 'clubs' ? (
                <div className="space-y-8">
                    {/* Add New Organizer Section */}
                    <div className="saas-card">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-1 h-6 bg-purple-600 rounded-full" style={{ background: 'var(--primary-gradient)' }}></div>
                            <h2 className="text-xl font-bold text-gray-900">Add New Club / Organizer</h2>
                        </div>

                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Organizer Name</label>
                                <input
                                    type="text" placeholder="e.g. Google Developer Group" required
                                    className="block w-full border-gray-200 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none border transition-all"
                                    value={newOrg.organizerName} onChange={e => setNewOrg({ ...newOrg, organizerName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Category</label>
                                <input
                                    type="text" placeholder="e.g. Technical" required
                                    className="block w-full border-gray-200 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none border transition-all"
                                    value={newOrg.category} onChange={e => setNewOrg({ ...newOrg, category: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Contact Email (Public)</label>
                                <input
                                    type="email" placeholder="contact@club.com" required
                                    className="block w-full border-gray-200 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none border transition-all"
                                    value={newOrg.contactEmail} onChange={e => setNewOrg({ ...newOrg, contactEmail: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Description</label>
                                <input
                                    type="text" placeholder="Brief description..."
                                    className="block w-full border-gray-200 rounded-xl shadow-sm p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none border transition-all"
                                    value={newOrg.description} onChange={e => setNewOrg({ ...newOrg, description: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="btn btn-primary w-full md:w-auto px-8"
                                >
                                    {creating ? 'Creating...' : 'Create Organizer Account'}
                                </button>
                            </div>
                        </form>

                        {/* Success Card with Credentials */}
                        {createdCredentials && (
                            <div className="mt-8 p-6 bg-purple-50 rounded-2xl border border-purple-100 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-purple-900 font-bold text-lg mb-2">Organizer Created Successfully!</h3>
                                <p className="text-sm text-purple-700 mb-6">Generated system credentials for login:</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Login Email</p>
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-gray-900">{createdCredentials.loginEmail}</span>
                                            <button
                                                onClick={() => { navigator.clipboard.writeText(createdCredentials.loginEmail); alert('Email Copied!'); }}
                                                className="text-purple-600 hover:text-purple-700 p-1"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Generated Password</p>
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-gray-900 font-bold">{createdCredentials.loginPassword}</span>
                                            <button
                                                onClick={() => { navigator.clipboard.writeText(createdCredentials.loginPassword); alert('Password Copied!'); }}
                                                className="text-purple-600 hover:text-purple-700 p-1"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setCreatedCredentials(null)}
                                    className="mt-6 text-sm text-purple-400 hover:text-purple-600 font-medium"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Manage Organizers Table */}
                    <div className="saas-card overflow-hidden !p-0">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">Manage Organizers</h2>
                            <div className="text-sm text-gray-500 font-medium bg-white px-3 py-1 rounded-full border border-gray-100">
                                Total: {organizers.length}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="saas-table border-none">
                                <thead>
                                    <tr>
                                        <th>Organizer Name</th>
                                        <th>Category</th>
                                        <th>Contact Email</th>
                                        <th>Status</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {organizers.map((org) => (
                                        <tr key={org._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="font-bold text-gray-900">{org.organizerName}</td>
                                            <td><span className="badge badge-gray">{org.category}</span></td>
                                            <td className="text-gray-500">{org.contactEmail}</td>
                                            <td>
                                                <span className={`badge ${org.isActive !== false ? 'badge-green' : 'badge-red'}`}>
                                                    {org.isActive !== false ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="text-right space-x-2 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleToggleStatus(org._id)}
                                                    className={`p-2 rounded-lg transition-colors ${org.isActive !== false ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                                                    title={org.isActive !== false ? 'Disable/Archive' : 'Enable'}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(org._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Permanently"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {organizers.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic">
                                                No organizers found. Start by adding one above.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="saas-card overflow-hidden !p-0">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Password Reset Requests</h2>
                            <p className="text-sm text-gray-500 mt-1">Review and handle organizer account recovery requests.</p>
                        </div>
                        <div className="text-sm text-gray-500 font-medium bg-white px-3 py-1 rounded-full border border-gray-100">
                            Pending: {requests.filter(r => r.status === 'pending').length}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="saas-table border-none">
                            <thead>
                                <tr>
                                    <th>Organizer</th>
                                    <th>Email</th>
                                    <th>Reason</th>
                                    <th>Requested</th>
                                    <th>Status</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requests.map(req => (
                                    <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="font-bold text-gray-900">{req.organizerName}</td>
                                        <td className="text-gray-500 text-sm">{req.email}</td>
                                        <td>
                                            <div className="max-w-xs truncate text-sm text-gray-600" title={req.reason}>
                                                {req.reason}
                                            </div>
                                        </td>
                                        <td className="text-gray-400 text-xs">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <span className={`badge ${req.status === 'approved' ? 'badge-green' :
                                                    req.status === 'rejected' ? 'badge-red' : 'badge-orange'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="text-right space-x-2">
                                            {req.status === 'pending' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleRequestAction(req._id, 'approved')}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Approve & Generate Password"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleRequestAction(req._id, 'rejected')}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Reject Request"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium uppercase italic">Handled</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {requests.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic">
                                            No password reset requests found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
