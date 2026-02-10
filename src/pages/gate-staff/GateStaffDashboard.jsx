import React, { useState, useMemo, useCallback } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { UserCheck, Plane, MessageSquare, DoorOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { path: '/gate-staff/boarding', label: 'Boarding', icon: UserCheck },
  { path: '/gate-staff/flights', label: 'My Flights', icon: Plane },
  { path: '/gate-staff/messages', label: 'Message Board', icon: MessageSquare },
];

export default function GateStaffDashboard() {
  const location = useLocation();
  const { user } = useAuth();
  const { flights } = useData();
  const [selectedGate, setSelectedGate] = useState(null);

  const airlineCode = user?.airlineCode;

  // Get unique gates from flights matching this staff's airline
  const availableGates = useMemo(() => {
    const airlineFlights = flights.filter(f => f.airlineCode === airlineCode);
    const gates = [...new Set(airlineFlights.map(f => f.gate))].filter(Boolean).sort();
    return gates;
  }, [flights, airlineCode]);

  const selectedFlight = useMemo(() => {
    if (!selectedGate) return null;
    return flights.find(f => f.airlineCode === airlineCode && f.gate === selectedGate);
  }, [flights, airlineCode, selectedGate]);

  const handleSelectGate = (gate) => {
    setSelectedGate(gate);
  };

  const handleChangeGate = () => {
    setSelectedGate(null);
  };

  // Gate selection screen
  if (!selectedGate) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Gate Staff Dashboard</h1>
            <p className="text-muted-foreground">Select a gate to begin your shift</p>
          </div>

          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DoorOpen className="h-5 w-5" />
                Select Your Gate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose the gate you are assigned to. You can only work at one gate at a time.
              </p>
              {availableGates.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No gates available for your airline ({airlineCode}). Flights must be created first.
                </p>
              ) : (
                <div className="space-y-3">
                  <Select onValueChange={handleSelectGate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a gate..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGates.map((gate) => {
                        const flight = flights.find(f => f.airlineCode === airlineCode && f.gate === gate);
                        return (
                          <SelectItem key={gate} value={gate}>
                            Gate {gate} — {flight ? `${flight.airlineCode} ${flight.flightNumber}` : 'No flight'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gate Staff Dashboard</h1>
            <p className="text-muted-foreground">Manage passenger boarding</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-base px-3 py-1">
              <DoorOpen className="h-4 w-4 mr-2" />
              Gate {selectedGate}
              {selectedFlight && ` — ${selectedFlight.airlineCode} ${selectedFlight.flightNumber}`}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleChangeGate}>
              Change Gate
            </Button>
          </div>
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

        <Outlet context={{ selectedGate, selectedFlight }} />
      </div>
    </DashboardLayout>
  );
}
