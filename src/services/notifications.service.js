import api from '../lib/api';

export const notificationsService = {
  send: async (data) => {
    const res = await api.post('/notification/send', data);
    return res.data;
  },
  getScreens: async () => {
    const res = await api.get('/notification/screens');
    return res.data;
  },
  getTargets: async () => {
    const res = await api.get('/notification/targets');
    return res.data;
  },
};
