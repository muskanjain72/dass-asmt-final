import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ProfilePage = () => {
    const { user, login } = useAuth(); // login used here to update local user state if needed
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', contactNumber: '', collegeName: '',
        // Organizer fields
        organizerName: '', category: '', description: '', contactEmail: '', discordWebhookUrl: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                contactNumber: user.contactNumber || '',
                collegeName: user.collegeName || '',
                organizerName: user.organizerName || '',
                category: user.category || '',
                description: user.description || '',
                contactEmail: user.contactEmail || '',
                discordWebhookUrl: user.discordWebhookUrl || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const { data } = await api.put('/users/profile', formData);
            setMessage('Profile updated successfully');
            // Optimistically update or re-fetch?
            // Assuming context might need refresh, or we just rely on local state for now
            // Ideally call a function exposed by AuthProvider to refresh user
        } catch (error) {
            setMessage('Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div>Please login</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">User Information</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and settings.</p>
                </div>

                <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
                    {/* Common Non-Editable */}
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-4">
                            <label className="block text-sm font-medium text-gray-700">Email (Non-editable)</label>
                            <input type="text" disabled value={user.email} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-50 p-2 border" />
                            <span className="text-xs text-gray-500 capitalize">Role: {user.role}</span>
                        </div>
                    </div>

                    {/* Participant Fields */}
                    {user.role === 'participant' && (
                        <>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">First name</label>
                                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2" />
                                </div>
                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Last name</label>
                                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2" />
                                </div>
                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                    <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2" />
                                </div>
                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">College Name</label>
                                    <input type="text" name="collegeName" value={formData.collegeName} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Organizer Fields */}
                    {user.role === 'organizer' && (
                        <>
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Organizer / Club Name</label>
                                    <input type="text" name="organizerName" value={formData.organizerName} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2" />
                                </div>
                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Category</label>
                                    <input type="text" name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2" />
                                </div>
                                <div className="sm:col-span-6">
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2" />
                                </div>
                                <div className="sm:col-span-4">
                                    <label className="block text-sm font-medium text-gray-700">Public Contact Email</label>
                                    <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2" />
                                </div>
                                <div className="sm:col-span-6">
                                    <label className="block text-sm font-medium text-gray-700">Discord Webhook URL</label>
                                    <input type="text" name="discordWebhookUrl" value={formData.discordWebhookUrl} onChange={handleChange} placeholder="https://discord.com/api/webhooks/..." className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-2" />
                                    <p className="mt-1 text-xs text-gray-500">Events will automatically be posted to this channel when published.</p>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex justify-end">
                        <button type="submit" disabled={loading} className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                    {message && <p className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;
