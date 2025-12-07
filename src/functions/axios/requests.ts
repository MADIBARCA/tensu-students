// Request types for student API
// TODO: Add actual request types when endpoints are provided

export interface StudentPreferences {
  [key: string]: Record<string, unknown>;
}

export interface UpdateStudentRequest {
  first_name: string;
  last_name?: string;
  username?: string;
}

// Add more request types as needed
