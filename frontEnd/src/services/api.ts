import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Only redirect on 401 if it's not a login/register request
    // and the user has a token (meaning they were logged in)
    if (error.response?.status === 401) {
      const isAuthRequest =
        error.config?.url?.includes("/auth/login") ||
        error.config?.url?.includes("/auth/register");
      const hasToken = localStorage.getItem("token");

      // Only redirect if this is not an auth request and user has a token
      // This means their token expired while they were logged in
      if (!isAuthRequest && hasToken) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Use React Router navigation instead of window.location
        // Check if we're in a React context
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  register: (name: string, email: string, password: string, role?: string, phone?: string, university_name?: string) =>
    api.post("/auth/register", { name, email, password, role, phone, university_name }),

  getMe: () => api.get("/auth/me"),

  updateProfile: (data: any) => api.put("/auth/profile", data),
};

// Programs API
export const programsAPI = {
  getAll: (params?: any) => api.get("/programs", { params }),

  getById: (id: string) => api.get(`/programs/${id}`),

  create: (data: any) => api.post("/programs", data),

  update: (id: string, data: any) => api.put(`/programs/${id}`, data),

  delete: (id: string) => api.delete(`/programs/${id}`),

  checkAvailability: (id: string) => api.get(`/programs/${id}/availability`),
};

// Applications API
export const applicationsAPI = {
  submit: (data: FormData) =>
    api.post("/applications/submit", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getAll: (params?: any) => api.get("/applications", { params }),

  getMyApplications: () => api.get("/applications/my-applications"),

  getById: (id: string) => api.get(`/applications/${id}`),

  updateStatus: (id: string, status: string, reviewNotes?: string) =>
    api.put(`/applications/${id}/status`, { status, reviewNotes }),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params?: any) => api.get("/notifications", { params }),

  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),

  markAllAsRead: () => api.put("/notifications/mark-all-read"),
};

// Advisers API
export const advisersAPI = {
  // Admin: advisers
  createAdviser: (data: any) => api.post("/advisers/advisers", data),
  listAdvisers: (params?: any) => api.get("/advisers/advisers", { params }),
  listAdviserUsers: (params?: any) => api.get("/advisers/adviser-users", { params }),
  syncAdviserUser: (data: any) => api.post("/advisers/adviser-sync", data),
  // Admin: students list for dropdowns
  listStudents: (params?: any) => api.get("/advisers/students", { params }),
  // Links
  upsertLink: (data: any) => api.post("/advisers/links", data),
  getLink: (studentId: string) => api.get(`/advisers/links/${studentId}`),

  // Messages
  sendMessage: (data: any) => api.post("/advisers/messages", data),
  sendMessageWithFiles: (form: FormData) =>
    api.post("/advisers/messages", form, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  listMessages: (studentId: string, peerId?: string) => {
    const params = peerId ? { peerId } : {};
    return api.get(`/advisers/messages/${studentId}`, { params });
  },

  // Attendance
  recordAttendance: (data: any) => api.post("/advisers/attendance", data),
  listAttendance: (studentId: string) => api.get(`/advisers/attendance/${studentId}`),
  saveInternshipDates: (data: any) => api.post("/advisers/internship-dates", data),
  getInternshipDates: (studentId: string) => api.get(`/advisers/internship-dates/${studentId}`),

  // Progress
  submitProgress: (data: any) => api.post("/advisers/progress", data),
  listProgress: (studentId: string) => api.get(`/advisers/progress/${studentId}`),

  // Evaluations
  submitEvaluation: (data: any) => api.post("/advisers/evaluations", data),
  reviewEvaluation: (id: string) => api.put(`/advisers/evaluations/${id}/review`),
  listEvaluations: (studentId: string) => api.get(`/advisers/evaluations/${studentId}`),

  // Documents
  uploadDocument: (form: FormData) =>
    api.post("/advisers/documents", form, { headers: { "Content-Type": "multipart/form-data" } }),
  listDocuments: (studentId: string) => api.get(`/advisers/documents/${studentId}`),

  // Student Management
  getAssignedStudents: () => api.get("/advisers/assigned-students"),
  getNotifications: () => api.get("/advisers/notifications"),

  // Get linked advisers for a student
  getLinkedAdvisers: (studentId: string) => {
    return api.get(`/advisers/linked-advisers/${studentId}`);
  },

  // Final Result Evaluation APIs
  getFinalEvaluation: (studentId: string) => {
    return api.get(`/advisers/final-evaluation/${studentId}`);
  },

  // Create final evaluation (mirrors progress pattern)
  createFinalEvaluation: (studentId: string, evaluationData: any) => {
    return api.post(`/advisers/final-evaluation/company-adviser/${studentId}`, evaluationData);
  },

  // Update final evaluation (mirrors progress pattern)
  updateFinalEvaluation: (studentId: string, evaluationData: any) => {
    return api.put(`/advisers/final-evaluation/company-adviser/${studentId}`, evaluationData);
  },

  // Legacy file upload methods (keep for backward compatibility)
  createFinalEvaluationWithFiles: (formData: FormData) => {
    return api.post('/advisers/final-evaluation', formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateFinalEvaluationWithFiles: (studentId: string, formData: FormData) => {
    return api.put(`/advisers/final-evaluation/${studentId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  exportFinalEvaluationPDF: (studentId: string) => {
    return api.get(`/advisers/final-evaluation/student/${studentId}/export-pdf`, {
      responseType: 'blob'
    });
  },

  downloadEvaluationAttachment: (evaluationId: string, attachmentIndex: number) => {
    return api.get(`/account-management/final-evaluations/${evaluationId}/attachments/${attachmentIndex}/download`, {
      responseType: 'arraybuffer'
    });
  },

  getFinalEvaluationsForFacultyHead: () => {
    return api.get('/advisers/final-evaluations/faculty-head');
  },

  // Get student details with populated data
  getStudentDetails: (studentId: string) => {
    return api.get(`/advisers/student-details/${studentId}`);
  },
};

// Account Management API
export const accountManagementAPI = {
  createTemporaryAccount: (data: any) => api.post("/account-management/temporary-accounts", data),
  listTemporaryAccounts: () => api.get("/account-management/temporary-accounts"),
  getStudentsForSelection: () => api.get("/account-management/students"),
  getStudentsByUniversity: async (universityName: string) => {
    const response = await api.get(`/account-management/students/university/${encodeURIComponent(universityName)}`);
    return response; // Return the full response structure
  },
  getStudentsByProgram: async (programId: string) => {
    const response = await api.get(`/account-management/students/program/${programId}`);
    return response.data;
  },
  getStudentUniversityAdvisers: async (studentId: string) => {
    const response = await api.get(`/account-management/students/${studentId}/university-advisers`);
    return response.data;
  },
  getLinkedAdvisersForStudent: (studentId: string) => api.get(`/account-management/linked-advisers/${studentId}`),
  updateProfile: (id: string, data: any) => api.put(`/account-management/profile/${id}`, data),
  unlockAccount: (email: string) => api.post("/account-management/unlock-account", { email }),
  getFacultyHeadsByStudent: (studentId: string) => api.get(`/account-management/faculty-heads/student/${studentId}`),
  submitFinalEvaluation: (data: FormData) => api.post("/account-management/final-evaluations", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  getFinalEvaluationsForFacultyHead: () => api.get("/account-management/final-evaluations/faculty-head"),
  reviewFinalEvaluation: (id: string, data: any) => api.put(`/account-management/final-evaluations/${id}/review`, data),
  downloadEvaluationAttachment: (evaluationId: string, attachmentIndex: number) => 
    api.get(`/account-management/final-evaluations/${evaluationId}/attachments/${attachmentIndex}/download`, {
      responseType: 'blob'
    }),
  exportFinalEvaluationPDF: (evaluationId: string) => 
    api.get(`/advisers/final-evaluation/${evaluationId}/export-pdf`, {
      responseType: 'blob'
    }),
  // New endpoints for assigned students
  getAssignedStudentsForUniversityAdviser: (adviserId?: string) => {
    if (adviserId) {
      return api.get(`/account-management/assigned-students/university-adviser/${adviserId}`);
    }
    return api.get("/account-management/assigned-students/university-adviser");
  },
  getAssignedStudentsForFacultyHead: (facultyHeadId?: string) => {
    if (facultyHeadId) {
      return api.get(`/account-management/assigned-students/faculty-head/${facultyHeadId}`);
    }
    return api.get("/account-management/assigned-students/faculty-head");
  },

  // Enhanced assignment endpoints
  getStudentsGroupedByProgram: () => api.get("/account-management/students-grouped-by-program"),
  getUnassignedStudentsByProgram: () => api.get("/account-management/unassigned-students-by-program"),
  getCompanyAdvisersByProgram: (programId: string) => api.get(`/account-management/company-advisers/program/${programId}`),
  assignCompanyAdviserToStudent: (data: { studentId: string; companyAdviserId: string }) => 
    api.post("/account-management/assign-company-adviser", data),
  assignStudentsToCompanyAdviser: (data: { studentIds: string[]; adviserId: string }) =>
    api.post("/account-management/assign-adviser", data),
  
  // Debug endpoint
  debugStudentAssignments: () => api.get("/account-management/debug/students"),
  
  // Student details with populated data
  getStudentDetails: (studentId: string) => api.get(`/account-management/student-details/${studentId}`),
  
  // Adviser Dashboard endpoints
  getMyStudentsUniversityAdviser: () => api.get("/account-management/my-students/university-adviser"),
  getMyStudentsCompanyAdviser: () => api.get("/account-management/my-students/company-adviser"),
  getStudentsByCompanyAdviser: (adviserId: string) => api.get(`/account-management/students/company-adviser/${adviserId}`),
  getAdviserDashboardStats: () => api.get("/account-management/dashboard/stats"),
  getNotifications: () => api.get("/account-management/notifications"),
};

// Progress Tracking API
export const progressAPI = {
  // Get Company Adviser's progress data for University Adviser (read-only)
  getCompanyAdviserProgressData: (studentId: string) => 
    api.get(`/progress/company-adviser/${studentId}`),
  
  // Get progress data directly (for University Adviser)
  getProgressData: (studentId: string) => api.get(`/progress/${studentId}`),
  
  // Save progress data (for Company Adviser)
  saveProgressData: (studentId: string, data: any) => 
    api.post(`/progress/company-adviser/${studentId}`, data),
};

// Final Evaluation API (mirrors progress pattern)
export const finalEvaluationAPI = {
  // Get Company Adviser's final evaluation data
  getFinalEvaluationData: (studentId: string) => 
    api.get(`/final-evaluation/company-adviser/${studentId}`),
  
  // Save final evaluation data (for Company Adviser) - mirrors progress pattern
  saveFinalEvaluationData: (studentId: string, data: any) => 
    api.post(`/final-evaluation/company-adviser/${studentId}`, data),
  
  // Export PDF
  exportFinalEvaluationPDF: (studentId: string) => 
    api.get(`/final-evaluation/student/${studentId}/export-pdf`, { responseType: 'blob' }),
  
  // Get Company Adviser's final evaluation data for Faculty Head (read-only)
  getFacultyHeadFinalEvaluationData: (studentId: string) => 
    api.get(`/advisers/final-evaluation/faculty-head/${studentId}`),
};

export default api;
