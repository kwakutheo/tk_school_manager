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
  REPORTS: {
    STUDENT_TERM: (studentId: string) => `/reports/students/${studentId}/term`,
    CLASS_TERM: (classId: string) => `/reports/classes/${classId}/term`,
  },
  FINANCE: {
    SUMMARY: '/finance/summary',
    INVOICES: '/finance/invoices',
    GENERATE_INVOICES: '/finance/invoices/generate',
    INVOICE_BY_ID: (id: string) => `/finance/invoices/${id}`,
    INVOICE_PAYMENTS: (id: string) => `/finance/invoices/${id}/payments`,
    PAYMENTS: '/finance/payments',
    REVERSE_PAYMENT: (id: string) => `/finance/payments/${id}/reverse`,
  },
} as const;
