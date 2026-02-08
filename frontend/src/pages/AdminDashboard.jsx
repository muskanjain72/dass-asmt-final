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
                <>
                    {/* Create Organizer Section */}
                    <div className="bg-white shadow sm:rounded-lg mb-8 p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Club / Organizer</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <input
                                    type="text" placeholder="Organizer Name" required
                                    className="block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                    value={newOrg.organizerName} onChange={e => setNewOrg({ ...newOrg, organizerName: e.target.value })}
                                />
                                <input
                                    type="text" placeholder="Category (e.g. Technical Club)" required
                                    className="block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                    value={newOrg.category} onChange={e => setNewOrg({ ...newOrg, category: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <input
                                    type="email" placeholder="Contact Email (Public)" required
                                    className="block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                    value={newOrg.contactEmail} onChange={e => setNewOrg({ ...newOrg, contactEmail: e.target.value })}
                                />
                                <input
                                    type="text" placeholder="Description"
                                    className="block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                                    value={newOrg.description} onChange={e => setNewOrg({ ...newOrg, description: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={creating}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                            >
                                {creating ? 'Creating...' : 'Create Organizer Account'}
                            </button>
                        </form>

                        {/* Success Message with Credentials */}
                        {createdCredentials && (
                            <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200">
                                <h3 className="text-green-800 font-bold">Organizer Created Successfully!</h3>
                                <p className="text-sm text-green-700 mt-1">Please copy these credentials and share them with the organizer.</p>
                                <div className="mt-2 bg-white p-3 rounded border border-gray-200 font-mono text-sm">
                                    <p><strong>Login Email:</strong> {createdCredentials.loginEmail}</p>
                                    <p><strong>Password:</strong> {createdCredentials.loginPassword}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Organizers List */}
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Manage Organizers</h2>
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {organizers.map((org) => (
                                <li key={org._id} className={`px-4 py-4 sm:px-6 flex justify-between items-center ${org.isActive === false ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                                    <div>
                                        <p className="text-sm font-medium text-indigo-600 font-bold">
                                            {org.organizerName} {org.isActive === false && <span className="text-red-500 ml-2">(ARCHIVED/DISABLED)</span>}
                                        </p>
                                        <p className="text-sm text-gray-500">{org.category}</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className="text-xs text-gray-400">{org.contactEmail}</span>

                                        <button
                                            onClick={() => handleToggleStatus(org._id)}
                                            className={`${org.isActive !== false ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'} text-sm font-medium`}
                                        >
                                            {org.isActive !== false ? 'Disable/Archive' : 'Activate'}
                                        </button>

                                        <button
                                            onClick={() => handleDelete(org._id)}
                                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                            {organizers.length === 0 && !loading && (
                                <li className="px-4 py-4 text-gray-500 text-center">No organizers found.</li>
                            )}
                        </ul>
                    </div>
                </>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Password Reset Requests</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">Approve requests to generate new temporary passwords.</p>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {requests.length === 0 && (
                            <li className="px-4 py-8 text-center text-gray-500">No requests found.</li>
                        )}
                        {requests.map(req => (
                            <li key={req._id} className="px-4 py-4 sm:px-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center">
                                            <p className="text-sm font-bold text-indigo-600">{req.organizerName}</p>
                                            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {req.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">Email: {req.email}</p>
                                        <div className="mt-2 text-sm text-gray-800 bg-gray-50 p-2 rounded">
                                            <span className="font-semibold">Reason:</span> {req.reason}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">Requested: {new Date(req.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div className="ml-4 flex items-center space-x-2">
                                        {req.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleRequestAction(req._id, 'approved')}
                                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRequestAction(req._id, 'rejected')}
                                                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
