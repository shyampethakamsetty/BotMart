import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import api, { endpoints } from './api';

// Check if code is running in browser
const isBrowser = typeof window !== 'undefined';

// Function to get token from localStorage
export const getToken = (): string | null => {
  if (!isBrowser) return null;
  return localStorage.getItem('token');
};

// Function to set token in localStorage
export const setToken = (token: string): void => {
  if (!isBrowser) return;
  localStorage.setItem('token', token);
};

// Function to remove token from localStorage
export const removeToken = (): void => {
  if (!isBrowser) return;
  localStorage.removeItem('token');
};

// Function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (!isBrowser) return false;
  return !!getToken();
};

// Hook to protect routes
export const useAuth = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Skip auth check for login page
    if (router.pathname === '/login') {
      setLoading(false);
      return;
    }

    // Check if user is authenticated
    const token = getToken();
    if (!token) {
      router.push('/login');
    } else {
      setAuthenticated(true);
    }
    
    setLoading(false);
  }, [router]);

  return { loading, authenticated };
};

// Function to handle login
export const login = async (email: string, password: string): Promise<string> => {
  try {
    const response = await api.post(endpoints.login, { email, password });
    const { access_token } = response.data;
    setToken(access_token);
    return access_token;
  } catch (error) {
    throw error;
  }
};

// Function to handle logout
export const logout = async (): Promise<void> => {
  try {
    // Call logout endpoint if needed
    // await api.post(endpoints.logout);
    removeToken();
  } catch (error) {
    console.error('Logout error:', error);
    // Still remove token even if API call fails
    removeToken();
  }
};