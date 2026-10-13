import apiClient, { setAuthToken, clearAuthToken } from './client.js';

export const authApi = {
  login: async ({ email, password }) => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res?.data?.accessToken) {
      setAuthToken(res.data.accessToken);
    }
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearAuthToken();
    }
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const res = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return res.data;
  },

  registerStudent: async (data) => {
    const res = await apiClient.post('/auth/register/student', data);
    return res.data;
  },

  registerTeacher: async (data) => {
    const res = await apiClient.post('/auth/register/teacher', data);
    return res.data;
  },
};

export default authApi;
