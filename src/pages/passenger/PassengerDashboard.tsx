import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { PassengerUser } from '@/types';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PassengerStatusBadge, BagLocationBadge } from '@/components/StatusBadges';
import { Plane, Briefcase, MapPin, Check } from 'lucide-react';

export default function PassengerDashboard() {
  const { user } = useAuth();
  const { passengers, bags, flights, getPassengerByTicket, getFlightById, getBagsByPassenger, refreshData } = useData();

  const passengerUser = user as PassengerUser;
  const passenger = getPassengerByTicket(passengerUser?.ticketNumber);
  const flight = passenger ? getFlightById(passenger.flightId) : null;
  const passengerBags = passenger ? getBagsByPassenger(passenger.id) : [];

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const locationSteps = ['check_in', 'security', 'gate', 'loaded'] as const;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {passengerUser?.firstName}!</h1>
          <p className="text-muted-foreground">Track your flight and luggage status</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Flight Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Number</p>
                  <p className="font-mono font-medium">{passengerUser?.ticketNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {passenger && <PassengerStatusBadge status={passenger.status} />}
                </div>
              </div>
              {flight && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Flight</p>
                    <p className="text-3xl font-bold text-primary">{flight.airlineCode} {flight.flightNumber}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Terminal</p>
                      <p className="text-xl font-semibold">{flight.terminal}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gate</p>
                      <p className="text-xl font-semibold">{flight.gate}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bag Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Bag Tracking ({passengerBags.length} bag{passengerBags.length !== 1 ? 's' : ''})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {passengerBags.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No bags checked in</p>
              ) : (
                <div className="space-y-4">
                  {passengerBags.map((bag) => {
                    const currentIndex = locationSteps.indexOf(bag.location);
                    return (
                      <div key={bag.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-mono font-medium">Bag {bag.bagId}</span>
                          <BagLocationBadge location={bag.location} />
                        </div>
                        {/* Progress Timeline */}
                        <div className="flex items-center justify-between">
                          {locationSteps.map((step, i) => {
                            const isComplete = i <= currentIndex;
                            const isCurrent = i === currentIndex;
                            return (
                              <React.Fragment key={step}>
                                <div className="flex flex-col items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    isComplete 
                                      ? isCurrent ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-success text-success-foreground'
                                      : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {isComplete && !isCurrent ? <Check className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                                  </div>
                                  <span className="text-xs mt-1 text-center">{step.replace('_', ' ')}</span>
                                </div>
                                {i < locationSteps.length - 1 && (
                                  <div className={`flex-1 h-1 mx-1 ${i < currentIndex ? 'bg-success' : 'bg-muted'}`} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
