import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { cn } from '@/lib/utils';
import { UserCheck, Plane, MessageSquare } from 'lucide-react';

const navItems = [
  { path: '/gate-staff/boarding', label: 'Boarding', icon: UserCheck },
  { path: '/gate-staff/flights', label: 'My Flights', icon: Plane },
  { path: '/gate-staff/messages', label: 'Message Board', icon: MessageSquare },
];

export default function GateStaffDashboard() {
  const location = useLocation();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gate Staff Dashboard</h1>
          <p className="text-muted-foreground">Manage passenger boarding</p>
        </div>

        <nav className="flex gap-2 border-b pb-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (location.pathname === '/gate-staff' && item.path === '/gate-staff/boarding');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <Outlet />
      </div>
    </DashboardLayout>
  );
}
