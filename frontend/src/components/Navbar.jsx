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
                <Link to="/" className="nav-brand">Campus Events</Link>

                <div className="nav-right">
                    <div className="nav-links">
                        <Link to="/events" className="nav-link">Browse Events</Link>
                        <Link to="/clubs" className="nav-link">Clubs</Link>
                        {user && user.role === 'participant' && (
                            <Link to="/dashboard" className="nav-link">Dashboard</Link>
                        )}
                        {user && user.role === 'organizer' && (
                            <>
                                <Link to="/organizer/dashboard" className="nav-link">Dashboard</Link>
                                <Link to="/organizer/create-event" className="nav-link">Create Event</Link>
                            </>
                        )}
                        {user && user.role === 'admin' && (
                            <>
                                <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
                                <Link to="/admin/dashboard?tab=clubs" className="nav-link">Manage Clubs</Link>
                                <Link to="/admin/dashboard?tab=password-requests" className="nav-link">Password Requests</Link>
                            </>
                        )}
                    </div>

                    {user && (
                        <div className="user-controls">
                            <Link to="/profile" className="btn btn-primary">Profile</Link>
                            <button onClick={handleLogout} className="btn btn-primary">Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
