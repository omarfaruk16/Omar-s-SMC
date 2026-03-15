import axios from 'axios';

const defaultApiBaseUrl = typeof window !== 'undefined'
  ? `${window.location.origin}/api`
  : 'http://localhost:8000/api';

export const API_BASE_URL = process.env.REACT_APP_API_URL || defaultApiBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
});

let sessionExpiredEmitted = false;

const isHtmlString = (value) => (
  typeof value === 'string' && /<\/?[a-z][\s\S]*>/i.test(value)
);

export const extractApiErrorMessage = (error, fallback = 'Request failed. Please try again.') => {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string') {
    if (isHtmlString(responseData)) {
      const statusCode = error?.response?.status;
      return statusCode ? `Server error (${statusCode}). Please try again.` : fallback;
    }
    return responseData;
  }

  if (responseData && typeof responseData === 'object') {
    if (responseData.detail) return String(responseData.detail);
    if (responseData.message) return String(responseData.message);
    if (responseData.error) return String(responseData.error);

    const firstKey = Object.keys(responseData)[0];
    if (firstKey) {
      const value = responseData[firstKey];
      if (Array.isArray(value) && value.length > 0) return String(value[0]);
      if (typeof value === 'string') return value;
    }
  }

  if (typeof error?.message === 'string' && error.message) {
    return error.message;
  }

  return fallback;
};

export const normalizeErrorPayloadForUi = (error) => {
  const message = extractApiErrorMessage(error);

  if (error?.response && isHtmlString(error.response.data || '')) {
    error.response.data = { detail: message };
  }

  return { message, type: 'error', ttl: 4000 };
};

const emitAppToast = (message, type = 'error', ttl = 4000) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type, ttl } }));
};

const emitSessionExpired = () => {
  if (typeof window === 'undefined' || sessionExpiredEmitted) return;
  sessionExpiredEmitted = true;
  window.dispatchEvent(new CustomEvent('app:session-expired'));
};

export const resetSessionExpiredState = () => {
  sessionExpiredEmitted = false;
};

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

    const requestUrl = originalRequest?.url || '';
    const isAuthRequest = requestUrl.includes('/auth/login/') || requestUrl.includes('/auth/refresh/');
    const method = (originalRequest?.method || 'get').toLowerCase();
    const isMutatingRequest = ['post', 'put', 'patch', 'delete'].includes(method);

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          emitSessionExpired();
          emitAppToast('Session expired. Please log in again.');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);
        resetSessionExpiredState();

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axios(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        emitSessionExpired();
        emitAppToast('Session expired. Please log in again.');
        if (!isAuthRequest) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    if (isMutatingRequest && !isAuthRequest) {
      const normalizedError = normalizeErrorPayloadForUi(error);
      emitAppToast(normalizedError.message, normalizedError.type, normalizedError.ttl);
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
  getById: (id) => api.get(`/classes/${id}/`),
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
  getStudentInfo: () => api.get('/admissions/student-info/'),
  downloadSubmission: (params = {}) => api.get('/admissions/submissions/download/', { params, responseType: 'blob' }),
  getSubmissions: () => api.get('/admissions/submissions/'),
  downloadSubmissionById: (id) => api.get(`/admissions/submissions/${id}/download/`, { responseType: 'blob' }),
};

// Teachers APIs
export const teacherAPI = {
  getAll: () => api.get('/users/teachers/'),
  getById: (id) => api.get(`/users/teachers/${id}/`),
  getPending: () => api.get('/users/teachers/pending/'),
  approve: (id) => api.post(`/users/teachers/${id}/approve/`),
  reject: (id) => api.post(`/users/teachers/${id}/reject/`),
  assignClasses: (id, class_ids) =>
    api.post(`/users/teachers/${id}/assign_classes/`, { class_ids }),
  update: (id, data) => api.patch(`/users/teachers/${id}/`, data),
  delete: (id) => api.delete(`/users/teachers/${id}/`),
  toggleStatus: (id, status) => api.post(`/users/teachers/${id}/toggle_status/`, { status }),
};

// Students APIs
export const studentAPI = {
  getAll: () => api.get('/users/students/'),
  getById: (id) => api.get(`/users/students/${id}/`),
  getPending: () => api.get('/users/students/pending/'),
  approve: (id) => api.post(`/users/students/${id}/approve/`),
  reject: (id) => api.post(`/users/students/${id}/reject/`),
  suspend: (id) => api.post(`/users/students/${id}/suspend/`),
  changeClass: (id, class_id) =>
    api.post(`/users/students/${id}/change_class/`, { class_id }),
  updateRoll: (id, roll_number) => api.patch(`/users/students/${id}/update_roll/`, { roll_number }),
  update: (id, data) => api.patch(`/users/students/${id}/`, data),
  delete: (id) => api.delete(`/users/students/${id}/`),
  getByClass: (class_id) => api.get('/users/students/by_class/', { params: { class_id } }),
  toggleStatus: (id, status) => api.post(`/users/students/${id}/toggle_status/`, { status }),
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
  getById: (id) => api.get(`/academics/subjects/${id}/`),
  create: (data) => api.post('/academics/subjects/', data),
  update: (id, data) => api.put(`/academics/subjects/${id}/`, data),
  delete: (id) => api.delete(`/academics/subjects/${id}/`),
};

// Attendance APIs
export const attendanceAPI = {
  getAll: (params = {}) => api.get('/academics/attendance/', { params }),
  mark: (class_id, date, present_ids, subject_id) => api.post('/academics/attendance/mark/', { class_id, date, present_ids, subject_id }),
};

// Testimonial APIs
export const testimonialAPI = {
  getAll: () => api.get('/testimonials/'),
  initSslcommerz: (data = {}) => api.post('/testimonials/sslcommerz/init/', data),
  download: (id) => api.get(`/testimonials/${id}/download/`, { responseType: 'blob' }),
  approve: (id, data) => api.post(`/testimonials/${id}/approve/`, data),
  reject: (id, data) => api.post(`/testimonials/${id}/reject/`, data),
  delete: (id) => api.delete(`/testimonials/${id}/`),
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
  downloadMarksheet: (params = {}) => api.get('/academics/marks/marksheet/', { params, responseType: 'blob' }),
};

// Exams APIs
export const examAPI = {
  getAll: (params = {}) => api.get('/academics/exams/', { params }),
  create: (data) => api.post('/academics/exams/', data),
  update: (id, data) => api.put(`/academics/exams/${id}/`, data),
  delete: (id) => api.delete(`/academics/exams/${id}/`),
  publish: (id) => api.post(`/academics/exams/${id}/publish/`),
  publishResult: (id) => api.post(`/academics/exams/${id}/publish_result/`),
  downloadAdmitCard: (id) =>
    api.get(`/academics/exams/${id}/download_admit_card/`, {
      responseType: 'blob',
    }),
  downloadRoutine: (id) =>
    api.get(`/academics/exams/${id}/download_routine/`, { responseType: 'blob' }),
};

// Notification APIs
export const notificationAPI = {
  getPushConfig: () => api.get('/notifications/push-config/'),
  registerPushSubscription: (data) => api.post('/notifications/push-subscriptions/', data),
  unregisterPushSubscription: (data) => api.post('/notifications/push-subscriptions/unregister/', data),
};

// Result Submission APIs
export const resultSubmissionAPI = {
  getAll: (params = {}) => api.get('/academics/results/', { params }),
  submit: (data) => api.post('/academics/results/submit/', data),
  publish: (id) => api.post(`/academics/results/${id}/publish/`),
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
