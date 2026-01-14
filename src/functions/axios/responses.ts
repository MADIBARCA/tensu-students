// Response types for student API - matching backend schemas

export interface StudentPreferences {
  language?: string;
  dark_mode?: boolean;
  notifications?: boolean;
  [key: string]: unknown;
}

export interface StudentResponse {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name: string | null;
  phone_number: string;
  username: string | null;
  photo_url: string | null;
  preferences: StudentPreferences;
  created_at: string;
  updated_at: string;
}

// Membership types
export type MembershipStatus = 'active' | 'frozen' | 'expired' | 'cancelled' | 'new' | 'scheduled';

export interface MembershipResponse {
  id: number;
  club_id: number;
  club_name: string;
  section_id: number | null;
  section_name: string | null;
  group_id: number | null;
  group_name: string | null;
  training_type: 'Group' | 'Personal';
  level: string | null;
  status: MembershipStatus;
  start_date: string;
  end_date: string;
  tariff_id: number | null;
  tariff_name: string | null;
  price: number;
  is_tariff_deleted: boolean;  // Indicates if the tariff was discontinued
  freeze_days_available: number;
  freeze_days_used: number;
  freeze_start_date: string | null;
  freeze_end_date: string | null;
  coach_id: number | null;
  coach_name: string | null;
  created_at: string;
}

export interface MembershipListResponse {
  memberships: MembershipResponse[];
  total: number;
}

export interface MembershipHistoryResponse {
  id: number;
  club_id: number;
  club_name: string;
  section_id: number | null;
  section_name: string | null;
  group_id: number | null;
  group_name: string | null;
  training_type: 'Group' | 'Personal';
  deactivation_date: string;
  reason: 'expired' | 'cancelled';
  start_date: string;
  end_date: string;
}

export interface MembershipHistoryListResponse {
  history: MembershipHistoryResponse[];
  total: number;
}

export interface MembershipStatsResponse {
  active_memberships: number;
  frozen_memberships: number;
  total_memberships: number;
  days_until_expiry: number | null;
  freeze_days_available: number;
}

export interface HasActiveMembershipResponse {
  has_active_membership: boolean;
}

// Individual Price Override
export interface IndividualPriceResponse {
  tariff_id: number;
  tariff_name: string;
  standard_price: number;
  custom_price: number;
  reason: string | null;
  valid_until: string | null;
  discount_percent: number;
}

export interface IndividualPricesListResponse {
  individual_prices: IndividualPriceResponse[];
}

// Attendance types
export type AttendanceStatus = 'attended' | 'missed' | 'late' | 'excused';

export interface CheckInResponse {
  success: boolean;
  message: string;
  attendance_id: number | null;
  checkin_time: string | null;
  club_name: string | null;
  section_name: string | null;
}

export interface AttendanceRecordResponse {
  id: number;
  club_id: number | null;
  club_name: string | null;
  section_id: number | null;
  section_name: string | null;
  group_id: number | null;
  group_name: string | null;
  checkin_date: string;
  checkin_time: string | null;
  status: AttendanceStatus;
  lesson_id: number | null;
  lesson_time: string | null;
  coach_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface AttendanceListResponse {
  records: AttendanceRecordResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface AttendanceStatsResponse {
  visits_this_month: number;
  missed_this_month: number;
  average_attendance: number;
  total_visits: number;
  streak_days: number;
  last_visit_date: string | null;
}

// Payment types
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethod = 'card' | 'kaspi' | 'cash' | 'transfer';

export interface PaymentResponse {
  id: number;
  club_id: number | null;
  club_name: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod | null;
  description: string | null;
  tariff_name: string | null;
  payment_date: string | null;
  created_at: string;
}

export interface PaymentListResponse {
  payments: PaymentResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface InitiatePaymentResponse {
  payment_id: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  redirect_url: string | null;
  external_id: string | null;
}

export interface CompletePaymentResponse {
  success: boolean;
  payment_id: number;
  enrollment_id: number | null;
  message: string;
}

export interface PaymentStatsResponse {
  total_paid: number;
  pending_payments: number;
  payments_this_month: number;
  amount_this_month: number;
}

// Schedule/Session types
export type SessionStatus = 'scheduled' | 'booked' | 'full' | 'cancelled';

export interface SessionResponse {
  id: number;
  section_name: string;
  group_name: string | null;
  coach_id: number | null;
  coach_name: string | null;
  club_id: number;
  club_name: string | null;
  club_address: string | null;
  date: string;
  time: string;
  duration_minutes: number;
  location: string | null;
  participants_count: number;
  max_participants: number | null;
  status: SessionStatus;
  is_booked: boolean;
  is_in_waitlist: boolean;
  notes: string | null;
}

export interface SessionListResponse {
  sessions: SessionResponse[];
  total: number;
}

export interface BookSessionResponse {
  success: boolean;
  message: string;
  booking_id: number | null;
}

export interface CancelBookingResponse {
  success: boolean;
  message: string;
}

export interface ParticipantResponse {
  id: number;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  is_current_user: boolean;
}

export interface SessionParticipantsResponse {
  lesson_id: number;
  participants: ParticipantResponse[];
  total: number;
  max_participants: number | null;
}

export interface TrainerResponse {
  id: number;
  name: string;
  club_id: number | null;
}

// Club types
export interface ClubCoachResponse {
  id: number;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  specialization: string | null;
}

export interface ClubSectionResponse {
  id: number;
  name: string;
  description: string | null;
}

export interface TariffAccessInfo {
  id: number;
  name: string;
  type: 'section' | 'group';
}

export interface ClubTariffResponse {
  id: number;
  name: string;
  description: string | null;
  type: string; // Package type: full_club, full_section, single_group, multiple_groups
  payment_type: string; // Payment type: monthly, semi_annual, annual, session_pack
  price: number;
  duration_days: number | null;
  sessions_count: number | null;
  freeze_days_total: number;
  features: string[];
  included_sections: TariffAccessInfo[];
  included_groups: TariffAccessInfo[];
}

export interface ClubResponse {
  id: number;
  name: string;
  description: string | null;
  city: string | null;
  address: string | null;
  logo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  telegram_url: string | null;
  instagram_url: string | null;
  whatsapp_url: string | null;
  working_hours: string | null;
  sections_count: number;
  students_count: number;
  tags: string[];
}

export interface ClubDetailResponse extends ClubResponse {
  sections: ClubSectionResponse[];
  tariffs: ClubTariffResponse[];
  coaches: ClubCoachResponse[];
}

export interface ClubListResponse {
  clubs: ClubResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ClubLocationResponse {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
}

export interface NearestClubResponse {
  club: ClubLocationResponse | null;
  distance_meters: number | null;
}
