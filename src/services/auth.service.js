import api from '../lib/api';

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/admin/login', { email, password });
    return res.data;
  },
  logout: async () => {
    // Call the API first while the token is still in localStorage,
    // then clear local storage regardless of whether the call succeeds.
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
  },
};
