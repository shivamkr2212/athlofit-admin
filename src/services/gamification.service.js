import api from '../lib/api';

export const gamificationService = {
  getLeaderboard: async () => {
    const res = await api.get('/gamification/leaderboard');
    return res.data;
  },

  // Badges
  getBadges: async () => {
    const res = await api.get('/gamification/admin/badges');
    return res.data;
  },
  createBadge: async (data) => {
    const res = await api.post('/gamification/admin/badges', data);
    return res.data;
  },
  updateBadge: async (id, data) => {
    const res = await api.put(`/gamification/admin/badges/${id}`, data);
    return res.data;
  },
  deleteBadge: async (id) => {
    const res = await api.delete(`/gamification/admin/badges/${id}`);
    return res.data;
  },

  // Achievements
  getAchievements: async () => {
    const res = await api.get('/gamification/achievements');
    return res.data;
  },
  createAchievement: async (data) => {
    const res = await api.post('/gamification/admin/achievements', data);
    return res.data;
  },
};
