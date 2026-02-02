import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PassengerStatusBadge, BagLocationBadge } from '@/components/StatusBadges';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { Plane, Eye, Bell } from 'lucide-react';

export default function GateStaffFlights() {
  const { user } = useAuth();
  const { flights, passengers, bags, getPassengersByFlight, getBagsByFlight, getBagsByPassenger, getFlightById } = useData();
  const { toast } = useToast();

  const staffUser = user;
  const airlineCode = staffUser?.airlineCode;

  const [viewFlight, setViewFlight] = useState(null);
  const [notifyFlight, setNotifyFlight] = useState(null);

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

  const viewFlightData = viewFlight ? getFlightById(viewFlight) : null;
  const viewFlightPassengers = viewFlight ? getPassengersByFlight(viewFlight) : [];
  const viewFlightBags = viewFlight ? getBagsByFlight(viewFlight) : [];

  const handleNotifyDeparture = () => {
    if (!notifyFlight) return;
    const flight = getFlightById(notifyFlight);
    const stats = getFlightStats(notifyFlight);

    toast({
      title: 'Departure notification sent',
      description: `Flight ${flight?.airlineCode}${flight?.flightNumber} is ready for departure`,
      className: 'bg-success text-success-foreground'
    });

    setNotifyFlight(null);
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
                  <TableHead>Passengers</TableHead>
                  <TableHead>Bags</TableHead>
                  <TableHead>Status</TableHead>
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
                        <TableCell>{stats.boarded}/{stats.total} boarded</TableCell>
                        <TableCell>{stats.loadedBags}/{stats.totalBags} loaded</TableCell>
                        <TableCell>{getStatusBadge(stats.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setViewFlight(flight.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {stats.isReady && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setNotifyFlight(flight.id)}
                                className="text-success hover:text-success"
                              >
                                <Bell className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Flight: {viewFlightData?.airlineCode} {viewFlightData?.flightNumber}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="passengers">
            <TabsList>
              <TabsTrigger value="passengers">Passengers ({viewFlightPassengers.length})</TabsTrigger>
              <TabsTrigger value="bags">Bags ({viewFlightBags.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="passengers" className="mt-4">
              {viewFlightPassengers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No passengers</p>
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
                      {viewFlightPassengers.map((p) => {
                        const pBags = getBagsByPassenger(p.id);
                        return (
                          <TableRow key={p.id}>
                            <TableCell>{p.firstName} {p.lastName}</TableCell>
                            <TableCell>{p.ticketNumber}</TableCell>
                            <TableCell><PassengerStatusBadge status={p.status} /></TableCell>
                            <TableCell>{pBags.length}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="bags" className="mt-4">
              {viewFlightBags.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No bags</p>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bag ID</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Terminal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewFlightBags.map((bag) => (
                        <TableRow key={bag.id}>
                          <TableCell className="font-mono">{bag.bagId}</TableCell>
                          <TableCell><BagLocationBadge location={bag.location} /></TableCell>
                          <TableCell>{bag.terminal}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewFlight(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notify Departure Confirmation */}
      {notifyFlight && (() => {
        const stats = getFlightStats(notifyFlight);
        const flight = getFlightById(notifyFlight);
        return (
          <ConfirmDialog
            open={!!notifyFlight}
            onOpenChange={() => setNotifyFlight(null)}
            title="Notify Departure"
            description={`All ${stats.total} passengers boarded and all ${stats.totalBags} bags loaded. Ready to notify departure for flight ${flight?.airlineCode}${flight?.flightNumber}?`}
            confirmLabel="Notify Departure"
            onConfirm={handleNotifyDeparture}
          />
        );
      })()}
    </div>
  );
}
