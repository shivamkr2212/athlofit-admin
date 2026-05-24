import api from '../lib/api';

export const challengesService = {
  getAll: async () => {
    const res = await api.get('/challenges');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/challenges', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/challenges/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/challenges/${id}`);
    return res.data;
  },
  seed: async () => {
    const res = await api.post('/challenges/seed');
    return res.data;
  },
};
