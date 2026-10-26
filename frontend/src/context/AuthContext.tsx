import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization } from '../types';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  loading: boolean;
  login: (email_or_username: string, pass: string) => Promise<void>;
  quickLogin: (email: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('apex_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        setUser(res.user);
        setOrganization(res.organization);
        localStorage.setItem('apex_user', JSON.stringify(res.user));

        const socket = getSocket();
        socket.emit('authenticate', { user_id: res.user.id });
      } catch (err) {
        console.error('Failed to authenticate session:', err);
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadUser();

    const handleUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [token]);

  const login = async (email_or_username: string, pass: string) => {
    const res = await api.login(email_or_username, pass);
    localStorage.setItem('apex_token', res.token);
    localStorage.setItem('apex_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);

    const socket = getSocket();
    socket.emit('authenticate', { user_id: res.user.id });
  };

  const quickLogin = async (email: string) => {
    return login(email, 'Admin@12345');
  };

  const logout = () => {
    localStorage.removeItem('apex_token');
    localStorage.removeItem('apex_user');
    setToken(null);
    setUser(null);
    setOrganization(null);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('apex_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, organization, token, loading, login, quickLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
