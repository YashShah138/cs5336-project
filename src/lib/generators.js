// Generate unique IDs and codes

export function generateId() {
  return crypto.randomUUID();
}

export function generateBagId() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateUsername(lastName) {
  if (!lastName || lastName.length < 2) {
    throw new Error('Last name must have at least 2 characters');
  }
  // Username = lastname (lowercase, min 2 chars) + 2 random digits
  const namePart = lastName.toLowerCase().replace(/[^a-z]/gi, '');
  const digits = String(Math.floor(10 + Math.random() * 90));
  return namePart + digits;
}

export function generatePassword() {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const all = upper + lower + digits;
  
  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  
  for (let i = 0; i < 3; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
