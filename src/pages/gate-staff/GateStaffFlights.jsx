import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PassengerStatusBadge, BagLocationBadge } from '@/components/StatusBadges';
import { Plane } from 'lucide-react';

export default function GateStaffFlights() {
  const { user } = useAuth();
  const { selectedGate, selectedFlight } = useOutletContext();
  const { flights, passengers, bags, getPassengersByFlight, getBagsByFlight, getBagsByPassenger } = useData();

  const airlineCode = user?.airlineCode;

  const myFlights = useMemo(() => {
    return flights.filter(f => f.airlineCode === airlineCode);
  }, [flights, airlineCode]);

  const getFlightStats = (flightId) => {
    const flightPassengers = passengers.filter(p => p.flightId === flightId);
    const flightBags = bags.filter(b => b.flightId === flightId);
    const boarded = flightPassengers.filter(p => p.status === 'boarded').length;
    const loadedBags = flightBags.filter(b => b.location === 'loaded').length;
    
    const allBoarded = boarded === flightPassengers.length && flightPassengers.length > 0;
    const allLoaded = loadedBags === flightBags.length;
    const isReady = allBoarded && allLoaded;

    return {
      total: flightPassengers.length,
      boarded,
      totalBags: flightBags.length,
      loadedBags,
      isReady,
      status: isReady ? 'ready' : boarded > 0 ? 'boarding' : 'not_ready'
    };
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-success text-success-foreground">Ready</Badge>;
      case 'boarding':
        return <Badge className="bg-warning text-warning-foreground">Boarding</Badge>;
      default:
        return <Badge className="bg-destructive text-destructive-foreground">Not Ready</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            All Flights ({airlineCode})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flight Number</TableHead>
                  <TableHead>Terminal</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>Passengers</TableHead>
                  <TableHead>Bags</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myFlights.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No flights found for your airline
                    </TableCell>
                  </TableRow>
                ) : (
                  myFlights.map((flight) => {
                    const stats = getFlightStats(flight.id);
                    const isCurrentGate = flight.gate === selectedGate;
                    return (
                      <TableRow key={flight.id} className={isCurrentGate ? 'bg-primary/5' : ''}>
                        <TableCell className="font-medium">
                          {flight.airlineCode} {flight.flightNumber}
                          {isCurrentGate && <Badge variant="outline" className="ml-2 text-xs">Your Gate</Badge>}
                        </TableCell>
                        <TableCell>{flight.terminal}</TableCell>
                        <TableCell>{flight.gate}</TableCell>
                        <TableCell>{stats.boarded}/{stats.total} boarded</TableCell>
                        <TableCell>{stats.loadedBags}/{stats.totalBags} loaded</TableCell>
                        <TableCell>{getStatusBadge(stats.status)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
