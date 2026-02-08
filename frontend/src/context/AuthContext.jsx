import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            // Support both persistent (localStorage) and session (sessionStorage) tokens
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

            if (token && storedUser) {
                // Restore state from storage
                setUser(JSON.parse(storedUser));

                // Configure axios default header
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            setLoading(false);
        };

        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });

            // Always use localStorage for persistence
            localStorage.setItem('token', data.token);

            // Store minimal user info
            const userData = {
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role
            };
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            // Ensure axios default header set
            api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const registerParticipant = async (formData) => {
        try {
            const { data } = await api.post('/auth/register', formData);
            // Auto login after register
            // Default to persistent session for registration (user expects logged-in state)
            localStorage.setItem('token', data.token);
            const userData = {
                _id: data._id,
                name: data.name,
                email: data.email,
                role: data.role
            };
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        // Clear both storages to ensure logout regardless of remember-me
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setUser(null);
        // Clear global header if set
        delete api.defaults.headers.common['Authorization'];
    };

    const value = {
        user,
        loading,
        login,
        registerParticipant,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
