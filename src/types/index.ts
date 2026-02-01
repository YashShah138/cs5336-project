// User Types
export type UserRole = 'administrator' | 'airline_staff' | 'gate_staff' | 'ground_staff' | 'passenger';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  airlineCode?: string;
  requiresPasswordChange: boolean;
}

export interface PassengerUser {
  id: string;
  role: 'passenger';
  identification: string;
  ticketNumber: string;
  firstName: string;
  lastName: string;
}

// Flight Types
export interface Flight {
  id: string;
  airlineCode: string;
  flightNumber: string;
  terminal: string;
  gate: string;
  createdAt: Date;
}

// Passenger Types
export type PassengerStatus = 'not_checked_in' | 'checked_in' | 'boarded';

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  identification: string;
  ticketNumber: string;
  flightId: string;
  status: PassengerStatus;
  createdAt: Date;
}

// Bag Types
export type BagLocation = 'check_in' | 'security' | 'gate' | 'loaded';

export interface Bag {
  id: string;
  bagId: string;
  passengerId: string;
  flightId: string;
  location: BagLocation;
  terminal: string;
  counterNumber?: string;
  gateNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  locationHistory: BagLocationHistory[];
}

export interface BagLocationHistory {
  location: BagLocation;
  timestamp: Date;
  updatedBy?: string;
}

// Staff Types
export type StaffType = 'airline_staff' | 'gate_staff' | 'ground_staff';

export interface Staff {
  id: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  staffType: StaffType;
  airlineCode?: string;
  requiresPasswordChange: boolean;
  createdAt: Date;
}

// Message Types
export type MessageBoardType = 'airline' | 'gate' | 'ground';

export interface Message {
  id: string;
  boardType: MessageBoardType;
  staffId: string;
  staffName: string;
  airlineCode?: string;
  content: string;
  createdAt: Date;
}

// Issue Types
export type IssueType = 'security_violation' | 'passenger_removal';

export interface Issue {
  id: string;
  type: IssueType;
  description: string;
  passengerId?: string;
  bagId?: string;
  reportedBy: string;
  createdAt: Date;
}

// Validation Helpers
export const VALIDATION_PATTERNS = {
  airlineCode: /^[A-Z]{2}$/,
  flightNumber: /^\d{4}$/,
  bagId: /^\d{6}$/,
  ticketNumber: /^\d{10}$/,
  identification: /^\d{6}$/,
  name: /^[A-Za-z]{2,}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[1-9]\d{9}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
  username: /^[A-Za-z]{2}\d{2}$/,
};

export const STATUS_COLORS: Record<PassengerStatus, string> = {
  not_checked_in: 'bg-destructive text-destructive-foreground',
  checked_in: 'bg-warning text-warning-foreground',
  boarded: 'bg-success text-success-foreground',
};

export const BAG_LOCATION_COLORS: Record<BagLocation, string> = {
  check_in: 'bg-destructive text-destructive-foreground',
  security: 'bg-warning text-warning-foreground',
  gate: 'bg-success text-success-foreground',
  loaded: 'bg-primary text-primary-foreground',
};

export const BAG_LOCATION_LABELS: Record<BagLocation, string> = {
  check_in: 'Check-In',
  security: 'Security',
  gate: 'Gate',
  loaded: 'Loaded',
};

export const PASSENGER_STATUS_LABELS: Record<PassengerStatus, string> = {
  not_checked_in: 'Not Checked In',
  checked_in: 'Checked In',
  boarded: 'Boarded',
};
