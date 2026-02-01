// LocalStorage keys
const STORAGE_KEYS = {
  FLIGHTS: 'airport_flights',
  PASSENGERS: 'airport_passengers',
  BAGS: 'airport_bags',
  STAFF: 'airport_staff',
  MESSAGES: 'airport_messages',
  ISSUES: 'airport_issues',
  ADMIN: 'airport_admin',
  SESSION: 'airport_session',
} as const;

// Generic storage helpers
export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item, (key, value) => {
      // Convert date strings back to Date objects
      if (key === 'createdAt' || key === 'updatedAt' || key === 'timestamp') {
        return new Date(value);
      }
      return value;
    });
  } catch {
    return defaultValue;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

export { STORAGE_KEYS };
