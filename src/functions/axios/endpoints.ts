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
    MY_PRICES: '/students/memberships/my-prices',
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
    // CNP Gateway endpoints
    GATEWAY_INITIATE: '/students/payments/gateway/initiate',
    GATEWAY_ONECLICK: '/students/payments/gateway/oneclick',
    GATEWAY_STATUS: (paymentId: number) => `/students/payments/gateway/status/${paymentId}`,
    GATEWAY_COMPLETE: '/students/payments/gateway/complete',
    GATEWAY_CALLBACK: '/students/payments/gateway/callback',
    // Card registration
    CARDS: '/students/payments/cards',
    CARDS_REGISTER: '/students/payments/cards/register',
    CARDS_SYNC: '/students/payments/cards/sync',
    CARDS_DELETE: (cardId: number) => `/students/payments/cards/${cardId}`,
  },

  SCHEDULE: {
    NEXT: '/students/schedule/next',
    SESSIONS: '/students/schedule/sessions',
    TRAINERS: '/students/schedule/trainers',
    BOOK: '/students/schedule/book',
    CANCEL: '/students/schedule/cancel',
    WAITLIST: '/students/schedule/waitlist',
    PARTICIPANTS: (lessonId: number) => `/students/schedule/sessions/${lessonId}/participants`,
  },

  CLUBS: {
    BASE: '/students/clubs/',
    MY: '/students/clubs/my',
    NEAREST: '/students/clubs/nearest',
    BY_ID: (clubId: number | string) => `/students/clubs/${clubId}`,
  },

  PRICE_REQUESTS: {
    BASE: '/students/price-requests/',
    BY_ID: (requestId: number | string) => `/students/price-requests/${requestId}`,
  },
} as const;
