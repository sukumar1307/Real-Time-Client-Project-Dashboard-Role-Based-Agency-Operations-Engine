import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setAccessToken, getAccessToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const updateToken = (token: string | null) => {
    setAccessToken(token);
    setAccessTokenState(token);
  };

  const refreshAuth = async (): Promise<boolean> => {
    try {
      const res = await api.post('/auth/refresh');
      const { accessToken: newToken, user: userData } = res.data.data;
      updateToken(newToken);
      setUser(userData);
      return true;
    } catch (err) {
      updateToken(null);
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await refreshAuth();
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken: token, user: userData } = res.data.data;
    updateToken(token);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed on backend:', err);
    } finally {
      updateToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
