import { axiosRequest } from './axiosApis';
import { ENDPOINTS } from './endpoints';
import type { UpdateStudentRequest } from './requests';
import type { StudentResponse, SessionResponse, ClubLocationResponse } from './responses';

// Student API functions
// TODO: Implement actual API functions when endpoints are provided
export const studentsApi = {
  getMe: (token: string | null) =>
    axiosRequest<StudentResponse>(ENDPOINTS.STUDENTS.ME, 'GET', token),

  updateMe: (data: UpdateStudentRequest, token: string) =>
    axiosRequest<StudentResponse>(ENDPOINTS.STUDENTS.ME, 'PUT', token, data),

  getById: (userId: string, token: string) =>
    axiosRequest<StudentResponse>(ENDPOINTS.STUDENTS.BY_ID(userId), 'GET', token),

  updatePrefs: (prefs: unknown, token: string) =>
    axiosRequest<unknown>(ENDPOINTS.STUDENTS.PREFERENCES, 'PUT', token, prefs),

  getPref: (tgId: string, key: string, token: string) =>
    axiosRequest<unknown>(ENDPOINTS.STUDENTS.PREFERENCE(tgId, key), 'GET', token),
};

// Check-in API
export const checkInApi = {
  checkIn: (token: string | null) =>
    axiosRequest<void>(ENDPOINTS.CHECKIN.CHECK_IN, 'POST', token),
};

// Sessions API
export const sessionsApi = {
  getNext: (token: string | null) =>
    axiosRequest<SessionResponse[]>(ENDPOINTS.SESSIONS.NEXT, 'GET', token),
  
  book: (sessionId: number, token: string | null) =>
    axiosRequest<void>(ENDPOINTS.SESSIONS.BOOK(sessionId), 'POST', token),
};

// Clubs API
export const clubsApi = {
  getNearest: (latitude: number, longitude: number, token: string | null) =>
    axiosRequest<ClubLocationResponse>(
      `${ENDPOINTS.CLUBS.NEAREST}?lat=${latitude}&lon=${longitude}`,
      'GET',
      token
    ),
};

// Add more API functions as needed
