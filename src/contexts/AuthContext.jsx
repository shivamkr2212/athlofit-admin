import { createContext, useContext, useState, useCallback } from 'react';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    // Backend response shape:
    // { success: true, data: { accessToken, refreshToken, user: {...} } }
    const body = await authService.login(email, password);

    if (!body.success) throw new Error(body.message || 'Login failed');

    const { accessToken, user: userData } = body.data ?? {};

    if (!userData) throw new Error('Invalid response from server');
    if (userData.role !== 'admin') {
      throw new Error('Access denied. Admin account required.');
    }
    if (!accessToken) throw new Error('No access token received');

    localStorage.setItem('admin_token', accessToken);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // authService.logout clears localStorage in its finally block,
      // so we just need to clear state here regardless
    }
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
    toast.success('Logged out');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
