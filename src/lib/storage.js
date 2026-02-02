// LocalStorage keys for shared data
const STORAGE_KEYS = {
  FLIGHTS: 'airport_flights',
  PASSENGERS: 'airport_passengers',
  BAGS: 'airport_bags',
  STAFF: 'airport_staff',
  MESSAGES: 'airport_messages',
  ISSUES: 'airport_issues',
  ADMIN: 'airport_admin',
  SESSION: 'airport_session', // This will use sessionStorage for tab isolation
};

// Generic storage helpers for localStorage (shared data)
export function getFromStorage(key, defaultValue) {
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

export function setToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

// Session storage helpers for tab-isolated data (sessions)
export function getFromSessionStorage(key, defaultValue) {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item, (key, value) => {
      if (key === 'expiresAt') {
        return new Date(value);
      }
      return value;
    });
  } catch {
    return defaultValue;
  }
}

export function setToSessionStorage(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to sessionStorage:', error);
  }
}

export function removeFromSessionStorage(key) {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from sessionStorage:', error);
  }
}

export { STORAGE_KEYS };
