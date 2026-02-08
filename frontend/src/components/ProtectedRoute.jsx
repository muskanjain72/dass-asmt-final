import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// allowedRoles: array of roles that can access the route
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, loading } = useAuth();

    // while auth state initializes, don't render anything
    if (loading) return null;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If allowedRoles provided, check user's role
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Optionally redirect to home or a 403 page
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
