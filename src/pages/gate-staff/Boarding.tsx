import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PassengerStatusBadge, BagLocationBadge } from '@/components/StatusBadges';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { validateTicketNumber } from '@/lib/validation';
import { Search, UserCheck, Check, X, AlertCircle } from 'lucide-react';

export default function Boarding() {
  const { user } = useAuth();
  const { passengers, bags, flights, getPassengerByTicket, getFlightById, getBagsByPassenger, updatePassengerStatus } = useData();
  const { toast } = useToast();

  const staffUser = user as User;
  const airlineCode = staffUser?.airlineCode;

  const [ticketNumber, setTicketNumber] = useState('');
  const [foundPassenger, setFoundPassenger] = useState<ReturnType<typeof getPassengerByTicket>>(undefined);
  const [searchError, setSearchError] = useState('');

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

  const flight = foundPassenger ? getFlightById(foundPassenger.flightId) : null;

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Passenger for Boarding
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

      {/* Passenger Details & Boarding */}
      {foundPassenger && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Passenger Information</span>
              <PassengerStatusBadge status={foundPassenger.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Passenger Info */}
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

            {/* Bags Verification */}
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

            {/* Actions */}
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
    </div>
  );
}
