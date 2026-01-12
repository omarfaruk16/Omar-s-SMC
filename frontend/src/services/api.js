import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If payload is FormData, let browser set multipart boundaries
    if (config.data instanceof FormData) {
      if (config.headers && config.headers['Content-Type']) {
        delete config.headers['Content-Type'];
      }
    } else {
      // Default to JSON for plain objects
      config.headers = config.headers || {};
      config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    try {
      // Unwrap DRF pagination for GET list endpoints
      if (
        (response.config?.method || '').toLowerCase() === 'get' &&
        response.data &&
        typeof response.data === 'object' &&
        Array.isArray(response.data.results)
      ) {
        const { results, count, next, previous } = response.data;
        // Preserve pagination meta for optional use
        const wrapped = { ...response, data: results };
        wrapped.pagination = { count, next, previous };
        return wrapped;
      }
    } catch (_) {}
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axios(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login/', { email, password }),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password/', { email }),

  verifyOtp: (email, otp) =>
    api.post('/auth/verify-otp/', { email, otp }),

  resetPassword: (email, resetToken, newPassword, newPasswordConfirm) =>
    api.post('/auth/reset-password/', {
      email,
      reset_token: resetToken,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    }),
  
  registerTeacher: (data) =>
    api.post('/users/register/teacher/', data),
  
  registerStudent: (data) =>
    api.post('/users/register/student/', data),
  
  getProfile: () =>
    api.get('/users/profile/'),
  
  updateProfile: (data) =>
    api.patch('/users/profile/', data),

  changePassword: (data) =>
    api.post('/users/change-password/', data),
};

// Classes APIs
export const classAPI = {
  getAll: () => api.get('/classes/'),
  getOne: (id) => api.get(`/classes/${id}/`),
  create: (data) => api.post('/classes/', data),
  update: (id, data) => api.put(`/classes/${id}/`, data),
  delete: (id) => api.delete(`/classes/${id}/`),
};

// Notices APIs
export const noticeAPI = {
  getAll: () => api.get('/notices/'),
  getOne: (id) => api.get(`/notices/${id}/`),
  create: (data) => api.post('/notices/', data),
  update: (id, data) => api.put(`/notices/${id}/`, data),
  delete: (id) => api.delete(`/notices/${id}/`),
};

// Results APIs
export const resultAPI = {
  getAll: () => api.get('/results/'),
  getOne: (id) => api.get(`/results/${id}/`),
  create: (data) => api.post('/results/', data),
  update: (id, data) => api.put(`/results/${id}/`, data),
  delete: (id) => api.delete(`/results/${id}/`),
};

// Materials APIs
export const materialAPI = {
  getAll: () => api.get('/materials/'),
  getOne: (id) => api.get(`/materials/${id}/`),
  create: (data) => api.post('/materials/', data),
  update: (id, data) => api.put(`/materials/${id}/`, data),
  delete: (id) => api.delete(`/materials/${id}/`),
  addAttachment: (id, data) => api.post(`/materials/${id}/add-attachment/`, data),
  removeAttachment: (id, attachmentId) => api.delete(`/materials/${id}/remove-attachment/${attachmentId}/`),
};

// Admission Forms APIs
export const admissionAPI = {
  getDefaultTemplate: () => api.get('/admissions/templates/default/'),
  listTemplates: () => api.get('/admissions/templates/'),
  getTemplate: (slug) => api.get(`/admissions/templates/${slug}/`),
  updateTemplate: (slug, data, config = {}) => api.patch(`/admissions/templates/${slug}/`, data, config),
  createTemplate: (data, config = {}) => api.post('/admissions/templates/', data, config),
  deleteTemplate: (slug) => api.delete(`/admissions/templates/${slug}/`),
  getAvailableFields: () => api.get('/admissions/templates/available-fields/'),
  downloadStudentForm: (slug, studentId) => api.get(`/admissions/templates/${slug}/students/${studentId}/filled/`, { responseType: 'blob' }),
  initAdmissionPayment: (data) => api.post('/admissions/sslcommerz/init/', data),
  downloadSubmission: (params = {}) => api.get('/admissions/submissions/download/', { params, responseType: 'blob' }),
  getSubmissions: () => api.get('/admissions/submissions/'),
  downloadSubmissionById: (id) => api.get(`/admissions/submissions/${id}/download/`, { responseType: 'blob' }),
};

// Teachers APIs
export const teacherAPI = {
  getAll: () => api.get('/users/teachers/'),
  getPending: () => api.get('/users/teachers/pending/'),
  approve: (id) => api.post(`/users/teachers/${id}/approve/`),
  reject: (id) => api.post(`/users/teachers/${id}/reject/`),
  assignClasses: (id, class_ids) =>
    api.post(`/users/teachers/${id}/assign_classes/`, { class_ids }),
  delete: (id) => api.delete(`/users/teachers/${id}/`),
};

// Students APIs
export const studentAPI = {
  getAll: () => api.get('/users/students/'),
  getPending: () => api.get('/users/students/pending/'),
  approve: (id) => api.post(`/users/students/${id}/approve/`),
  reject: (id) => api.post(`/users/students/${id}/reject/`),
  changeClass: (id, class_id) =>
    api.post(`/users/students/${id}/change_class/`, { class_id }),
  delete: (id) => api.delete(`/users/students/${id}/`),
  getByClass: (class_id) => api.get('/users/students/by_class/', { params: { class_id } }),
};

// Fees APIs
export const feeAPI = {
  getAll: () => api.get('/fees/'),
  getMyFees: () => api.get('/fees/my_fees/'),
  getOne: (id) => api.get(`/fees/${id}/`),
  getStudents: (id) => api.get(`/fees/${id}/students/`),
  create: (data) => api.post('/fees/', data),
  update: (id, data) => api.put(`/fees/${id}/`, data),
  delete: (id) => api.delete(`/fees/${id}/`),
};

// Payments APIs
export const paymentAPI = {
  getAll: () => api.get('/payments/'),
  getPending: () => api.get('/payments/pending/'),
  create: (data) => api.post('/payments/', data),
  initSslcommerz: (data) => api.post('/payments/sslcommerz/init/', data),
  approve: (id) => api.post(`/payments/${id}/approve/`),
  reject: (id, notes) => api.post(`/payments/${id}/reject/`, { notes }),
};

export default api;
// Public APIs
export const publicAPI = {
  getApprovedTeachers: () => api.get('/public/teachers/'),
};

// Subjects APIs
export const subjectAPI = {
  getAll: () => api.get('/academics/subjects/'),
  create: (data) => api.post('/academics/subjects/', data),
  update: (id, data) => api.put(`/academics/subjects/${id}/`, data),
  delete: (id) => api.delete(`/academics/subjects/${id}/`),
};

// Attendance APIs
export const attendanceAPI = {
  getAll: (params = {}) => api.get('/academics/attendance/', { params }),
  mark: (class_id, date, present_ids, subject_id) => api.post('/academics/attendance/mark/', { class_id, date, present_ids, subject_id }),
};

// Transcript APIs
export const transcriptAPI = {
  getAll: () => api.get('/transcripts/'),
  initSslcommerz: (data = {}) => api.post('/transcripts/sslcommerz/init/', data),
  approve: (id, notes = '') => api.post(`/transcripts/${id}/approve/`, { notes }),
  reject: (id, notes = '') => api.post(`/transcripts/${id}/reject/`, { notes }),
};

// Timetable APIs
export const timetableAPI = {
  getAll: (params = {}) => api.get('/academics/timetable/', { params }),
  create: (data) => api.post('/academics/timetable/', data),
  update: (id, data) => api.put(`/academics/timetable/${id}/`, data),
  patch: (id, data) => api.patch(`/academics/timetable/${id}/`, data),
  delete: (id) => api.delete(`/academics/timetable/${id}/`),
};

// Marks APIs
export const markAPI = {
  getAll: (params = {}) => api.get('/academics/marks/', { params }),
  create: (data) => api.post('/academics/marks/', data),
  update: (id, data) => api.put(`/academics/marks/${id}/`, data),
  delete: (id) => api.delete(`/academics/marks/${id}/`),
  publish: (id) => api.post(`/academics/marks/${id}/publish/`),
};

// Exams APIs
export const examAPI = {
  getAll: (params = {}) => api.get('/academics/exams/', { params }),
  create: (data) => api.post('/academics/exams/', data),
  update: (id, data) => api.put(`/academics/exams/${id}/`, data),
  delete: (id) => api.delete(`/academics/exams/${id}/`),
  publish: (id) => api.post(`/academics/exams/${id}/publish/`),
  unpublish: (id) => api.post(`/academics/exams/${id}/unpublish/`),
  downloadAdmitCard: (exam_title, class_id) =>
    api.get('/academics/exams/admit-card/', {
      params: { exam_title, class_id },
      responseType: 'blob',
    }),
};

// Teacher Subject Assignment APIs
export const teacherAssignmentAPI = {
  getAll: (params = {}) => api.get('/academics/teacher-assignments/', { params }),
  getByTeacher: (teacherId) => api.get('/academics/teacher-assignments/', { params: { teacher_id: teacherId } }),
  create: (data) => api.post('/academics/teacher-assignments/', data),
  bulkAssign: (teacherId, assignments) => api.post('/academics/teacher-assignments/bulk-assign/', { teacher_id: teacherId, assignments }),
  update: (id, data) => api.put(`/academics/teacher-assignments/${id}/`, data),
  delete: (id) => api.delete(`/academics/teacher-assignments/${id}/`),
};
