import apiClient from './client.js';

export const dashboardApi = {
  getSummary: async () => {
    return apiClient.get('/dashboard/summary');
  },
};

export const reportApi = {
  getConsiderations: async (params = {}) => {
    return apiClient.get('/reports/considerations', { params });
  },

  getLeaves: async (params = {}) => {
    return apiClient.get('/reports/leaves', { params });
  },

  getAudit: async (params = {}) => {
    return apiClient.get('/audit', { params });
  },

  downloadConsiderationsExcel: async (params = {}) => {
    const res = await apiClient.get('/reports/considerations/export', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `considerations_report_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadLeavesExcel: async (params = {}) => {
    const res = await apiClient.get('/reports/leaves/export', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leaves_report_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getExportConsiderationsUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `/api/v1/reports/considerations/export?${query}`;
  },

  getExportLeavesUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `/api/v1/reports/leaves/export?${query}`;
  },
};

export const mentorshipApi = {
  getMyCohort: async () => {
    return apiClient.get('/mentor-groups/mine');
  },

  listGroups: async (params = {}) => {
    return apiClient.get('/mentor-groups', { params });
  },

  createGroup: async (data) => {
    return apiClient.post('/mentor-groups', data);
  },

  updateStudents: async (groupId, data) => {
    return apiClient.put(`/mentor-groups/${groupId}/students`, data);
  },

  deleteGroup: async (groupId) => {
    return apiClient.delete(`/mentor-groups/${groupId}`);
  },
};

export const masterDataApi = {
  getStudents: async (params = {}) => {
    return apiClient.get('/students', { params });
  },

  getStudentById: async (id) => {
    return apiClient.get(`/students/${id}`);
  },

  updateStudent: async (id, data) => {
    return apiClient.patch(`/students/${id}`, data);
  },

  deleteStudent: async (id) => {
    return apiClient.delete(`/students/${id}`);
  },

  getTeachers: async (params = {}) => {
    return apiClient.get('/teachers', { params });
  },

  updateTeacher: async (id, data) => {
    return apiClient.patch(`/teachers/${id}`, data);
  },

  getSections: async (params = {}) => {
    return apiClient.get('/sections', { params });
  },

  createSection: async (data) => {
    return apiClient.post('/sections', data);
  },

  getUsers: async (params = {}) => {
    return apiClient.get('/users', { params });
  },

  createUser: async (data) => {
    return apiClient.post('/users', data);
  },

  updateUser: async (id, data) => {
    return apiClient.patch(`/users/${id}`, data);
  },

  resetPassword: async (id, password) => {
    return apiClient.post(`/users/${id}/reset-password`, { password });
  },

  updateUserStatus: async (id, isActive) => {
    return apiClient.patch(`/users/${id}/status`, { isActive });
  },

  importStudents: async (formData) => {
    return apiClient.post('/import/students', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  importTeachers: async (formData) => {
    return apiClient.post('/import/teachers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getTemplateUrl: (type) => `/api/v1/import/template/${type}`,

  downloadTemplate: async (type) => {
    const res = await apiClient.get(`/import/template/${type}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}_import_template.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export const uploadApi = {
  getAuth: async () => {
    return apiClient.get('/uploads/auth');
  },

  verify: async (fileId) => {
    return apiClient.post('/uploads/verify', { fileId });
  },

  getSignedUrl: async (fileId) => {
    return apiClient.get('/uploads/signed-url', { params: { fileId } });
  },

  deleteFile: async (fileId) => {
    return apiClient.delete(`/uploads/${fileId}`);
  },
};

export const notificationApi = {
  getNotifications: async (params = {}) => {
    return apiClient.get('/notifications', { params });
  },

  markAsRead: async (id) => {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    return apiClient.patch('/notifications/read-all');
  },
};

export default {
  dashboardApi,
  reportApi,
  mentorshipApi,
  masterDataApi,
  uploadApi,
  notificationApi,
};
