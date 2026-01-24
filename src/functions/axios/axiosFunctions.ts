import { axiosRequest } from './axiosApis';
import { ENDPOINTS } from './endpoints';
import type { 
  UpdateStudentRequest, 
  PreferencesUpdateRequest,
  CheckInRequest,
  FreezeMembershipRequest,
  UnfreezeMembershipRequest,
  InitiatePaymentRequest,
  ScheduleFiltersRequest,
  CreatePriceRequestRequest,
} from './requests';
import type { 
  StudentResponse, 
  MembershipResponse,
  MembershipListResponse,
  MembershipHistoryListResponse,
  MembershipStatsResponse,
  HasActiveMembershipResponse,
  IndividualPricesListResponse,
  PriceRequestResponse,
  PriceRequestListResponse,
  CheckInResponse,
  AttendanceListResponse,
  AttendanceStatsResponse,
  PaymentListResponse,
  InitiatePaymentResponse,
  CompletePaymentResponse,
  PaymentStatsResponse,
  GatewayPaymentResponse,
  CardRegistrationResponse,
  RegisteredCardsResponse,
  SessionResponse,
  SessionListResponse,
  TrainerResponse,
  BookSessionResponse,
  CancelBookingResponse,
  SessionParticipantsResponse,
  ClubDetailResponse,
  ClubListResponse,
  NearestClubResponse,
} from './responses';

// Student Profile API
export const studentsApi = {
  getMe: (token: string | null) =>
    axiosRequest<StudentResponse>(ENDPOINTS.STUDENTS.ME, 'GET', token),

  create: (data: { contact_init_data: string; preferences?: Record<string, unknown> }, token: string) =>
    axiosRequest<StudentResponse>(ENDPOINTS.STUDENTS.CREATE, 'POST', token, data),

  updateMe: (data: UpdateStudentRequest, token: string) =>
    axiosRequest<StudentResponse>(ENDPOINTS.STUDENTS.ME, 'PUT', token, data),

  getById: (userId: string, token: string) =>
    axiosRequest<StudentResponse>(ENDPOINTS.STUDENTS.BY_ID(userId), 'GET', token),

  updatePrefs: (prefs: PreferencesUpdateRequest, token: string) =>
    axiosRequest<StudentResponse>(ENDPOINTS.STUDENTS.PREFERENCES, 'PUT', token, prefs),

  getPref: (tgId: string, key: string, token: string) =>
    axiosRequest<unknown>(ENDPOINTS.STUDENTS.PREFERENCE(tgId, key), 'GET', token),
};

// Memberships API
export const membershipsApi = {
  getAll: (token: string | null, includeInactive: boolean = false) =>
    axiosRequest<MembershipListResponse>(
      `${ENDPOINTS.MEMBERSHIPS.BASE}?include_inactive=${includeInactive}`,
      'GET',
      token
    ),

  getActive: (token: string | null) =>
    axiosRequest<MembershipListResponse>(ENDPOINTS.MEMBERSHIPS.ACTIVE, 'GET', token),

  checkActive: (token: string | null) =>
    axiosRequest<HasActiveMembershipResponse>(ENDPOINTS.MEMBERSHIPS.CHECK, 'GET', token),

  getHistory: (token: string | null, page: number = 1, size: number = 20) =>
    axiosRequest<MembershipHistoryListResponse>(
      `${ENDPOINTS.MEMBERSHIPS.HISTORY}?page=${page}&size=${size}`,
      'GET',
      token
    ),

  getStats: (token: string | null) =>
    axiosRequest<MembershipStatsResponse>(ENDPOINTS.MEMBERSHIPS.STATS, 'GET', token),

  freeze: (data: FreezeMembershipRequest, token: string | null) =>
    axiosRequest<MembershipResponse>(ENDPOINTS.MEMBERSHIPS.FREEZE, 'POST', token, data),

  unfreeze: (data: UnfreezeMembershipRequest, token: string | null) =>
    axiosRequest<MembershipResponse>(ENDPOINTS.MEMBERSHIPS.UNFREEZE, 'POST', token, data),

  getMyPrices: (token: string | null) =>
    axiosRequest<IndividualPricesListResponse>(ENDPOINTS.MEMBERSHIPS.MY_PRICES, 'GET', token),
};

// Check-in/Attendance API
export const attendanceApi = {
  checkIn: (data?: CheckInRequest, token?: string | null) =>
    axiosRequest<CheckInResponse>(ENDPOINTS.ATTENDANCE.CHECKIN, 'POST', token || null, data || {}),

  getHistory: (
    token: string | null, 
    page: number = 1, 
    size: number = 20,
    dateFrom?: string,
    dateTo?: string
  ) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    
    return axiosRequest<AttendanceListResponse>(
      `${ENDPOINTS.ATTENDANCE.BASE}?${params.toString()}`,
      'GET',
      token
    );
  },

  getStats: (token: string | null) =>
    axiosRequest<AttendanceStatsResponse>(ENDPOINTS.ATTENDANCE.STATS, 'GET', token),
};

// Legacy checkInApi for backward compatibility
export const checkInApi = {
  checkIn: (token: string | null) =>
    attendanceApi.checkIn(undefined, token),
};

// Payments API
export const paymentsApi = {
  getHistory: (
    token: string | null, 
    page: number = 1, 
    size: number = 20,
    status?: string
  ) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (status) params.append('status', status);
    
    return axiosRequest<PaymentListResponse>(
      `${ENDPOINTS.PAYMENTS.BASE}?${params.toString()}`,
      'GET',
      token
    );
  },

  // Mock payment flow (for testing/fallback)
  initiate: (data: InitiatePaymentRequest, token: string | null) =>
    axiosRequest<InitiatePaymentResponse>(ENDPOINTS.PAYMENTS.INITIATE, 'POST', token, data),

  complete: (paymentId: number, token: string | null) =>
    axiosRequest<CompletePaymentResponse>(ENDPOINTS.PAYMENTS.COMPLETE, 'POST', token, { payment_id: paymentId }),

  getStats: (token: string | null) =>
    axiosRequest<PaymentStatsResponse>(ENDPOINTS.PAYMENTS.STATS, 'GET', token),

  // CNP Gateway payment flow
  gateway: {
    // Initiate payment via CNP gateway - returns redirect URL
    initiate: (data: InitiatePaymentRequest, token: string | null, returnUrl?: string) => {
      const params = returnUrl ? `?return_url=${encodeURIComponent(returnUrl)}` : '';
      return axiosRequest<GatewayPaymentResponse>(
        `${ENDPOINTS.PAYMENTS.GATEWAY_INITIATE}${params}`,
        'POST',
        token,
        data
      );
    },

    // Pay with registered card (OneClick)
    payWithCard: (
      data: { club_id: number; tariff_id: number; card_id: number; group_id?: number },
      token: string | null
    ) => axiosRequest<GatewayPaymentResponse>(
      ENDPOINTS.PAYMENTS.GATEWAY_ONECLICK,
      'POST',
      token,
      data
    ),

    // Check payment status
    getStatus: (paymentId: number, token: string | null) =>
      axiosRequest<GatewayPaymentResponse>(
        ENDPOINTS.PAYMENTS.GATEWAY_STATUS(paymentId),
        'GET',
        token
      ),

    // Complete payment after card registration
    complete: (paymentId: number, cnpUserId: number, cnpCardId: number, token: string | null) =>
      axiosRequest<GatewayPaymentResponse>(
        `${ENDPOINTS.PAYMENTS.GATEWAY_COMPLETE}?payment_id=${paymentId}&cnp_user_id=${cnpUserId}&cnp_card_id=${cnpCardId}`,
        'POST',
        token
      ),
  },

  // Card management for OneClick payments
  cards: {
    // Get registered cards
    getAll: (token: string | null) =>
      axiosRequest<RegisteredCardsResponse>(ENDPOINTS.PAYMENTS.CARDS, 'GET', token),

    // Initiate card registration - returns redirect URL
    register: (token: string | null, returnUrl?: string) =>
      axiosRequest<CardRegistrationResponse>(
        ENDPOINTS.PAYMENTS.CARDS_REGISTER,
        'POST',
        token,
        { return_url: returnUrl }
      ),

    // Sync card from gateway after registration callback
    sync: (cnpUserId: number, cnpCardId: number, token: string | null) =>
      axiosRequest<{ success: boolean; card?: unknown }>(
        `${ENDPOINTS.PAYMENTS.CARDS_SYNC}?cnp_user_id=${cnpUserId}&cnp_card_id=${cnpCardId}`,
        'POST',
        token
      ),

    // Delete a registered card
    delete: (cardId: number, token: string | null) =>
      axiosRequest<{ success: boolean }>(
        ENDPOINTS.PAYMENTS.CARDS_DELETE(cardId),
        'DELETE',
        token
      ),
  },
};

// Schedule/Sessions API
export const scheduleApi = {
  getNext: (token: string | null, limit: number = 10) =>
    axiosRequest<SessionResponse[]>(
      `${ENDPOINTS.SCHEDULE.NEXT}?limit=${limit}`,
      'GET',
      token
    ),

  getSessions: (
    token: string | null,
    page: number = 1,
    size: number = 20,
    filters?: ScheduleFiltersRequest
  ) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (filters?.club_id) params.append('club_id', filters.club_id.toString());
    if (filters?.section_id) params.append('section_id', filters.section_id.toString());
    if (filters?.trainer_id) params.append('trainer_id', filters.trainer_id.toString());
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.only_my_sessions) params.append('only_my_sessions', 'true');
    
    return axiosRequest<SessionListResponse>(
      `${ENDPOINTS.SCHEDULE.SESSIONS}?${params.toString()}`,
      'GET',
      token
    );
  },

  getTrainers: (token: string | null) =>
    axiosRequest<TrainerResponse[]>(ENDPOINTS.SCHEDULE.TRAINERS, 'GET', token),

  // Booking endpoints
  book: (lessonId: number, token: string | null) =>
    axiosRequest<BookSessionResponse>(
      ENDPOINTS.SCHEDULE.BOOK,
      'POST',
      token,
      { lesson_id: lessonId }
    ),

  cancel: (lessonId: number, token: string | null) =>
    axiosRequest<CancelBookingResponse>(
      ENDPOINTS.SCHEDULE.CANCEL,
      'POST',
      token,
      { lesson_id: lessonId }
    ),

  joinWaitlist: (lessonId: number, token: string | null) =>
    axiosRequest<BookSessionResponse>(
      ENDPOINTS.SCHEDULE.WAITLIST,
      'POST',
      token,
      { lesson_id: lessonId }
    ),

  getParticipants: (lessonId: number, token: string | null) =>
    axiosRequest<SessionParticipantsResponse>(
      ENDPOINTS.SCHEDULE.PARTICIPANTS(lessonId),
      'GET',
      token
    ),
};

// Legacy sessionsApi for backward compatibility
export const sessionsApi = {
  getNext: (token: string | null) =>
    scheduleApi.getNext(token, 3),
  
  book: (sessionId: number, token: string | null) =>
    scheduleApi.book(sessionId, token),
};

// Clubs API
export const clubsApi = {
  getAll: (
    token: string | null,
    page: number = 1,
    size: number = 20,
    search?: string,
    onlyMyClubs: boolean = false
  ) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (search) params.append('search', search);
    if (onlyMyClubs) params.append('only_my_clubs', 'true');
    
    return axiosRequest<ClubListResponse>(
      `${ENDPOINTS.CLUBS.BASE}?${params.toString()}`,
      'GET',
      token
    );
  },

  getById: (clubId: number | string, token: string | null) =>
    axiosRequest<ClubDetailResponse>(ENDPOINTS.CLUBS.BY_ID(clubId), 'GET', token),

  getNearest: (latitude: number, longitude: number, token: string | null) =>
    axiosRequest<NearestClubResponse>(
      `${ENDPOINTS.CLUBS.NEAREST}?latitude=${latitude}&longitude=${longitude}`,
      'GET',
      token
    ),

  getMyClubIds: (token: string | null) =>
    axiosRequest<number[]>(ENDPOINTS.CLUBS.MY, 'GET', token),
};

// Price Requests API
export const priceRequestsApi = {
  create: (data: CreatePriceRequestRequest, token: string | null) =>
    axiosRequest<PriceRequestResponse>(ENDPOINTS.PRICE_REQUESTS.BASE, 'POST', token, data),

  getAll: (token: string | null) =>
    axiosRequest<PriceRequestListResponse>(ENDPOINTS.PRICE_REQUESTS.BASE, 'GET', token),

  cancel: (requestId: number, token: string | null) =>
    axiosRequest<{ message: string }>(ENDPOINTS.PRICE_REQUESTS.BY_ID(requestId), 'DELETE', token),

  getNearest: (latitude: number, longitude: number, token: string | null) =>
    axiosRequest<NearestClubResponse>(
      `${ENDPOINTS.CLUBS.NEAREST}?lat=${latitude}&lon=${longitude}`,
      'GET',
      token
    ),

  getById: (clubId: number | string, token: string | null) =>
    axiosRequest<ClubDetailResponse>(ENDPOINTS.CLUBS.BY_ID(clubId), 'GET', token),
};
