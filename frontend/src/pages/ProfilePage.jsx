import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ProfilePage = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', contactNumber: '', collegeName: '',
        // Organizer fields
        organizerName: '', category: '', description: '', contactEmail: '', discordWebhookUrl: '',
        // Password update
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                contactNumber: user.contactNumber || '',
                collegeName: user.collegeName || '',
                organizerName: user.organizerName || '',
                category: user.category || '',
                description: user.description || '',
                contactEmail: user.contactEmail || '',
                discordWebhookUrl: user.discordWebhookUrl || '',
                password: '' // Reset password field on load
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
            setMessage('Profile updated successfully');
            // Clear password field after successful update
            setFormData(prev => ({ ...prev, password: '' }));
        } catch (err) {
            setError(err.response?.data?.message || 'Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="profile-container">Please login to view profile.</div>;

    const isParticipant = user.role === 'participant';

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1 className="profile-title">Profile</h1>
                <p className="profile-subtitle">Manage your name, password and account settings.</p>
            </div>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="profile-card">

                {/* Avatar Section */}
                <div className="profile-row">
                    <label className="profile-label">Profile photo</label>
                    <div className="profile-avatar-section">
                        <div className="profile-avatar">
                            {/* Initials or Icon */}
                            {isParticipant
                                ? (formData.firstName?.[0] || 'U')
                                : (formData.organizerName?.[0] || 'O')}
                        </div>
                        <button type="button" className="btn-upload">Upload photo</button>
                    </div>
                </div>

                {/* Name Section */}
                <div className="profile-row">
                    <label className="profile-label">
                        {isParticipant ? 'Full Name' : 'Organizer Name'}
                    </label>
                    <div className="profile-input-group">
                        {isParticipant ? (
                            <>
                                <div className="profile-input-wrapper">
                                    <input
                                        type="text"
                                        name="firstName"
                                        placeholder="First Name"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="profile-input"
                                    />
                                </div>
                                <div className="profile-input-wrapper">
                                    <input
                                        type="text"
                                        name="lastName"
                                        placeholder="Last Name"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="profile-input"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="profile-input-wrapper">
                                <input
                                    type="text"
                                    name="organizerName"
                                    value={formData.organizerName}
                                    onChange={handleChange}
                                    className="profile-input"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Email Section (Read-Only) */}
                <div className="profile-row">
                    <label className="profile-label">Email</label>
                    <div className="profile-input-wrapper">
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="profile-input"
                        />
                    </div>
                </div>

                {/* Password Section */}
                <div className="profile-row">
                    <label className="profile-label">Password</label>
                    <div className="profile-input-wrapper">
                        <input
                            type="password"
                            name="password"
                            placeholder="Enter new password to change"
                            value={formData.password}
                            onChange={handleChange}
                            className="profile-input"
                        />
                    </div>
                </div>

                {/* Phone Section */}
                <div className="profile-row">
                    <label className="profile-label">Phone</label>
                    <div className="profile-input-wrapper">
                        <input
                            type="text"
                            name="contactNumber"
                            placeholder="+91 XXXXX XXXXX"
                            value={formData.contactNumber}
                            onChange={handleChange}
                            className="profile-input"
                        />
                    </div>
                </div>

                {/* Role Specific Fields */}
                {isParticipant ? (
                    <div className="profile-row">
                        <label className="profile-label">College/Organization</label>
                        <div className="profile-input-wrapper">
                            <input
                                type="text"
                                name="collegeName"
                                value={formData.collegeName}
                                onChange={handleChange}
                                className="profile-input"
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="profile-row">
                            <label className="profile-label">Category</label>
                            <div className="profile-input-wrapper">
                                <input
                                    type="text"
                                    name="category"
                                    placeholder="e.g. Technical, Cultural"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="profile-input"
                                />
                            </div>
                        </div>
                        <div className="profile-row">
                            <label className="profile-label">Description</label>
                            <div className="profile-input-wrapper">
                                <textarea
                                    name="description"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="profile-input"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                        </div>
                        <div className="profile-row">
                            <label className="profile-label">Public Email</label>
                            <div className="profile-input-wrapper">
                                <input
                                    type="email"
                                    name="contactEmail"
                                    value={formData.contactEmail}
                                    onChange={handleChange}
                                    className="profile-input"
                                />
                            </div>
                        </div>
                        <div className="profile-row">
                            <label className="profile-label">Discord Webhook</label>
                            <div className="profile-input-wrapper">
                                <input
                                    type="text"
                                    name="discordWebhookUrl"
                                    placeholder="https://discord.com/api/webhooks/..."
                                    value={formData.discordWebhookUrl}
                                    onChange={handleChange}
                                    className="profile-input"
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* Actions */}
                <div className="profile-actions">
                    <button type="button" className="btn-cancel" onClick={() => window.location.reload()}>Cancel</button>
                    <button type="submit" className="btn-save" disabled={loading}>
                        {loading ? 'Saving...' : 'Save changes'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default ProfilePage;
