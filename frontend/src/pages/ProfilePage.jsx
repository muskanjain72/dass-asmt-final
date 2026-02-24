import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../api/axios';

const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', contactNumber: '', collegeName: '',
        // Participant Type
        participantType: '',
        // Organizer fields
        organizerName: '', category: '', description: '', contactEmail: '', discordWebhookUrl: '',
        // Interests
        interests: [],
        // Password update
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const availableInterests = [
        'Data Science', 'Cybersecurity', 'Competitive Programming', 'Robotics',
        'Blockchain', 'UI / UX Design', 'Cloud Computing', 'Entrepreneurship',
        'Finance', 'Public Speaking', 'Music', 'Dance', 'Photography',
        'Sports', 'Social Service'
    ];

    const [followedClubs, setFollowedClubs] = useState([]);
    const [loadingClubs, setLoadingClubs] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                contactNumber: user.contactNumber || '',
                collegeName: user.collegeName || '',
                participantType: user.participantType || 'Student',
                organizerName: user.organizerName || '',
                category: user.category || '',
                description: user.description || '',
                contactEmail: user.contactEmail || '',
                discordWebhookUrl: user.discordWebhookUrl || '',
                interests: user.interests || [],
                password: '' // Reset password field on load
            }));
            if (user.role === 'participant') {
                fetchFollowedClubs();
            }
        }
    }, [user]);

    const fetchFollowedClubs = async () => {
        setLoadingClubs(true);
        try {
            const { data } = await api.get('/users/organizers');
            // Filter only followed ones
            const followed = data.filter(org => user.followedOrganizers?.includes(org._id));
            setFollowedClubs(followed);
        } catch (err) {
            console.error("Error fetching followed clubs", err);
        } finally {
            setLoadingClubs(false);
        }
    };

    const handleUnfollow = async (id) => {
        try {
            await api.put(`/users/organizers/${id}/follow`);
            setFollowedClubs(prev => prev.filter(c => c._id !== id));
            // Update local user state too
            const updatedFollowed = user.followedOrganizers.filter(oid => oid !== id);
            updateUser({ followedOrganizers: updatedFollowed });
        } catch (err) {
            toast.error("Error unfollowing club");
        }
    };

    const toggleInterest = (interest) => {
        setFormData(prev => {
            const interests = prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest];
            return { ...prev, interests };
        });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const [newInterest, setNewInterest] = useState('');

    const handleAddInterest = () => {
        if (!newInterest.trim()) return;
        if (formData.interests.includes(newInterest.trim())) {
            setNewInterest('');
            return;
        }
        setFormData(prev => ({
            ...prev,
            interests: [...prev.interests, newInterest.trim()]
        }));
        setNewInterest('');
    };

    const handleRemoveInterest = (interestToRemove) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.filter(i => i !== interestToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            // Filter out empty password if not changing
            const payload = { ...formData };
            if (!payload.password) delete payload.password;

            const { data } = await api.put('/users/profile', payload);
            updateUser(data); // Update global user state
            setMessage('Profile updated successfully');
            // Clear password field after successful update
            setFormData(prev => ({ ...prev, password: '' }));
        } catch (err) {
            setError(err.response?.data?.message || 'Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}><div style={{ background: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>Please login to view profile.</div></div>;

    const isParticipant = user.role === 'participant';

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 60px' }}>
            <div style={{
                background: 'white', borderRadius: '24px', padding: '40px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>Profile</h1>
                    <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Manage your account settings</p>
                </div>

                {message && <div style={{
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    textAlign: 'center'
                }}>{message}</div>}

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">

                    {/* Name Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="input-with-icon">
                            <span className="icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </span>
                            <input
                                type="text"
                                className="input"
                                name={isParticipant ? "firstName" : "organizerName"}
                                placeholder={isParticipant ? "First Name" : "Organizer Name"}
                                value={isParticipant ? formData.firstName : formData.organizerName}
                                // Disable editing for First Name / Organizer Name
                                disabled
                                style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                            />
                        </div>

                        {isParticipant && (
                            <div className="input-with-icon">
                                <span className="icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                </span>
                                <input
                                    type="text"
                                    className="input"
                                    name="lastName"
                                    placeholder="Last Name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                            </div>
                        )}
                    </div>

                    {/* Email (Read-Only) */}
                    <div className="input-with-icon">
                        <span className="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </span>
                        <input
                            type="email"
                            className="input"
                            value={user.email}
                            disabled
                            style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                        />
                    </div>

                    {/* Phone */}
                    <div className="input-with-icon">
                        <span className="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </span>
                        <input
                            type="text"
                            className="input"
                            name="contactNumber"
                            placeholder="Phone Number"
                            value={formData.contactNumber}
                            onChange={handleChange}
                        />
                    </div>

                    {isParticipant ? (
                        <>
                            <div className="input-with-icon">
                                <span className="icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-4h8v4"></path></svg>
                                </span>
                                <input
                                    type="text"
                                    className="input"
                                    name="collegeName"
                                    placeholder="College/Organization Name"
                                    value={formData.collegeName}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="input-group-row">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>Participant Type</label>
                                <select
                                    className="input"
                                    name="participantType"
                                    value={formData.participantType}
                                    // Disable editing for Participant Type
                                    disabled
                                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                >
                                    <option value="Student">Student</option>
                                    <option value="Faculty">Faculty</option>
                                    <option value="External">External</option>
                                </select>
                            </div>

                            {/* Interests Section */}
                            <div style={{ marginTop: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>Interests & Preferences</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                                    {availableInterests.map(interest => (
                                        <button
                                            key={interest}
                                            type="button"
                                            onClick={() => toggleInterest(interest)}
                                            className={formData.interests.includes(interest) ? 'btn-primary' : 'btn-outline'}
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                fontSize: '0.75rem',
                                                borderRadius: '9999px',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {interest}
                                        </button>
                                    ))}
                                </div>
                                {/* Add custom interest */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                    <input
                                        type="text"
                                        placeholder="Add custom interest..."
                                        value={newInterest}
                                        onChange={e => setNewInterest(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                                        className="input"
                                        style={{ flex: 1, padding: '8px 14px', fontSize: '0.85rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddInterest}
                                        className="btn-primary"
                                        style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem' }}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Followed Clubs Section */}
                            <div style={{ marginTop: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>Followed Clubs</h3>
                                {loadingClubs ? (
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Loading followed clubs...</p>
                                ) : followedClubs.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                                        {followedClubs.map(club => (
                                            <div key={club._id} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.75rem 1rem',
                                                backgroundColor: '#f9fafb',
                                                borderRadius: '0.5rem',
                                                border: '1px solid #e5e7eb'
                                            }}>
                                                <div>
                                                    <p style={{ fontWeight: '600', fontSize: '0.9rem', color: '#111827' }}>{club.organizerName}</p>
                                                    <p style={{ fontSize: '0.75rem', color: '#6366f1' }}>{club.category}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUnfollow(club._id)}
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        color: '#ef4444',
                                                        border: '1px solid #fee2e2',
                                                        backgroundColor: '#fef2f2',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '0.25rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Unfollow
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic' }}>You aren't following any clubs yet.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="input-group-row" style={{ marginTop: '1rem' }}>
                                <input
                                    type="text"
                                    className="input"
                                    name="category"
                                    placeholder="Category (e.g. Technical)"
                                    value={formData.category}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-group-row" style={{ marginTop: '1rem' }}>
                                <textarea
                                    name="description"
                                    className="input"
                                    placeholder="Description"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleChange}
                                    style={{ resize: 'vertical', height: 'auto', paddingTop: '0.75rem' }}
                                />
                            </div>
                            <div className="input-with-icon">
                                <span className="icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                                </span>
                                <input
                                    type="email"
                                    className="input"
                                    name="contactEmail"
                                    placeholder="Public Contact Email"
                                    value={formData.contactEmail}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-with-icon">
                                <span className="icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                </span>
                                <input
                                    type="text"
                                    className="input"
                                    name="discordWebhookUrl"
                                    placeholder="Discord Webhook URL"
                                    value={formData.discordWebhookUrl}
                                    onChange={handleChange}
                                />
                            </div>
                        </>
                    )}

                    {/* Password Section */}
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#374151' }}>Security</h3>

                        {!isParticipant ? (
                            <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                                    For security reasons, organizers cannot change passwords directly. Please submit a request to the Admin for a password reset.
                                </p>
                                <button
                                    type="button"
                                    className="btn-outline"
                                    style={{ width: '100%', borderColor: '#6366f1', color: '#6366f1' }}
                                    onClick={async () => {
                                        try {
                                            setLoading(true);
                                            await api.post('/auth/reset-request', {
                                                email: user.email,
                                                organizerName: user.organizerName || formData.organizerName,
                                                reason: 'Password reset requested from profile page'
                                            });
                                            setMessage('Password reset request submitted to Admin successfully.');
                                        } catch (err) {
                                            setError(err.response?.data?.message || 'Error submitting reset request');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    disabled={loading}
                                >
                                    Request Password Reset from Admin
                                </button>
                            </div>
                        ) : (
                            <div className="input-with-icon">
                                <span className="icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                </span>
                                <input
                                    type="password"
                                    className="input"
                                    name="password"
                                    placeholder="New Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" className="btn-outline" onClick={() => window.location.reload()} style={{ display: 'flex', justifyContent: 'center' }}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', justifyContent: 'center' }}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default ProfilePage;
