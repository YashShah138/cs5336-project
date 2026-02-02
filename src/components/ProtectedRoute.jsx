import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children, allowedRoles }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const roleRedirects = {
      administrator: '/admin',
      airline_staff: '/airline-staff',
      gate_staff: '/gate-staff',
      ground_staff: '/ground-staff',
      passenger: '/passenger',
    };
    return <Navigate to={roleRedirects[user.role]} replace />;
  }

  return <>{children}</>;
}
