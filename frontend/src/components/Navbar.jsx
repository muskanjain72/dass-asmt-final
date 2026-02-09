import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="nav-container">
                {(!user || (user.role !== 'admin' && user.role !== 'organizer')) && (
                    <Link to="/" className="nav-brand">Campus Events</Link>
                )}

                <div className="nav-right">
                    <div className="nav-links">
                        {user ? (
                            <>
                                {user.role === 'participant' && (
                                    <>
                                        <Link to="/events" className="nav-link">Browse Events</Link>
                                        <Link to="/clubs" className="nav-link">Clubs</Link>
                                        <Link to="/dashboard" className="nav-link">Dashboard</Link>
                                    </>
                                )}
                                {user.role === 'organizer' && (
                                    <>
                                        <Link to="/organizer/dashboard?tab=dashboard" className="nav-link">Dashboard</Link>
                                        <Link to="/organizer/create-event" className="nav-link">Create Event</Link>
                                        <Link to="/organizer/dashboard?tab=ongoing" className="nav-link">Ongoing Event</Link>
                                        <Link to="/profile" className="nav-link">Profile</Link>
                                        <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>Logout</button>
                                    </>
                                )}
                                {user.role === 'admin' && (
                                    <>
                                        <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
                                        <Link to="/admin/dashboard?tab=clubs" className="nav-link">Manage Clubs/Organizers</Link>
                                        <Link to="/admin/dashboard?tab=password-requests" className="nav-link">Password Reset Requests</Link>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                <Link to="/events" className="nav-link">Browse Events</Link>
                                <Link to="/clubs" className="nav-link">Clubs</Link>
                            </>
                        )}
                    </div>

                    {user && user.role !== 'organizer' && (
                        <div className="user-controls">
                            {user.role !== 'admin' && <Link to="/profile" className="btn btn-primary">Profile</Link>}
                            <button onClick={handleLogout} className="btn btn-primary">Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
