export type UserRole = 'theatre_owner' | 'manager' | 'staff';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole | string;
  loyaltyPoints: number;
  isVerified: boolean;
  accountStatus: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}
