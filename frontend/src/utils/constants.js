// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    LOGOUT: '/auth/logout/',
    REFRESH: '/auth/token/refresh/',
  },
  CAMPAIGNS: {
    LIST: '/campaigns/',
    DETAIL: (id) => `/campaigns/${id}/`,
    UPLOAD_EMPLOYEES: (id) => `/campaigns/${id}/upload-employees/`,
    MATCHES: (id) => `/campaigns/${id}/matches/`,
    CONFIRM_MATCHES: (id) => `/campaigns/${id}/confirm-matches/`,
  },
};

// Campaign statuses
export const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Campaign status labels
export const CAMPAIGN_STATUS_LABELS = {
  [CAMPAIGN_STATUS.DRAFT]: 'Brouillon',
  [CAMPAIGN_STATUS.ACTIVE]: 'Active',
  [CAMPAIGN_STATUS.COMPLETED]: 'Terminée',
  [CAMPAIGN_STATUS.CANCELLED]: 'Annulée',
};

// File upload constraints
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ],
  ALLOWED_EXTENSIONS: ['.xlsx', '.xls', '.csv'],
};

// Form validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME: 'MMM dd, yyyy HH:mm',
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};
