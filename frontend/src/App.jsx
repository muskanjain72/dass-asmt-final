import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import './App.css';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ParticipantDashboard from './pages/ParticipantDashboard';
import BrowseEvents from './pages/BrowseEvents';
import EventDetails from './pages/EventDetails';
import ClubList from './pages/ClubList';
import OrganizerProfile from './pages/OrganizerProfile';
import OnboardingPage from './pages/OnboardingPage';

// Organizer & Admin
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
import AdminDashboard from './pages/AdminDashboard';
import OrganizerEventDetails from './pages/OrganizerEventDetails';
import ProfilePage from './pages/ProfilePage';
import OrganizerResetRequest from './pages/OrganizerResetRequest';
import ProtectedRoute from './components/ProtectedRoute';

// Smart redirect for the root path
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'organizer') return <Navigate to="/organizer/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

// Main Layout Component to handle conditional Navbar
const MainLayout = ({ children }) => {
  const location = useLocation();
  const hideNavbarRoutes = ['/login', '/register'];
  const showNavbar = !hideNavbarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
      {showNavbar && <Navbar />}
      <main>
        {children}
      </main>
      <Toaster position="top-right" />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <MainLayout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/organizer/reset-password" element={<OrganizerResetRequest />} />

            <Route path="/events" element={<BrowseEvents />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/clubs" element={<ClubList />} />
            <Route path="/clubs/:id" element={<OrganizerProfile />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["participant"]}>
                  <ParticipantDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/onboarding"
              element={
                <ProtectedRoute allowedRoles={["participant"]}>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/organizer/dashboard"
              element={
                <ProtectedRoute allowedRoles={["organizer"]}>
                  <OrganizerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/organizer/create-event"
              element={
                <ProtectedRoute allowedRoles={["organizer"]}>
                  <CreateEvent />
                </ProtectedRoute>
              }
            />

            <Route
              path="/organizer/event/:id"
              element={
                <ProtectedRoute allowedRoles={["organizer"]}>
                  <OrganizerEventDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={["participant", "organizer", "admin"]}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </Router>
    </AuthProvider>
  );
}

export default App;