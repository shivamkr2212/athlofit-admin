import api from '../lib/api';

export const blogService = {
  list: async ({ page = 1, limit = 20, status = '' } = {}) => {
    const params = { page, limit };
    if (status) params.status = status;
    const res = await api.get('/blog/admin/all', { params });
    return res.data;
  },
  get: async (id) => {
    const res = await api.get(`/blog/admin/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/blog/admin', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/blog/admin/${id}`, data);
    return res.data;
  },
  remove: async (id) => {
    const res = await api.delete(`/blog/admin/${id}`);
    return res.data;
  },
};
