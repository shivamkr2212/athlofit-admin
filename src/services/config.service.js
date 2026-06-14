import api from '../lib/api';

export const configService = {
  getAppConfig: async () => {
    const res = await api.get('/config/app');
    return res.data;
  },
  updateAppConfig: async (data) => {
    const res = await api.patch('/config/app', data);
    return res.data;
  },

  getTerms: async () => {
    const res = await api.get('/config/terms');
    return res.data;
  },
  updateTerms: async (data) => {
    const res = await api.put('/config/terms', data);
    return res.data;
  },

  getPrivacy: async () => {
    const res = await api.get('/config/privacy');
    return res.data;
  },
  updatePrivacy: async (data) => {
    const res = await api.put('/config/privacy', data);
    return res.data;
  },

  // ── Generic legal documents (all policy types) ──────────────────────────────
  getLegalList: async () => {
    const res = await api.get('/config/legal');
    return res.data;
  },
  getLegal: async (type) => {
    const res = await api.get(`/config/legal/${type}`);
    return res.data;
  },
  updateLegal: async (type, data) => {
    const res = await api.put(`/config/legal/${type}`, data);
    return res.data;
  },

  getFaqs: async () => {
    const res = await api.get('/config/faqs');
    return res.data;
  },
  createFaq: async (data) => {
    const res = await api.post('/config/admin/faqs', data);
    return res.data;
  },
  updateFaq: async (id, data) => {
    const res = await api.put(`/config/admin/faqs/${id}`, data);
    return res.data;
  },
  deleteFaq: async (id) => {
    const res = await api.delete(`/config/admin/faqs/${id}`);
    return res.data;
  },

  getTickets: async ({ status = '', page = 1, limit = 20 } = {}) => {
    const params = { page, limit };
    if (status) params.status = status;
    const res = await api.get('/config/admin/support-tickets', { params });
    return res.data;
  },
  updateTicket: async (id, data) => {
    const res = await api.patch(`/config/admin/support-tickets/${id}`, data);
    return res.data;
  },
};
