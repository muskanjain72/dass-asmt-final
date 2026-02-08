import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './App.css';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ParticipantDashboard from './pages/ParticipantDashboard';
import BrowseEvents from './pages/BrowseEvents';
import EventDetails from './pages/EventDetails';
import ClubList from './pages/ClubList';

// Organizer & Admin
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
import AdminDashboard from './pages/AdminDashboard';
import OrganizerEventDetails from './pages/OrganizerEventDetails';
import ProfilePage from './pages/ProfilePage';
import OrganizerResetRequest from './pages/OrganizerResetRequest';
import ProtectedRoute from './components/ProtectedRoute';

// Simple placeholder for Home
const Home = () => {
  return (
    <div className="hero bg-gray-50 py-20 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Campus Events</h1>
      <p className="text-xl text-gray-600 mb-8">Discover and join amazing events happening on campus.</p>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/organizer/reset-password" element={<OrganizerResetRequest />} />

              <Route path="/events" element={<BrowseEvents />} />
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="/clubs" element={<ClubList />} />

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
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;