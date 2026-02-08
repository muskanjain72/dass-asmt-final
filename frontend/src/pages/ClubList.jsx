import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ClubList = () => {
    const { user } = useAuth();
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followedIds, setFollowedIds] = useState([]);

    useEffect(() => {
        fetchOrganizers();
        if (user) {
            fetchUserProfile();
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

    const fetchUserProfile = async () => {
        try {
            const { data } = await api.get('/users/profile');
            setFollowedIds(data.followedOrganizers || []);
        } catch (error) {
            console.error(error);
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
        } catch (error) {
            alert("Error updating follow status");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Clubs & Organizers</h1>

            {loading ? (
                <div className="text-center">Loading...</div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {organizers.map(org => {
                        const isFollowed = followedIds.includes(org._id);
                        return (
                            <div key={org._id} className="bg-white shadow rounded-lg p-6 flex flex-col">
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-bold text-gray-900">{org.organizerName}</h3>
                                        {org.isVerified && (
                                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">Verified</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-indigo-600 mb-2">{org.category}</p>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-3">{org.description}</p>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t pt-4">
                                    <button
                                        onClick={() => handleFollowToggle(org._id)}
                                        className={`px-4 py-2 rounded text-sm font-medium ${isFollowed
                                                ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                            }`}
                                    >
                                        {isFollowed ? 'Unfollow' : 'Follow'}
                                    </button>
                                    <span className="text-xs text-gray-400">
                                        {/* Placeholder for follower count if we had it */}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {organizers.length === 0 && <div className="col-span-full text-center">No active clubs found.</div>}
                </div>
            )}
        </div>
    );
};

export default ClubList;
