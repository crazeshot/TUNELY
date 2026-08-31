import { useState, useEffect, useCallback } from 'react';
import { AuthCtx } from './AuthContextInstance';
import { api } from '../services/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    is_guest: true,
    username: 'Guest Audiophile',
    display_name: 'Alex Morgan',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    bio: 'Streaming on Tunely',
    total_minutes_listened: 1420,
  });
  const [token, setToken] = useState(() => localStorage.getItem('tunely_auth_token'));
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('tunely_auth_token'));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWrappedOpen, setIsWrappedOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [authError, setAuthError] = useState(null);

  const openAuth = useCallback((tab = 'login') => {
    setAuthTab(tab);
    setAuthError(null);
    setIsAuthModalOpen(true);
  }, []);

  const openLogin = useCallback(() => {
    openAuth('login');
  }, [openAuth]);

  const openRegister = useCallback(() => {
    openAuth('register');
  }, [openAuth]);

  // Load user profile on mount or token change
  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      if (token) {
        try {
          const profile = await api.getMe();
          if (isMounted && profile) {
            setUser(profile.user || profile);
            setIsLoggedIn(true);
          }
        } catch {
          if (isMounted) {
            setIsLoggedIn(false);
            setToken(null);
          }
        }
      }
    }
    loadUser();
    return () => { isMounted = false; };
  }, [token]);

  const login = useCallback(async (username, password) => {
    setAuthError(null);
    try {
      const data = await api.login(username, password);
      setToken(data.token);
      setUser(data.user);
      setIsLoggedIn(true);
      setIsAuthModalOpen(false);
      return data;
    } catch (err) {
      setAuthError(err.message || 'Login failed');
      throw err;
    }
  }, []);

  const register = useCallback(async ({ username, email, password, display_name }) => {
    setAuthError(null);
    try {
      const data = await api.register({ username, email, password, display_name });
      setToken(data.token);
      setUser(data.user);
      setIsLoggedIn(true);
      setIsAuthModalOpen(false);
      return data;
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setToken(null);
    setIsLoggedIn(false);
    setUser({
      is_guest: true,
      username: 'Guest',
      display_name: 'Guest',
      avatar_url: '',
      bio: 'Streaming on Tunely Guest Mode',
      total_minutes_listened: 0,
    });
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    const updated = await api.updateProfile(profileData);
    if (updated) {
      setUser(updated);
    }
    return updated;
  }, []);

  const value = {
    user,
    token,
    isLoggedIn,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authTab,
    setAuthTab,
    openAuth,
    openLogin,
    openRegister,
    isWrappedOpen,
    setIsWrappedOpen,
    authError,
    setAuthError,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
