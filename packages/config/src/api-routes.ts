export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  USERS: {
    ROOT: '/users',
    BY_ID: (id: string) => `/users/${id}`,
  },
  SCHOOLS: {
    ROOT: '/schools',
    BY_ID: (id: string) => `/schools/${id}`,
  },
  CLASSES: {
    ROOT: '/classes',
    BY_ID: (id: string) => `/classes/${id}`,
  },
  STUDENTS: {
    ROOT: '/students',
    BY_ID: (id: string) => `/students/${id}`,
    ENROLLMENTS: (id: string) => `/students/${id}/enrollments`,
  },
  SUBJECTS: {
    ROOT: '/subjects',
    BY_ID: (id: string) => `/subjects/${id}`,
  },
  EXAMS: {
    ROOT: '/exams',
    BY_ID: (id: string) => `/exams/${id}`,
    RESULTS: (id: string) => `/exams/${id}/results`,
  },
} as const;
