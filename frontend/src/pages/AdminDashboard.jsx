import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../api/axios';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('dashboard');

    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Create Organizer Form State
    const [newOrg, setNewOrg] = useState({ organizerName: '', category: '', description: '', contactEmail: '' });
    const [createdCredentials, setCreatedCredentials] = useState(null); // To show updated email/password onc
    const [creating, setCreating] = useState(false);

    const [requests, setRequests] = useState([]);
    const [requestLoading, setRequestLoading] = useState(false);

    useEffect(() => {
        // Safety check: Ensure only admins can stay on this page
        if (user && user.role !== 'admin') {
            toast.error('Access Denied: You do not have admin privileges.');
            navigate('/');
            return;
        }

        const tab = searchParams.get('tab') || 'dashboard';
        setActiveTab(tab);
        if (tab === 'dashboard') setCreatedCredentials(null);
    }, [searchParams, user, navigate]);

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
            toast.error('Error creating organizer');
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
            toast.error('Error deleting organizer');
        }
    };
    const handleToggleStatus = async (id) => {
        try {
            await api.put(`/admin/organizers/${id}/status`);
            fetchOrganizers();
        } catch (error) {
            const msg = error.response?.data?.message || 'Error updating status';
            if (error.response?.status === 403 && msg.includes('role organizer')) {
                toast.warning('Session Mismatch: You appear to be logged in as an Organizer. Please log back in as Admin.');
                logout();
                navigate('/login');
            } else {
                toast.error(msg);
            }
        }
    };

    const handleRequestAction = async (id, status) => {
        const comments = window.prompt("Optional Admin Comments:");
        try {
            const { data } = await api.put(`/admin/reset-requests/${id}`, { status, comments });
            toast.success(data.message);
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

            {activeTab === 'dashboard' ? (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div className="auth-card" style={{ maxWidth: '600px', width: '100%' }}>
                        <div className="auth-avatar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <line x1="20" y1="8" x2="20" y2="14"></line>
                                <line x1="17" y1="11" x2="23" y2="11"></line>
                            </svg>
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>Launch New Organizer</h2>
                            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>Configure credentials for a new organizational unit</p>
                        </div>

                        <form onSubmit={handleCreate} className="auth-form" style={{ width: '100%' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                                <div className="input-with-icon">
                                    <span className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    </span>
                                    <input
                                        className="input" type="text" placeholder="Organizer Name (Required)" required
                                        value={newOrg.organizerName} onChange={e => setNewOrg({ ...newOrg, organizerName: e.target.value })}
                                    />
                                </div>
                                <div className="input-with-icon">
                                    <span className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                    </span>
                                    <input
                                        className="input" type="text" placeholder="Category (Optional)"
                                        value={newOrg.category} onChange={e => setNewOrg({ ...newOrg, category: e.target.value })}
                                    />
                                </div>
                                <div className="input-with-icon" style={{ gridColumn: '1 / -1' }}>
                                    <span className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                    </span>
                                    <input
                                        className="input" type="email" placeholder="Contact Email (Public, Required)" required
                                        value={newOrg.contactEmail} onChange={e => setNewOrg({ ...newOrg, contactEmail: e.target.value })}
                                    />
                                </div>
                                <div className="input-with-icon" style={{ gridColumn: '1 / -1' }}>
                                    <span className="icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="21" x2="20" y2="21"></line><path d="M4 21v-16a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v16"></path><path d="M9 9h6"></path><path d="M9 13h6"></path><path d="M9 17h6"></path></svg>
                                    </span>
                                    <input
                                        className="input" type="text" placeholder="Description (Optional)"
                                        value={newOrg.description} onChange={e => setNewOrg({ ...newOrg, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={creating} className="btn-primary btn-block py-4" style={{ marginTop: '24px' }}>
                                {creating ? 'Creating...' : 'Initialize Account'}
                            </button>
                        </form>

                        {/* Success UI */}
                        {createdCredentials && (
                            <div style={{ marginTop: '32px', width: '100%' }}>
                                <div style={{ padding: '24px', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                                    <h3 style={{ color: '#1e3a8a', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>Organizer Created!</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#9ca3af', margin: 0 }}>Login Email</p>
                                                <p style={{ fontFamily: 'monospace', color: '#111827', margin: 0, fontSize: '1.2rem' }}>{createdCredentials.loginEmail}</p>
                                            </div>
                                            <button onClick={() => { navigator.clipboard.writeText(createdCredentials.loginEmail); toast.info('Email Copied!'); }} style={{ color: '#2563eb', padding: '8px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                            </button>
                                        </div>
                                        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#9ca3af', margin: 0 }}>Generated Password</p>
                                                <p style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#111827', margin: 0, fontSize: '1.2rem' }}>{createdCredentials.loginPassword}</p>
                                            </div>
                                            <button onClick={() => { navigator.clipboard.writeText(createdCredentials.loginPassword); toast.info('Password Copied!'); }} style={{ color: '#2563eb', padding: '8px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <button onClick={() => setCreatedCredentials(null)} className="btn-primary btn-block" style={{ marginTop: '24px' }}>
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : activeTab === 'clubs' ? (
                <div className="saas-card !p-0 overflow-hidden">
                    <div style={{ padding: '32px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb/30' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#111827', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Organizers</h2>
                        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>Overview of all registered clubs and organizational entities</p>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="saas-table" style={{ border: 'none' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '20px 32px' }}>Organizer Name</th>
                                    <th style={{ padding: '20px' }}>Category</th>
                                    <th style={{ padding: '20px' }}>Contact Email</th>
                                    <th style={{ padding: '20px' }}>Status</th>
                                    <th style={{ padding: '20px 32px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody style={{ borderTop: '1px solid #f3f4f6' }}>
                                {organizers.map((org) => (
                                    <tr key={org._id}>
                                        <td style={{ padding: '20px 32px', fontWeight: '900', color: '#111827' }}>{org.organizerName}</td>
                                        <td><span className="badge badge-gray" style={{ fontWeight: 'bold', padding: '4px 12px' }}>{org.category}</span></td>
                                        <td style={{ color: '#4b5563', fontWeight: '500' }}>{org.contactEmail}</td>
                                        <td>
                                            <span className={`badge ${org.isActive !== false ? 'badge-green' : 'badge-red'}`} style={{ fontWeight: '900', padding: '6px 16px', borderRadius: '9999px' }}>
                                                {org.isActive !== false ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px 32px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleToggleStatus(org._id)}
                                                    style={{
                                                        padding: '10px', borderRadius: '12px', transition: 'all 0.2s', border: '1px solid',
                                                        backgroundColor: org.isActive !== false ? '#fff7ed' : '#f0fdf4',
                                                        color: org.isActive !== false ? '#ea580c' : '#16a34a',
                                                        borderColor: org.isActive !== false ? '#ffedd5' : '#dcfce7',
                                                        cursor: 'pointer'
                                                    }}
                                                    title={org.isActive !== false ? 'Disable/Archive' : 'Enable'}
                                                >
                                                    {org.isActive !== false ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(org._id)}
                                                    style={{
                                                        padding: '10px', color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', transition: 'all 0.2s', cursor: 'pointer'
                                                    }}
                                                    title="Delete Permanently"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {organizers.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '80px 24px', textAlign: 'center', color: '#9ca3af', fontWeight: '500', fontStyle: 'italic' }}>
                                            No organizers found. Use the "Dashboard" tab to add your first one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="saas-card !p-0 overflow-hidden">
                    <div style={{ padding: '32px', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb/30', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#111827', textTransform: 'uppercase', letterSpacing: '1px' }}>Recovery Requests</h2>
                            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>Administrative oversight for account access restoration</p>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6d28d9', fontWeight: '900', backgroundColor: '#f5f3ff', padding: '6px 14px', borderRadius: '20px', border: '1px solid #e9d5ff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {requests.filter(r => r.status === 'pending').length} Action Required
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="saas-table" style={{ border: 'none' }}>
                            <thead>
                                <tr>
                                    <th style={{ padding: '20px 32px' }}>Organizer / Club</th>
                                    <th style={{ padding: '20px' }}>Details / Reason</th>
                                    <th style={{ padding: '20px' }}>Requested</th>
                                    <th style={{ padding: '20px' }}>Status</th>
                                    <th style={{ padding: '20px' }}>Admin Response</th>
                                    <th style={{ padding: '20px 32px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody style={{ borderTop: '1px solid #f3f4f6' }}>
                                {requests.map((req) => (
                                    <tr key={req._id}>
                                        <td style={{ padding: '20px 32px' }}>
                                            <div style={{ fontWeight: 'bold', color: '#111827' }}>{req.organizerName || 'Unknown Club'}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{req.email}</div>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#374151', maxWidth: '250px', whiteSpace: 'normal' }}>
                                                {req.reason}
                                            </div>
                                        </td>
                                        <td style={{ color: '#4b5563', fontSize: '0.85rem' }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge ${req.status === 'pending' ? 'badge-blue' : req.status === 'approved' ? 'badge-green' : 'badge-red'}`} style={{ textTransform: 'capitalize' }}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            {req.adminResponse ? (
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic', maxWidth: '150px' }}>
                                                    "{req.adminResponse}"
                                                </div>
                                            ) : (
                                                <span style={{ color: '#d1d5db', fontSize: '0.75rem' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                                            {req.status === 'pending' ? (
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => handleRequestAction(req._id, 'approved')}
                                                        className="badge badge-green hover:opacity-80 transition-opacity !px-4 !py-2 border-none cursor-pointer text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleRequestAction(req._id, 'rejected')}
                                                        className="badge badge-red hover:opacity-80 transition-opacity !px-4 !py-2 border-none cursor-pointer text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', color: '#9ca3af', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                    RESOLVED
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {requests.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '80px 24px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
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
