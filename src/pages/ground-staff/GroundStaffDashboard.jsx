import React, { useState, useMemo } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';
import { ShieldCheck, Truck, Briefcase, MessageSquare, DoorOpen, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function GroundStaffDashboard() {
  const location = useLocation();
  const { flights } = useData();
  const [workLocation, setWorkLocation] = useState(null); // 'security' or gate identifier
  const [selectedGate, setSelectedGate] = useState(null);

  // Get all unique gates from all flights (ground staff is not airline-specific)
  const availableGates = useMemo(() => {
    const gates = flights.map(f => ({ gate: f.gate, terminal: f.terminal, flightId: f.id, airlineCode: f.airlineCode, flightNumber: f.flightNumber }));
    return gates.filter((g, i, arr) => arr.findIndex(x => x.gate === g.gate && x.terminal === g.terminal) === i).sort((a, b) => a.gate.localeCompare(b.gate));
  }, [flights]);

  const selectedFlight = useMemo(() => {
    if (workLocation !== 'gate' || !selectedGate) return null;
    return flights.find(f => f.gate === selectedGate);
  }, [flights, workLocation, selectedGate]);

  const handleSelectSecurity = () => {
    setWorkLocation('security');
    setSelectedGate(null);
  };

  const handleSelectGate = (gate) => {
    setSelectedGate(gate);
    setWorkLocation('gate');
  };

  const handleChangeLocation = () => {
    setWorkLocation(null);
    setSelectedGate(null);
  };

  // Location selection screen
  if (!workLocation) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Ground Staff Dashboard</h1>
            <p className="text-muted-foreground">Select your work location to begin</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={handleSelectSecurity}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Security Clearance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Process bags through security checks. Clear bags or report security violations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DoorOpen className="h-5 w-5" />
                  Work at a Gate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Load bags onto aircraft at a specific gate. You can only work at one gate at a time.
                </p>
                {availableGates.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No gates with flights available.
                  </p>
                ) : (
                  <Select onValueChange={handleSelectGate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a gate..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGates.map((g) => (
                        <SelectItem key={`${g.terminal}-${g.gate}`} value={g.gate}>
                          Gate {g.gate} (Terminal {g.terminal}) — {g.airlineCode}{g.flightNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const securityNavItems = [
    { path: '/ground-staff/security', label: 'Security Clearance', icon: ShieldCheck },
    { path: '/ground-staff/messages', label: 'Message Board', icon: MessageSquare },
  ];

  const gateNavItems = [
    { path: '/ground-staff/loading', label: 'Load Bags', icon: Truck },
    { path: '/ground-staff/bags', label: 'Gate Bags', icon: Briefcase },
    { path: '/ground-staff/messages', label: 'Message Board', icon: MessageSquare },
  ];

  const navItems = workLocation === 'security' ? securityNavItems : gateNavItems;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Ground Staff Dashboard</h1>
            <p className="text-muted-foreground">
              {workLocation === 'security' ? 'Security clearance operations' : 'Gate bag loading operations'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-base px-3 py-1">
              <MapPin className="h-4 w-4 mr-2" />
              {workLocation === 'security' 
                ? 'Security Clearance' 
                : `Gate ${selectedGate}${selectedFlight ? ` — ${selectedFlight.airlineCode}${selectedFlight.flightNumber}` : ''}`
              }
            </Badge>
            <Button variant="outline" size="sm" onClick={handleChangeLocation}>
              Change Location
            </Button>
          </div>
        </div>

        <nav className="flex gap-2 border-b pb-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (location.pathname === '/ground-staff' && item.path === navItems[0].path);
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

        <Outlet context={{ workLocation, selectedGate, selectedFlight }} />
      </div>
    </DashboardLayout>
  );
}
