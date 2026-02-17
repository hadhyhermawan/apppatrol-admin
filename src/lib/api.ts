import axios from 'axios';

// Get base API URL (default to localhost if empty)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor for API responses
apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        // If user is unauthorized, logout and clear session
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('patrol_token');
                localStorage.removeItem('patrol_user');
            }
        }
        return Promise.reject(error);
    }
);

// Interceptor for request headers (attach token)
apiClient.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('patrol_token');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default apiClient;
