import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'dashboard';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="nav-container">
                {!user && (
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
                                        <Link to="/organizer/dashboard?tab=dashboard" className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}>Dashboard</Link>
                                        <Link to="/organizer/create-event" className={`nav-link ${location.pathname === '/organizer/create-event' ? 'active' : ''}`}>Create Event</Link>
                                        <Link to="/organizer/dashboard?tab=ongoing" className={`nav-link ${activeTab === 'ongoing' ? 'active' : ''}`}>Ongoing Events</Link>
                                    </>
                                )}
                                {user.role === 'admin' && (
                                    <>
                                        <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
                                        <Link to="/admin/dashboard?tab=clubs" className="nav-link">Manage Clubs/Organizers</Link>
                                        <Link to="/admin/dashboard?tab=password-requests" className="nav-link">Password Reset Requests</Link>
                                    </>
                                )}
                                <Link to="/profile" className="nav-link">Profile</Link>
                                <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: '0' }}>Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/events" className="nav-link">Browse Events</Link>
                                <Link to="/clubs" className="nav-link">Clubs</Link>
                                <Link to="/login" className="nav-link">Login</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
