import api from '../lib/api';

export const dashboardService = {
  getStats: async () => {
    const res = await api.get('/admin/dashboard/stats');
    return res.data;
  },
};
