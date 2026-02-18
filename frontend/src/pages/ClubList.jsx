import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ClubList = () => {
    const { user, updateUser } = useAuth();
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followedIds, setFollowedIds] = useState([]);

    useEffect(() => {
        fetchOrganizers();
        if (user) {
            setFollowedIds(user.followedOrganizers || []);
        }
    }, [user]);

    const fetchOrganizers = async () => {
        try {
            const { data } = await api.get('/users/organizers');
            setOrganizers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowToggle = async (organizerId) => {
        if (!user) {
            alert("Please login to follow clubs");
            return;
        }
        try {
            const { data } = await api.put(`/users/organizers/${organizerId}/follow`);
            setFollowedIds(data.followedOrganizers);
            // Sync with global AuthContext
            updateUser({ followedOrganizers: data.followedOrganizers });
        } catch (error) {
            alert("Error updating follow status");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Clubs & Organizers</h1>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="loader"></div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {organizers.map(org => {
                        const isFollowed = followedIds.includes(org._id);
                        return (
                            <div key={org._id} className="saas-card flex flex-col gap-4" style={{ padding: '24px' }}>
                                <div className="flex justify-between items-start">
                                    <span className={`badge ${org.isVerified ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                                        {org.isVerified ? 'Verified' : 'Club'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        {org.category}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{org.organizerName}</h3>
                                    <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed">
                                        {org.description || 'Connecting enthusiasts and local talents for amazing experiences.'}
                                    </p>
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>Status</p>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: '2px 0 0 0', color: isFollowed ? '#10b981' : '#6b7280' }}>
                                            {isFollowed ? 'Following' : 'Not Followed'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleFollowToggle(org._id)}
                                        className={isFollowed ? 'btn-outline' : 'btn-primary'}
                                        style={{
                                            padding: '8px 20px',
                                            borderRadius: '10px',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {isFollowed ? 'Unfollow' : 'Follow'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {organizers.length === 0 && (
                        <div className="col-span-full saas-card text-center py-20 bg-gray-50 border-dashed border-2 border-gray-200">
                            <p className="text-gray-500 font-medium">No active clubs found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClubList;
