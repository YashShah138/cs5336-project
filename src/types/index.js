// User Types
export const USER_ROLES = ['administrator', 'airline_staff', 'gate_staff', 'ground_staff', 'passenger'];

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

export const STATUS_COLORS = {
  not_checked_in: 'bg-destructive text-destructive-foreground',
  checked_in: 'bg-warning text-warning-foreground',
  boarded: 'bg-success text-success-foreground',
};

export const BAG_LOCATION_COLORS = {
  check_in: 'bg-destructive text-destructive-foreground',
  security: 'bg-warning text-warning-foreground',
  security_violation: 'bg-destructive text-destructive-foreground',
  gate: 'bg-success text-success-foreground',
  loaded: 'bg-primary text-primary-foreground',
};

export const BAG_LOCATION_LABELS = {
  check_in: 'Check-In',
  security: 'Security Check',
  security_violation: 'Security Violation',
  gate: 'Gate',
  loaded: 'Loaded',
};

export const PASSENGER_STATUS_LABELS = {
  not_checked_in: 'Not Checked In',
  checked_in: 'Checked In',
  boarded: 'Boarded',
};
