export interface User {
  userId: string;
  username: string;
  displayName?: string;
  email: string;
  profilePicture?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  isOnline: boolean;
  lastSeen?: Date;
  createdAt: Date;
  isSuspended?: boolean;
  isEmailVerified?: boolean;
}

export interface UserProfile extends User {
  bio?: string;
  location?: string;
}

export interface AuthUser extends User {
  accessToken: string;
  refreshToken: string;
  isPremium?: boolean;
  bio?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  displayName?: string;
  age?: number | string;
  gender?: string;
}

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface UserFilter {
  gender?: 'male' | 'female' | 'other' | 'all';
  minAge?: number;
  maxAge?: number;
  onlineOnly?: boolean;
  searchQuery?: string;
}
