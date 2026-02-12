import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PassengerStatusBadge, BagLocationBadge } from '@/components/StatusBadges';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { validateTicketNumber } from '@/lib/validation';
import { Search, UserCheck, Check, X, AlertCircle, Plane, Bell } from 'lucide-react';

export default function Boarding() {
  const { user } = useAuth();
  const { selectedGate, selectedFlight } = useOutletContext();
  const { passengers, bags, flights, getPassengerByTicket, getFlightById, getBagsByPassenger, getBagsByFlight, getPassengersByFlight, updatePassengerStatus, addMessage } = useData();
  const { toast } = useToast();

  const airlineCode = user?.airlineCode;

  const [ticketNumber, setTicketNumber] = useState('');
  const [foundPassenger, setFoundPassenger] = useState(undefined);
  const [searchError, setSearchError] = useState('');
  const [notifyDeparture, setNotifyDeparture] = useState(false);

  // Get passengers and bags for the selected flight/gate
  const gatePassengers = useMemo(() => {
    if (!selectedFlight) return [];
    return getPassengersByFlight(selectedFlight.id);
  }, [selectedFlight, passengers]);

  const gateBags = useMemo(() => {
    if (!selectedFlight) return [];
    return getBagsByFlight(selectedFlight.id);
  }, [selectedFlight, bags]);

  const gateStats = useMemo(() => {
    const total = gatePassengers.length;
    const boarded = gatePassengers.filter(p => p.status === 'boarded').length;
    const totalBags = gateBags.length;
    const loadedBags = gateBags.filter(b => b.location === 'loaded').length;
    const allBoarded = boarded === total && total > 0;
    const allLoaded = loadedBags === totalBags;
    const isReady = allBoarded && allLoaded;
    return { total, boarded, totalBags, loadedBags, isReady };
  }, [gatePassengers, gateBags]);

  const handleSearch = () => {
    setSearchError('');
    setFoundPassenger(undefined);

    if (!validateTicketNumber(ticketNumber)) {
      setSearchError('Ticket number must be exactly 10 digits');
      return;
    }

    const passenger = getPassengerByTicket(ticketNumber);
    if (!passenger) {
      setSearchError('Passenger not found');
      return;
    }

    const flight = getFlightById(passenger.flightId);
    if (!flight || flight.airlineCode !== airlineCode) {
      setSearchError('Passenger is not on your airline');
      return;
    }

    if (flight.gate !== selectedGate) {
      setSearchError(`Passenger is assigned to gate ${flight.gate}, not your gate (${selectedGate})`);
      return;
    }

    setFoundPassenger(passenger);
  };

  const passengerBags = foundPassenger ? getBagsByPassenger(foundPassenger.id) : [];
  const allBagsAtGate = passengerBags.every(bag => bag.location === 'gate');
  const canBoard = foundPassenger?.status === 'checked_in' && allBagsAtGate;

  const handleBoard = () => {
    if (!foundPassenger || !canBoard) return;

    updatePassengerStatus(foundPassenger.id, 'boarded');
    
    toast({ 
      title: 'Passenger boarded successfully', 
      description: `${foundPassenger.firstName} ${foundPassenger.lastName} has boarded`,
      className: 'bg-success text-success-foreground'
    });

    setTicketNumber('');
    setFoundPassenger(undefined);
  };

  const handleNotifyDeparture = () => {
    if (!selectedFlight) return;

    addMessage({
      boardType: 'admin',
      senderName: `${user.firstName} ${user.lastName}`,
      senderRole: 'gate_staff',
      airlineCode: airlineCode,
      messageType: 'departure_ready',
      flightId: selectedFlight.id,
      content: `Flight ${selectedFlight.airlineCode}${selectedFlight.flightNumber} at Gate ${selectedGate} is ready for departure. All ${gateStats.total} passengers boarded, all ${gateStats.totalBags} bags loaded. Destination: ${selectedFlight.destination || 'N/A'}.`,
    });

    toast({
      title: 'Admin notified',
      description: `Departure notification sent for flight ${selectedFlight.airlineCode}${selectedFlight.flightNumber}`,
      className: 'bg-success text-success-foreground'
    });

    setNotifyDeparture(false);
  };

  const flight = foundPassenger ? getFlightById(foundPassenger.flightId) : null;

  return (
    <div className="space-y-6">
      {/* Gate Info Card */}
      {selectedFlight && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Gate {selectedGate} — Flight {selectedFlight.airlineCode} {selectedFlight.flightNumber}
              </span>
              {gateStats.isReady && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setNotifyDeparture(true)}
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Inform Admin — Ready for Departure
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Terminal</p>
                <p className="font-medium text-lg">{selectedFlight.terminal}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gate</p>
                <p className="font-medium text-lg">{selectedFlight.gate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Passengers Boarded</p>
                <p className="font-medium text-lg">{gateStats.boarded} / {gateStats.total}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Bags Loaded</p>
                <p className="font-medium text-lg">{gateStats.loadedBags} / {gateStats.totalBags}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedFlight && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No flight is currently assigned to Gate {selectedGate}.
          </CardContent>
        </Card>
      )}

      {/* Passenger Manifest */}
      {selectedFlight && gatePassengers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Passenger Manifest ({gatePassengers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
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
                  {gatePassengers.map((p) => {
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
          </CardContent>
        </Card>
      )}

      {/* Search & Board Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Board a Passenger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="ticketSearch">Ticket Number (10 digits)</Label>
              <Input
                id="ticketSearch"
                placeholder="Enter ticket number"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className={searchError ? 'border-destructive' : ''}
              />
              {searchError && <p className="text-xs text-destructive mt-1">{searchError}</p>}
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Found Passenger Details */}
      {foundPassenger && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Passenger Information</span>
              <PassengerStatusBadge status={foundPassenger.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{foundPassenger.firstName} {foundPassenger.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Identification</p>
                <p className="font-medium">{foundPassenger.identification}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Flight</p>
                <p className="font-medium">{flight?.airlineCode} {flight?.flightNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gate</p>
                <p className="font-medium text-lg">{flight?.gate}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Bags Verification ({passengerBags.length})</h4>
              {passengerBags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bags checked</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bag ID</TableHead>
                      <TableHead>Current Location</TableHead>
                      <TableHead>At Gate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passengerBags.map((bag) => (
                      <TableRow key={bag.id}>
                        <TableCell className="font-mono">{bag.bagId}</TableCell>
                        <TableCell>
                          <BagLocationBadge location={bag.location} />
                        </TableCell>
                        <TableCell>
                          {bag.location === 'gate' ? (
                            <Check className="h-5 w-5 text-success" />
                          ) : (
                            <X className="h-5 w-5 text-destructive" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {!allBagsAtGate && passengerBags.length > 0 && (
                <div className="flex items-center gap-2 text-warning p-3 bg-warning/10 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">Not all bags are at the gate. Passenger cannot board.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              {canBoard ? (
                <Button onClick={handleBoard}>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Board Passenger
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button disabled>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Board Passenger
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {foundPassenger.status === 'boarded' 
                      ? 'Passenger has already boarded'
                      : foundPassenger.status === 'not_checked_in'
                      ? 'Passenger has not checked in'
                      : 'All bags must be at the gate before boarding'}
                  </TooltipContent>
                </Tooltip>
              )}
              <Button variant="ghost" onClick={() => { setTicketNumber(''); setFoundPassenger(undefined); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notify Departure Confirmation */}
      <ConfirmDialog
        open={notifyDeparture}
        onOpenChange={() => setNotifyDeparture(false)}
        title="Notify Departure"
        description={`All ${gateStats.total} passengers boarded and all ${gateStats.totalBags} bags loaded. Inform admin that flight ${selectedFlight?.airlineCode}${selectedFlight?.flightNumber} is ready for departure?`}
        confirmLabel="Notify Admin"
        onConfirm={handleNotifyDeparture}
      />
    </div>
  );
}
