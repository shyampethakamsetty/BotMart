import axios from 'axios';

// Create a custom axios instance with default config
const api = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const endpoints = {
  // Auth
  login: '/auth/login',
  logout: '/auth/logout',
  
  // Workflows
  runWorkflow: '/workflows/run',
  getWorkflows: '/workflows',
  getWorkflowById: (id: string) => `/workflows/${id}`,
  getWorkflowSummary: '/workflows/summary',
  getRecentWorkflows: '/workflows/recent',
  
  // User
  getUserSettings: '/user/settings',
  updateUserSettings: '/user/settings',
};