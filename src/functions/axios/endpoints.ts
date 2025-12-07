// Endpoints for student API
// TODO: Add actual student endpoints when provided
export const ENDPOINTS = {
  STUDENTS: {
    BASE: '/students/',
    ME: '/students/me',
    BY_ID: (userId: string) => `/students/${userId}`,
    BY_TELEGRAM: (telegramId: string) => `/students/by-telegram-id/${telegramId}`,
    PREFERENCES: '/students/preferences',
    PREFERENCE: (telegramId: string, key: string) =>
      `/students/${telegramId}/preferences/${key}`,
    // Add more student-specific endpoints here
  },
  
  // Add other endpoints as needed (groups, schedule, etc.)
  GROUPS: {
    BASE: '/groups/',
    MY: '/groups/my',
    BY_ID: (groupId: number) => `/groups/${groupId}`,
  },

  SCHEDULE: {
    LESSONS: {
      LIST: '/schedule/lessons',
      GET_BY_ID: (lessonId: string | number) => `/schedule/lessons/${lessonId}`,
    },
    CALENDAR: {
      DAY: (targetDate: string) => `/schedule/calendar/day/${targetDate}`,
      WEEK: (targetDate: string) => `/schedule/calendar/week/${targetDate}`,
    },
  },

  CHECKIN: {
    CHECK_IN: '/students/checkin',
  },

  SESSIONS: {
    NEXT: '/students/sessions/next',
    BOOK: (sessionId: number) => `/students/sessions/${sessionId}/book`,
  },

  CLUBS: {
    NEAREST: '/students/clubs/nearest',
  },
} as const;
