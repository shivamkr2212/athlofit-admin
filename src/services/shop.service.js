import api from '../lib/api';

export const shopService = {
  // Categories
  getCategories: async () => {
    const res = await api.get('/shop/categories');
    return res.data;
  },
  createCategory: async (data) => {
    const res = await api.post('/admin/shop/categories', data);
    return res.data;
  },
  updateCategory: async (id, data) => {
    const res = await api.put(`/admin/shop/categories/${id}`, data);
    return res.data;
  },
  deleteCategory: async (id) => {
    const res = await api.delete(`/admin/shop/categories/${id}`);
    return res.data;
  },

  // Products
  getProducts: async ({ page = 1, limit = 20, category = '', search = '', sort = 'newest' } = {}) => {
    const params = { page, limit, sort };
    if (category) params.category = category;
    if (search) params.search = search;
    const res = await api.get('/shop/products', { params });
    return res.data;
  },
  getProductById: async (id) => {
    const res = await api.get(`/shop/products/${id}`);
    return res.data;
  },
  createProduct: async (data) => {
    const res = await api.post('/admin/shop/products', data);
    return res.data;
  },
  updateProduct: async (id, data) => {
    const res = await api.put(`/admin/shop/products/${id}`, data);
    return res.data;
  },
  deleteProduct: async (id) => {
    const res = await api.delete(`/admin/shop/products/${id}`);
    return res.data;
  },

  // Orders
  getAllOrders: async ({ page = 1, limit = 20, status = '' } = {}) => {
    const params = { page, limit };
    if (status) params.status = status;
    const res = await api.get('/admin/shop/orders', { params });
    return res.data;
  },
  updateOrderStatus: async (id, status) => {
    const res = await api.patch(`/admin/shop/orders/${id}/status`, { status });
    return res.data;
  },

  // Coupons
  getCoupons: async () => {
    const res = await api.get('/admin/shop/coupons');
    return res.data;
  },
  createCoupon: async (data) => {
    const res = await api.post('/admin/shop/coupons', data);
    return res.data;
  },
  updateCoupon: async (id, data) => {
    const res = await api.put(`/admin/shop/coupons/${id}`, data);
    return res.data;
  },
  deleteCoupon: async (id) => {
    const res = await api.delete(`/admin/shop/coupons/${id}`);
    return res.data;
  },
};
