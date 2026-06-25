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

  // Edit account fields: name, emailVerified, phoneVerified, dailyStepGoal
  updateAccount: async (id, data) => {
    const res = await api.patch(`/admin/users/${id}`, data);
    return res.data;
  },

  // Manually credit (+) or debit (−) a user's coins
  adjustCoins: async (id, amount, reason) => {
    const res = await api.post(`/admin/users/${id}/coins`, { amount, reason });
    return res.data;
  },

  resetStreak: async (id) => {
    const res = await api.post(`/admin/users/${id}/reset-streak`);
    return res.data;
  },

  ban: async (id, reason) => {
    const res = await api.post(`/admin/users/${id}/ban`, { reason });
    return res.data;
  },

  unban: async (id, reason) => {
    const res = await api.post(`/admin/users/${id}/unban`, { reason });
    return res.data;
  },

  getSessions: async (id) => {
    const res = await api.get(`/admin/users/${id}/sessions`);
    return res.data;
  },

  revokeSession: async (id, sessionId) => {
    const res = await api.delete(`/admin/users/${id}/sessions/${sessionId}`);
    return res.data;
  },

  revokeAllSessions: async (id, reason) => {
    const res = await api.post(`/admin/users/${id}/sessions/revoke-all`, { reason });
    return res.data;
  },

  getActionLog: async (id) => {
    const res = await api.get(`/admin/users/${id}/action-log`);
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

  // Steps & coins analytics by period: daily | weekly | monthly | custom
  getUserAnalytics: async (id, { period = 'daily', from, to } = {}) => {
    const params = { period };
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get(`/admin/users/${id}/analytics`, { params });
    return res.data;
  },

  // AI performance analysis (streaks, achievements, suggestions)
  getAIAnalysis: async (id) => {
    const res = await api.post(`/admin/users/${id}/ai-analysis`);
    return res.data;
  },

  // AI ecommerce product recommendations for the user
  getAIRecommendations: async (id) => {
    const res = await api.post(`/admin/users/${id}/ai-recommendations`);
    return res.data;
  },
};
