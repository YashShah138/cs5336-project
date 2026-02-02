import { VALIDATION_PATTERNS } from '@/types';

export function validateAirlineCode(code) {
  return VALIDATION_PATTERNS.airlineCode.test(code.toUpperCase());
}

export function validateFlightNumber(number) {
  return VALIDATION_PATTERNS.flightNumber.test(number);
}

export function validateBagId(id) {
  return VALIDATION_PATTERNS.bagId.test(id);
}

export function validateTicketNumber(ticket) {
  return VALIDATION_PATTERNS.ticketNumber.test(ticket);
}

export function validateIdentification(id) {
  return VALIDATION_PATTERNS.identification.test(id);
}

export function validateName(name) {
  return VALIDATION_PATTERNS.name.test(name);
}

export function validateEmail(email) {
  return VALIDATION_PATTERNS.email.test(email);
}

export function validatePhone(phone) {
  return VALIDATION_PATTERNS.phone.test(phone);
}

export function validatePassword(password) {
  return VALIDATION_PATTERNS.password.test(password);
}

export function getPasswordStrengthErrors(password) {
  const errors = [];
  if (password.length < 6) errors.push('At least 6 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least 1 uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least 1 lowercase letter');
  if (!/\d/.test(password)) errors.push('At least 1 number');
  return errors;
}

export function formatValidationError(field, requirement) {
  return `${field}: ${requirement}`;
}
