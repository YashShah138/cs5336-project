import { VALIDATION_PATTERNS } from '@/types';

export function validateAirlineCode(code: string): boolean {
  return VALIDATION_PATTERNS.airlineCode.test(code.toUpperCase());
}

export function validateFlightNumber(number: string): boolean {
  return VALIDATION_PATTERNS.flightNumber.test(number);
}

export function validateBagId(id: string): boolean {
  return VALIDATION_PATTERNS.bagId.test(id);
}

export function validateTicketNumber(ticket: string): boolean {
  return VALIDATION_PATTERNS.ticketNumber.test(ticket);
}

export function validateIdentification(id: string): boolean {
  return VALIDATION_PATTERNS.identification.test(id);
}

export function validateName(name: string): boolean {
  return VALIDATION_PATTERNS.name.test(name);
}

export function validateEmail(email: string): boolean {
  return VALIDATION_PATTERNS.email.test(email);
}

export function validatePhone(phone: string): boolean {
  return VALIDATION_PATTERNS.phone.test(phone);
}

export function validatePassword(password: string): boolean {
  return VALIDATION_PATTERNS.password.test(password);
}

export function getPasswordStrengthErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 6) errors.push('At least 6 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least 1 uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least 1 lowercase letter');
  if (!/\d/.test(password)) errors.push('At least 1 number');
  return errors;
}

export function formatValidationError(field: string, requirement: string): string {
  return `${field}: ${requirement}`;
}
