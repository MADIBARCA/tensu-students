// Request types for student API - matching backend schemas

export interface StudentPreferences {
  language?: string;
  dark_mode?: boolean;
  notifications?: boolean;
  [key: string]: unknown;
}

export interface UpdateStudentRequest {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  username?: string;
}

export interface PreferencesUpdateRequest {
  language?: string;
  dark_mode?: boolean;
  notifications?: boolean;
}

// Membership requests
export interface FreezeMembershipRequest {
  enrollment_id: number;
  start_date: string;
  end_date: string;
}

export interface UnfreezeMembershipRequest {
  enrollment_id: number;
}

// Attendance requests
export interface CheckInRequest {
  latitude?: number;
  longitude?: number;
  lesson_id?: number;
}

// Payment requests
export type PaymentMethodType = 'card' | 'kaspi' | 'cash' | 'transfer';

export interface InitiatePaymentRequest {
  club_id: number;
  tariff_id: number;
  group_id?: number;
  payment_method?: PaymentMethodType;
}

// Schedule requests
export interface ScheduleFiltersRequest {
  club_id?: number;
  section_id?: number;
  trainer_id?: number;
  date_from?: string;
  date_to?: string;
  only_my_sessions?: boolean;
}

// Price Request
export interface CreatePriceRequestRequest {
  club_id: number;
  tariff_id: number;
  reason: string;
  requested_price?: number;
  message?: string;
}

// Kaspi Order
export interface CreateKaspiOrderRequest {
  tariff_id: number;
  club_id: number;
}

// Payment Request (cash / transfer declaration)
export type PaymentRequestMethodType = 'cash' | 'transfer' | 'kaspi_qr';

export interface CreatePaymentRequestRequest {
  club_id: number;
  tariff_id: number;
  declared_amount: number;
  declared_payment_date: string; // YYYY-MM-DD
  comment?: string;
  payment_method: PaymentRequestMethodType;
}
