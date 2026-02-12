import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PassengerStatusBadge } from '@/components/StatusBadges';
import { useToast } from '@/hooks/use-toast';
import { Plane, Edit } from 'lucide-react';

export default function GateStaffFlights() {
  const { user } = useAuth();
  const { selectedGate, selectedFlight } = useOutletContext();
  const { flights, passengers, bags, getPassengersByFlight, getBagsByFlight, updateFlightGate, addMessage } = useData();
  const { toast } = useToast();

  const airlineCode = user?.airlineCode;
  const [changeGateFlight, setChangeGateFlight] = useState(null);
  const [newGate, setNewGate] = useState('');
  const [newTerminal, setNewTerminal] = useState('');

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

  const handleChangeGate = () => {
    if (!changeGateFlight || !newGate.trim()) return;

    // Check gate not already occupied
    const gateOccupied = flights.some(f => f.id !== changeGateFlight.id && f.gate === newGate.toUpperCase() && f.terminal === (newTerminal.toUpperCase() || changeGateFlight.terminal));
    if (gateOccupied) {
      toast({ title: 'Gate already occupied by another flight', variant: 'destructive' });
      return;
    }

    const oldGate = changeGateFlight.gate;
    updateFlightGate(changeGateFlight.id, newTerminal.toUpperCase() || changeGateFlight.terminal, newGate.toUpperCase());

    // Notify ground staff via message board
    addMessage({
      boardType: 'ground',
      senderName: `${user.firstName} ${user.lastName}`,
      senderRole: 'gate_staff',
      airlineCode: airlineCode,
      messageType: 'gate_change',
      content: `GATE CHANGE: Flight ${changeGateFlight.airlineCode}${changeGateFlight.flightNumber} has been moved from Gate ${oldGate} to Gate ${newGate.toUpperCase()}. Please redirect bags accordingly.`,
    });

    toast({ 
      title: 'Gate changed', 
      description: `Flight ${changeGateFlight.airlineCode}${changeGateFlight.flightNumber} moved to Gate ${newGate.toUpperCase()}. Ground staff notified.`,
      className: 'bg-success text-success-foreground' 
    });

    setChangeGateFlight(null);
    setNewGate('');
    setNewTerminal('');
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
                  <TableHead>Flight</TableHead>
                  <TableHead>Destination</TableHead>
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
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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
                          {flight.airlineCode}{flight.flightNumber}
                          {isCurrentGate && <Badge variant="outline" className="ml-2 text-xs">Your Gate</Badge>}
                        </TableCell>
                        <TableCell>{flight.destination || '-'}</TableCell>
                        <TableCell>{flight.terminal}</TableCell>
                        <TableCell>{flight.gate}</TableCell>
                        <TableCell>{stats.boarded}/{stats.total} boarded</TableCell>
                        <TableCell>{stats.loadedBags}/{stats.totalBags} loaded</TableCell>
                        <TableCell>{getStatusBadge(stats.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setChangeGateFlight(flight); setNewGate(''); setNewTerminal(flight.terminal); }}
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Change Gate
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

      {/* Change Gate Dialog */}
      <Dialog open={!!changeGateFlight} onOpenChange={() => setChangeGateFlight(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Gate — {changeGateFlight?.airlineCode}{changeGateFlight?.flightNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Current: Terminal {changeGateFlight?.terminal}, Gate {changeGateFlight?.gate}
            </p>
            <div className="space-y-2">
              <Label>New Terminal</Label>
              <Input value={newTerminal} onChange={(e) => setNewTerminal(e.target.value)} placeholder="e.g., B" />
            </div>
            <div className="space-y-2">
              <Label>New Gate</Label>
              <Input value={newGate} onChange={(e) => setNewGate(e.target.value)} placeholder="e.g., B5" />
            </div>
            <p className="text-xs text-muted-foreground">Ground staff will be notified of this gate change.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeGateFlight(null)}>Cancel</Button>
            <Button onClick={handleChangeGate} disabled={!newGate.trim()}>Change Gate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
