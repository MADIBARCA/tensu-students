// Endpoints for student API
export const ENDPOINTS = {
  STUDENTS: {
    BASE: '/students/',
    CREATE: '/students/',
    ME: '/students/me',
    BY_ID: (userId: string) => `/students/${userId}`,
    BY_TELEGRAM: (telegramId: string) => `/students/by-telegram-id/${telegramId}`,
    PREFERENCES: '/students/preferences',
    PREFERENCE: (telegramId: string, key: string) =>
      `/students/${telegramId}/preferences/${key}`,
  },
  
  MEMBERSHIPS: {
    BASE: '/students/memberships/',
    ACTIVE: '/students/memberships/active',
    CHECK: '/students/memberships/check',
    HISTORY: '/students/memberships/history',
    STATS: '/students/memberships/stats',
    FREEZE: '/students/memberships/freeze',
    UNFREEZE: '/students/memberships/unfreeze',
  },

  ATTENDANCE: {
    BASE: '/students/attendance/',
    CHECKIN: '/students/attendance/checkin',
    STATS: '/students/attendance/stats',
  },

  PAYMENTS: {
    BASE: '/students/payments/',
    INITIATE: '/students/payments/initiate',
    COMPLETE: '/students/payments/complete',
    STATS: '/students/payments/stats',
  },

  SCHEDULE: {
    NEXT: '/students/schedule/next',
    SESSIONS: '/students/schedule/sessions',
    TRAINERS: '/students/schedule/trainers',
  },

  CLUBS: {
    BASE: '/students/clubs/',
    MY: '/students/clubs/my',
    NEAREST: '/students/clubs/nearest',
    BY_ID: (clubId: number | string) => `/students/clubs/${clubId}`,
  },
} as const;
