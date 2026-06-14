import api from '../lib/api';

export const uploadService = {
  /**
   * Uploads a single image file to the backend (→ S3).
   * @param {File} file
   * @param {'products'|'blogs'|'misc'} folder
   * @returns {Promise<string>} public URL
   */
  uploadImage: async (file, folder = 'misc') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    const res = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data?.url;
  },
};
