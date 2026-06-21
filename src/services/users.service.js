import api from '../lib/api';

export const usersService = {
  // Admin: get all users (we query via a custom admin endpoint or use existing ones)
  getAll: async ({ page = 1, limit = 20, search = '', role = '' } = {}) => {
    const params = { page, limit };
    if (search) params.search = search;
    if (role) params.role = role;
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/admin/users/${id}`);
    return res.data;
  },

  updateRole: async (id, role) => {
    const res = await api.patch(`/admin/users/${id}/role`, { role });
    return res.data;
  },

  deleteUser: async (id) => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },

  getUserHealth: async (id) => {
    const res = await api.get(`/admin/users/${id}/health`);
    return res.data;
  },

  getUserGamification: async (id) => {
    const res = await api.get(`/admin/users/${id}/gamification`);
    return res.data;
  },

  getUserAchievements: async (id) => {
    const res = await api.get(`/admin/users/${id}/achievements`);
    return res.data;
  },

  getUserOrders: async (id) => {
    const res = await api.get(`/admin/users/${id}/orders`);
    return res.data;
  },
};
