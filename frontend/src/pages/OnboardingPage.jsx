import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Interests
    const availableInterests = ['Coding', 'Music', 'Sports', 'Art', 'Dance', 'Acting', 'Photography', 'Gaming', 'Technology', 'Social Service', 'Business'];
    const [selectedInterests, setSelectedInterests] = useState([]);

    // Step 2: Clubs
    const [organizers, setOrganizers] = useState([]);
    const [followedIds, setFollowedIds] = useState([]);

    useEffect(() => {
        if (user?.role !== 'participant') {
            navigate('/dashboard');
        }
        fetchOrganizers();
    }, []);

    const fetchOrganizers = async () => {
        try {
            const { data } = await api.get('/users/organizers');
            setOrganizers(data);
        } catch (error) {
            console.error(error);
        }
    };

    const toggleInterest = (interest) => {
        setSelectedInterests(prev =>
            prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
        );
    };

    const toggleFollow = (id) => {
        setFollowedIds(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const handleSkip = () => {
        navigate('/dashboard');
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            // Update interests
            const { data } = await api.put('/users/profile', { interests: selectedInterests });

            // Follow selected organizers
            for (const orgId of followedIds) {
                await api.put(`/users/organizers/${orgId}/follow`);
            }

            updateUser(data);
            navigate('/dashboard');
        } catch (error) {
            console.error("Error saving onboarding data", error);
            alert("Something went wrong. You can configure your profile later.");
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: '700px', width: '100%' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div className="auth-avatar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                            <path d="M2 17l10 5 10-5"></path>
                            <path d="M2 12l10 5 10-5"></path>
                        </svg>
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginTop: '1rem' }}>
                        {step === 1 ? 'Select Your Interests' : 'Follow Clubs'}
                    </h1>
                    <p style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                        {step === 1 ? 'Help us personalize your event feed' : 'Stay updated with your favorite groups'}
                    </p>
                </div>

                <form className="auth-form">
                    {step === 1 && (
                        <div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                {availableInterests.map(interest => (
                                    <button
                                        key={interest}
                                        type="button"
                                        onClick={() => toggleInterest(interest)}
                                        className={selectedInterests.includes(interest) ? 'btn-primary' : 'btn-outline'}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.875rem',
                                            borderRadius: '9999px'
                                        }}
                                    >
                                        {interest}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    type="button"
                                    onClick={handleSkip}
                                    className="btn-outline"
                                    style={{ flex: 1 }}
                                >
                                    Skip for Now
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                                    {organizers.map(org => (
                                        <div
                                            key={org._id}
                                            onClick={() => toggleFollow(org._id)}
                                            style={{
                                                padding: '1rem',
                                                border: followedIds.includes(org._id) ? '2px solid #6366f1' : '2px solid #e5e7eb',
                                                borderRadius: '0.75rem',
                                                cursor: 'pointer',
                                                backgroundColor: followedIds.includes(org._id) ? '#eef2ff' : 'white',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h4 style={{ fontWeight: 'bold', color: '#111827', fontSize: '0.95rem' }}>{org.organizerName}</h4>
                                                    <p style={{ fontSize: '0.75rem', color: '#6366f1', marginTop: '0.25rem' }}>{org.category}</p>
                                                </div>
                                                <div style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    backgroundColor: followedIds.includes(org._id) ? '#6366f1' : '#e5e7eb',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white'
                                                }}>
                                                    {followedIds.includes(org._id) && (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="btn-outline"
                                    style={{ flex: 1 }}
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSkip}
                                    className="btn-outline"
                                    style={{ flex: 1 }}
                                >
                                    Skip
                                </button>
                                <button
                                    type="button"
                                    onClick={handleFinish}
                                    disabled={loading}
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    {loading ? 'Saving...' : 'Finish'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default OnboardingPage;
