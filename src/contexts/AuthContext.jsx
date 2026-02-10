import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getFromStorage, setToStorage, getFromSessionStorage, setToSessionStorage, removeFromSessionStorage, STORAGE_KEYS } from '@/lib/storage';
import { validatePassword } from '@/lib/validation';
import { hashPasswordSync, verifyPasswordSync } from '@/lib/passwordUtils';

const AuthContext = createContext(undefined);

// Default admin credentials
const DEFAULT_ADMIN = {
  id: 'admin-1',
  username: 'admin',
  password: hashPasswordSync('Admin123'),
  role: 'administrator',
  firstName: 'System',
  lastName: 'Administrator',
  requiresPasswordChange: false,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize admin in storage if not exists
  useEffect(() => {
    const admin = getFromStorage(STORAGE_KEYS.ADMIN, null);
    if (!admin) {
      setToStorage(STORAGE_KEYS.ADMIN, DEFAULT_ADMIN);
    } else if (!admin.password || admin.password === 'Admin123') {
      // Migrate plaintext password to hashed
      admin.password = hashPasswordSync('Admin123');
      setToStorage(STORAGE_KEYS.ADMIN, admin);
    }
  }, []);

  // Migrate any existing staff with plaintext passwords
  useEffect(() => {
    const staffList = getFromStorage(STORAGE_KEYS.STAFF, []);
    let migrated = false;
    staffList.forEach(s => {
      if (s.password && s.password.length < 20) {
        // Likely plaintext, hash it
        s.password = hashPasswordSync(s.password);
        migrated = true;
      }
    });
    if (migrated) {
      setToStorage(STORAGE_KEYS.STAFF, staffList);
    }
  }, []);

  // Check for existing session in sessionStorage (tab-isolated)
  useEffect(() => {
    const session = getFromSessionStorage(STORAGE_KEYS.SESSION, null);
    if (session && new Date(session.expiresAt) > new Date()) {
      restoreUser(session);
    } else {
      removeFromSessionStorage(STORAGE_KEYS.SESSION);
      setIsLoading(false);
    }
  }, []);

  const restoreUser = async (session) => {
    try {
      if (session.role === 'administrator') {
        const admin = getFromStorage(STORAGE_KEYS.ADMIN, DEFAULT_ADMIN);
        setUser({
          id: admin.id,
          username: admin.username,
          role: admin.role,
          firstName: admin.firstName,
          lastName: admin.lastName,
          requiresPasswordChange: admin.requiresPasswordChange,
        });
      } else if (session.role === 'passenger') {
        const passengers = getFromStorage(STORAGE_KEYS.PASSENGERS, []);
        const passenger = passengers.find(p => p.id === session.userId);
        if (passenger) {
          setUser({
            id: passenger.id,
            role: 'passenger',
            identification: passenger.identification,
            ticketNumber: passenger.ticketNumber,
            firstName: passenger.firstName,
            lastName: passenger.lastName,
          });
        }
      } else {
        const staff = getFromStorage(STORAGE_KEYS.STAFF, []);
        const staffMember = staff.find(s => s.id === session.userId);
        if (staffMember) {
          setUser({
            id: staffMember.id,
            username: staffMember.username,
            role: staffMember.staffType,
            firstName: staffMember.firstName,
            lastName: staffMember.lastName,
            email: staffMember.email,
            phone: staffMember.phone,
            airlineCode: staffMember.airlineCode,
            requiresPasswordChange: staffMember.requiresPasswordChange,
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (role, credentials) => {
    setIsLoading(true);
    try {
      if (role === 'passenger') {
        const passengers = getFromStorage(STORAGE_KEYS.PASSENGERS, []);
        const passenger = passengers.find(
          p => p.identification === credentials.identification && p.ticketNumber === credentials.ticketNumber
        );
        
        if (!passenger) {
          return { success: false, error: 'Invalid identification or ticket number' };
        }

        const session = {
          userId: passenger.id,
          role: 'passenger',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
        setToSessionStorage(STORAGE_KEYS.SESSION, session);
        
        setUser({
          id: passenger.id,
          role: 'passenger',
          identification: passenger.identification,
          ticketNumber: passenger.ticketNumber,
          firstName: passenger.firstName,
          lastName: passenger.lastName,
        });
        
        return { success: true };
      } else if (role === 'administrator') {
        const admin = getFromStorage(STORAGE_KEYS.ADMIN, DEFAULT_ADMIN);
        const passwordMatch = verifyPasswordSync(credentials.password, admin.password);
        if (credentials.username !== admin.username || !passwordMatch) {
          return { success: false, error: 'Invalid username or password' };
        }

        const session = {
          userId: admin.id,
          role: 'administrator',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
        setToSessionStorage(STORAGE_KEYS.SESSION, session);
        
        setUser({
          id: admin.id,
          username: admin.username,
          role: admin.role,
          firstName: admin.firstName,
          lastName: admin.lastName,
          requiresPasswordChange: admin.requiresPasswordChange,
        });
        
        return { success: true };
      } else {
        const staff = getFromStorage(STORAGE_KEYS.STAFF, []);
        const staffMember = staff.find(
          s => s.username === credentials.username && 
               verifyPasswordSync(credentials.password, s.password) && 
               s.staffType === role
        );
        
        if (!staffMember) {
          return { success: false, error: 'Invalid username or password' };
        }

        const session = {
          userId: staffMember.id,
          role: staffMember.staffType,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
        setToSessionStorage(STORAGE_KEYS.SESSION, session);
        
        setUser({
          id: staffMember.id,
          username: staffMember.username,
          role: staffMember.staffType,
          firstName: staffMember.firstName,
          lastName: staffMember.lastName,
          email: staffMember.email,
          phone: staffMember.phone,
          airlineCode: staffMember.airlineCode,
          requiresPasswordChange: staffMember.requiresPasswordChange,
        });
        
        return { success: true };
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    removeFromSessionStorage(STORAGE_KEYS.SESSION);
    setUser(null);
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!user) {
      return { success: false, error: 'Not logged in' };
    }

    if (!validatePassword(newPassword)) {
      return { success: false, error: 'Password must be at least 6 characters with 1 uppercase, 1 lowercase, and 1 number' };
    }

    if (user.role === 'administrator') {
      const admin = getFromStorage(STORAGE_KEYS.ADMIN, DEFAULT_ADMIN);
      if (!verifyPasswordSync(currentPassword, admin.password)) {
        return { success: false, error: 'Current password is incorrect' };
      }
      admin.password = hashPasswordSync(newPassword);
      admin.requiresPasswordChange = false;
      setToStorage(STORAGE_KEYS.ADMIN, admin);
      setUser({ ...user, requiresPasswordChange: false });
    } else if (user.role !== 'passenger') {
      const staff = getFromStorage(STORAGE_KEYS.STAFF, []);
      const staffIndex = staff.findIndex(s => s.id === user.id);
      if (staffIndex === -1 || !verifyPasswordSync(currentPassword, staff[staffIndex].password)) {
        return { success: false, error: 'Current password is incorrect' };
      }
      staff[staffIndex].password = hashPasswordSync(newPassword);
      staff[staffIndex].requiresPasswordChange = false;
      setToStorage(STORAGE_KEYS.STAFF, staff);
      setUser({ ...user, requiresPasswordChange: false });
    }

    return { success: true };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
