// Response types for student API
// TODO: Add actual response types when endpoints are provided

export interface StudentPreferences {
  [key: string]: Record<string, unknown>;
}

export interface StudentResponse {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  username: string;
  photo_url: string;
  preferences: StudentPreferences;
  created_at: string;
  updated_at: string;
}

export interface MembershipResponse {
  id: number;
  user_id: number;
  club_id: number;
  section_id?: number;
  group_id?: number;
  status: 'active' | 'frozen' | 'expired' | 'canceled';
  start_date: string;
  end_date: string;
  price: number;
  freeze_days_available?: number;
  freeze_days_used?: number;
  club_name: string;
  section_name?: string;
  group_name?: string;
  training_type: 'Group' | 'Personal';
  level?: string;
}

export interface AttendanceRecordResponse {
  id: number;
  user_id: number;
  club_id: number;
  section_id?: number;
  checkin_date: string;
  club_name: string;
  section_name?: string;
}

export interface AttendanceStatsResponse {
  visits_this_month: number;
  missed_this_month: number;
  average_attendance: number;
}

export interface PaymentResponse {
  id: number;
  user_id: number;
  club_id: number;
  amount: number;
  payment_date: string;
  status: 'paid' | 'pending' | 'failed';
  payment_method?: string;
  club_name: string;
}

export interface SessionResponse {
  id: number;
  section_name: string;
  group_name?: string;
  coach_name: string;
  date: string;
  time: string;
  club_address: string;
  participants_count: number;
  max_participants?: number;
  notes?: string;
  status: 'scheduled' | 'cancelled' | 'booked' | 'full';
  club_id: number;
  section_id?: number;
  group_id?: number;
}

export interface ClubLocationResponse {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

// Add more response types as needed
