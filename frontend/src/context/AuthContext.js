import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, notificationAPI } from '../services/api';
import {
  getActiveSubscription,
  getOrCreateSubscription,
  getPushPermission,
  isPushSupported,
} from '../utils/pushNotifications';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'teacher') return;
    if (!isPushSupported()) return;
    if (getPushPermission() !== 'granted') return;

    let cancelled = false;
    (async () => {
      try {
        const config = await notificationAPI.getPushConfig();
        const publicKey = config.data?.publicKey;
        if (!publicKey) return;
        const subscription = await getOrCreateSubscription(publicKey);
        if (!subscription || cancelled) return;
        await notificationAPI.registerPushSubscription({
          endpoint: subscription.endpoint,
          keys: subscription.toJSON().keys,
          user_agent: navigator.userAgent,
        });
      } catch (error) {
        console.error('Push registration failed:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { access, refresh, user: userData } = response.data;

      // Store tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  };

  const logout = async () => {
    if (user?.role === 'teacher' && isPushSupported()) {
      try {
        const subscription = await getActiveSubscription();
        if (subscription) {
          await notificationAPI.unregisterPushSubscription({ endpoint: subscription.endpoint });
          await subscription.unsubscribe();
        }
      } catch (error) {
        console.error('Push unsubscribe failed:', error);
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const registerTeacher = async (data) => {
    try {
      const response = await authAPI.registerTeacher(data);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || 'Registration failed' 
      };
    }
  };

  const registerStudent = async (data) => {
    try {
      const response = await authAPI.registerStudent(data);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || 'Registration failed' 
      };
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      const userData = response.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || 'Update failed' 
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    registerTeacher,
    registerStudent,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
    isPending: user?.status === 'pending',
    isApproved: user?.status === 'approved',
    isRejected: user?.status === 'rejected',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
