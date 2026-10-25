import api from '../lib/api';

export const dashboardService = {
  getStats: async () => {
    const res = await api.get('/admin/dashboard/stats');
    return res.data;
  },

  // How many users crossed 10k / 15k / 20k steps on their BEST SINGLE DAY in
  // the window. window: 'today' | '7d' | '30d'.
  getStepMilestones: async (window = 'today') => {
    const res = await api.get('/admin/dashboard/step-milestones', { params: { window } });
    return res.data;
  },

  // Who is behind one of those counts, with the day that qualified them.
  getStepMilestoneUsers: async (threshold, window = 'today') => {
    const res = await api.get('/admin/dashboard/step-milestones/users', {
      params: { threshold, window },
    });
    return res.data;
  },

  // Signups, orders and platform split — real aggregates. These three charts
  // were hardcoded sample data until this endpoint existed.
  getCharts: async () => {
    const res = await api.get('/admin/dashboard/charts');
    return res.data;
  },
};
