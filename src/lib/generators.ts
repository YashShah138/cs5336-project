// Generate unique IDs and codes

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateBagId(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateUsername(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const letters = chars[Math.floor(Math.random() * 26)] + chars[Math.floor(Math.random() * 26)];
  const numbers = String(Math.floor(10 + Math.random() * 90));
  return letters + numbers;
}

export function generatePassword(): string {
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
