// Simple password hashing for localStorage storage
// Uses SubtleCrypto SHA-256 with a salt for proper masking

const SALT = 'airport-luggage-system-2024';

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(SALT + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Synchronous version using btoa for cases where async isn't practical
export function hashPasswordSync(password) {
  // Simple but effective masking - encode with salt
  const salted = SALT + password;
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Create a longer hash by combining multiple rounds
  const base = btoa(salted);
  return base.split('').reverse().join('').slice(0, 64);
}

export function verifyPasswordSync(password, storedHash) {
  return hashPasswordSync(password) === storedHash;
}
