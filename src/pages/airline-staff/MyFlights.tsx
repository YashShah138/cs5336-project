import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PassengerStatusBadge, BagLocationBadge } from '@/components/StatusBadges';
import { Plane, Eye } from 'lucide-react';

export default function MyFlights() {
  const { user } = useAuth();
  const { flights, passengers, bags, getPassengersByFlight, getBagsByPassenger, getFlightById } = useData();

  const staffUser = user as User;
  const airlineCode = staffUser?.airlineCode;

  const [viewFlight, setViewFlight] = useState<string | null>(null);

  const myFlights = useMemo(() => {
    return flights.filter(f => f.airlineCode === airlineCode);
  }, [flights, airlineCode]);

  const viewFlightData = viewFlight ? getFlightById(viewFlight) : null;
  const viewFlightPassengers = viewFlight ? getPassengersByFlight(viewFlight) : [];

  const getFlightStats = (flightId: string) => {
    const flightPassengers = passengers.filter(p => p.flightId === flightId);
    const checkedIn = flightPassengers.filter(p => p.status === 'checked_in').length;
    const boarded = flightPassengers.filter(p => p.status === 'boarded').length;
    return { total: flightPassengers.length, checkedIn, boarded };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            My Flights ({airlineCode})
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
                  <TableHead>Total Passengers</TableHead>
                  <TableHead>Checked In</TableHead>
                  <TableHead>Boarded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myFlights.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No flights found for your airline
                    </TableCell>
                  </TableRow>
                ) : (
                  myFlights.map((flight) => {
                    const stats = getFlightStats(flight.id);
                    return (
                      <TableRow key={flight.id}>
                        <TableCell className="font-medium">{flight.airlineCode} {flight.flightNumber}</TableCell>
                        <TableCell>{flight.terminal}</TableCell>
                        <TableCell>{flight.gate}</TableCell>
                        <TableCell>{stats.total}</TableCell>
                        <TableCell>{stats.checkedIn}</TableCell>
                        <TableCell>{stats.boarded}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setViewFlight(flight.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Flight Modal */}
      <Dialog open={!!viewFlight} onOpenChange={() => setViewFlight(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Flight: {viewFlightData?.airlineCode} {viewFlightData?.flightNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Terminal</p>
                <p className="font-medium">{viewFlightData?.terminal}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gate</p>
                <p className="font-medium">{viewFlightData?.gate}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Passengers ({viewFlightPassengers.length})</h4>
              {viewFlightPassengers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No passengers</p>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Ticket</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Bags</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewFlightPassengers.map((passenger) => {
                        const passengerBags = getBagsByPassenger(passenger.id);
                        return (
                          <TableRow key={passenger.id}>
                            <TableCell>{passenger.firstName} {passenger.lastName}</TableCell>
                            <TableCell>{passenger.ticketNumber}</TableCell>
                            <TableCell>
                              <PassengerStatusBadge status={passenger.status} />
                            </TableCell>
                            <TableCell>{passengerBags.length}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewFlight(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
