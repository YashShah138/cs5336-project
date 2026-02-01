import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, PassengerUser, UserRole, Staff, Passenger } from '@/types';
import { getFromStorage, setToStorage, removeFromStorage, STORAGE_KEYS } from '@/lib/storage';
import { validatePassword } from '@/lib/validation';

interface AuthContextType {
  user: User | PassengerUser | null;
  isLoading: boolean;
  login: (role: UserRole, credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

interface LoginCredentials {
  username?: string;
  password?: string;
  identification?: string;
  ticketNumber?: string;
}

interface Session {
  userId: string;
  role: UserRole;
  expiresAt: Date;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default admin credentials
const DEFAULT_ADMIN = {
  id: 'admin-1',
  username: 'admin',
  password: 'Admin123',
  role: 'administrator' as UserRole,
  firstName: 'System',
  lastName: 'Administrator',
  requiresPasswordChange: false,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | PassengerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize admin in storage if not exists
  useEffect(() => {
    const admin = getFromStorage(STORAGE_KEYS.ADMIN, null);
    if (!admin) {
      setToStorage(STORAGE_KEYS.ADMIN, DEFAULT_ADMIN);
    }
  }, []);

  // Check for existing session
  useEffect(() => {
    const session = getFromStorage<Session | null>(STORAGE_KEYS.SESSION, null);
    if (session && new Date(session.expiresAt) > new Date()) {
      // Restore user from session
      restoreUser(session);
    } else {
      removeFromStorage(STORAGE_KEYS.SESSION);
      setIsLoading(false);
    }
  }, []);

  const restoreUser = async (session: Session) => {
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
        const passengers = getFromStorage<Passenger[]>(STORAGE_KEYS.PASSENGERS, []);
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
        const staff = getFromStorage<Staff[]>(STORAGE_KEYS.STAFF, []);
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

  const login = useCallback(async (role: UserRole, credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (role === 'passenger') {
        // Passenger login with identification + ticket
        const passengers = getFromStorage<Passenger[]>(STORAGE_KEYS.PASSENGERS, []);
        const passenger = passengers.find(
          p => p.identification === credentials.identification && p.ticketNumber === credentials.ticketNumber
        );
        
        if (!passenger) {
          return { success: false, error: 'Invalid identification or ticket number' };
        }

        const session: Session = {
          userId: passenger.id,
          role: 'passenger',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };
        setToStorage(STORAGE_KEYS.SESSION, session);
        
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
        // Admin login
        const admin = getFromStorage(STORAGE_KEYS.ADMIN, DEFAULT_ADMIN);
        if (credentials.username !== admin.username || credentials.password !== admin.password) {
          return { success: false, error: 'Invalid username or password' };
        }

        const session: Session = {
          userId: admin.id,
          role: 'administrator',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
        setToStorage(STORAGE_KEYS.SESSION, session);
        
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
        // Staff login
        const staff = getFromStorage<Staff[]>(STORAGE_KEYS.STAFF, []);
        const staffMember = staff.find(
          s => s.username === credentials.username && s.password === credentials.password && s.staffType === role
        );
        
        if (!staffMember) {
          return { success: false, error: 'Invalid username or password' };
        }

        const session: Session = {
          userId: staffMember.id,
          role: staffMember.staffType,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
        setToStorage(STORAGE_KEYS.SESSION, session);
        
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
    removeFromStorage(STORAGE_KEYS.SESSION);
    setUser(null);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not logged in' };
    }

    if (!validatePassword(newPassword)) {
      return { success: false, error: 'Password must be at least 6 characters with 1 uppercase, 1 lowercase, and 1 number' };
    }

    if (user.role === 'administrator') {
      const admin = getFromStorage(STORAGE_KEYS.ADMIN, DEFAULT_ADMIN);
      if (admin.password !== currentPassword) {
        return { success: false, error: 'Current password is incorrect' };
      }
      admin.password = newPassword;
      admin.requiresPasswordChange = false;
      setToStorage(STORAGE_KEYS.ADMIN, admin);
      setUser({ ...user, requiresPasswordChange: false } as User);
    } else if (user.role !== 'passenger') {
      const staff = getFromStorage<Staff[]>(STORAGE_KEYS.STAFF, []);
      const staffIndex = staff.findIndex(s => s.id === user.id);
      if (staffIndex === -1 || staff[staffIndex].password !== currentPassword) {
        return { success: false, error: 'Current password is incorrect' };
      }
      staff[staffIndex].password = newPassword;
      staff[staffIndex].requiresPasswordChange = false;
      setToStorage(STORAGE_KEYS.STAFF, staff);
      setUser({ ...user, requiresPasswordChange: false } as User);
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
