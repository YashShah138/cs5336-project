import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { validateAirlineCode, validateFlightNumber } from '@/lib/validation';
import { Plus, Search, Eye, Trash2, ArrowUpDown } from 'lucide-react';
import { PassengerStatusBadge } from '@/components/StatusBadges';

export default function FlightsManagement() {
  const { flights, passengers, addFlight, removeFlight, getPassengersByFlight } = useData();
  const { toast } = useToast();

  // Form state
  const [airlineCode, setAirlineCode] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [terminal, setTerminal] = useState('');
  const [gate, setGate] = useState('');
  const [errors, setErrors] = useState({});

  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('flightNumber');
  const [sortDirection, setSortDirection] = useState('asc');

  // Modal state
  const [viewFlight, setViewFlight] = useState(null);
  const [deleteFlightId, setDeleteFlightId] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (!validateAirlineCode(airlineCode)) {
      newErrors.airlineCode = 'Must be exactly 2 letters';
    }
    if (!validateFlightNumber(flightNumber)) {
      newErrors.flightNumber = 'Must be exactly 4 digits';
    }
    if (!terminal.trim()) {
      newErrors.terminal = 'Terminal is required';
    }
    if (!gate.trim()) {
      newErrors.gate = 'Gate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddFlight = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Check for duplicate flight
    const exists = flights.some(
      f => f.airlineCode === airlineCode.toUpperCase() && f.flightNumber === flightNumber
    );
    if (exists) {
      toast({ title: 'Flight already exists', variant: 'destructive' });
      return;
    }

    addFlight({
      airlineCode: airlineCode.toUpperCase(),
      flightNumber,
      terminal: terminal.toUpperCase(),
      gate: gate.toUpperCase(),
    });

    toast({ title: 'Flight added successfully', className: 'bg-success text-success-foreground' });
    setAirlineCode('');
    setFlightNumber('');
    setTerminal('');
    setGate('');
    setErrors({});
  };

  const handleDeleteFlight = () => {
    if (deleteFlightId) {
      removeFlight(deleteFlightId);
      toast({ title: 'Flight removed successfully', className: 'bg-success text-success-foreground' });
      setDeleteFlightId(null);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedFlights = useMemo(() => {
    let filtered = flights.filter(
      f => f.airlineCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
           f.flightNumber.includes(searchTerm)
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'airlineCode':
          comparison = a.airlineCode.localeCompare(b.airlineCode);
          break;
        case 'flightNumber':
          comparison = a.flightNumber.localeCompare(b.flightNumber);
          break;
        case 'terminal':
          comparison = a.terminal.localeCompare(b.terminal);
          break;
        case 'gate':
          comparison = a.gate.localeCompare(b.gate);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [flights, searchTerm, sortField, sortDirection]);

  const viewFlightData = viewFlight ? flights.find(f => f.id === viewFlight) : null;
  const viewFlightPassengers = viewFlight ? getPassengersByFlight(viewFlight) : [];

  return (
    <div className="space-y-6">
      {/* Add Flight Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Flight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddFlight} className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="airlineCode">Airline Code (2 letters)</Label>
              <Input
                id="airlineCode"
                placeholder="e.g., AA"
                value={airlineCode}
                onChange={(e) => setAirlineCode(e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2))}
                className={errors.airlineCode ? 'border-destructive' : ''}
              />
              {errors.airlineCode && <p className="text-xs text-destructive">{errors.airlineCode}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="flightNumber">Flight Number (4 digits)</Label>
              <Input
                id="flightNumber"
                placeholder="e.g., 1234"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className={errors.flightNumber || (flightNumber.length > 0 && flightNumber.length < 4) ? 'border-destructive' : ''}
              />
              {(errors.flightNumber || (flightNumber.length > 0 && flightNumber.length < 4)) && (
                <p className="text-xs text-destructive">Must be exactly 4 digits</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="terminal">Terminal</Label>
              <Input
                id="terminal"
                placeholder="e.g., A"
                value={terminal}
                onChange={(e) => setTerminal(e.target.value)}
                className={errors.terminal ? 'border-destructive' : ''}
              />
              {errors.terminal && <p className="text-xs text-destructive">{errors.terminal}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gate">Gate Number</Label>
              <Input
                id="gate"
                placeholder="e.g., A12"
                value={gate}
                onChange={(e) => setGate(e.target.value)}
                className={errors.gate ? 'border-destructive' : ''}
              />
              {errors.gate && <p className="text-xs text-destructive">{errors.gate}</p>}
            </div>
            <div className="sm:col-span-2 md:col-span-4 flex justify-end">
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Add Flight
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Flights Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle>All Flights ({flights.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by airline or flight..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('airlineCode')} className="cursor-pointer hover:bg-muted">
                    <div className="flex items-center gap-1">
                      Airline Code
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('flightNumber')} className="cursor-pointer hover:bg-muted">
                    <div className="flex items-center gap-1">
                      Flight Number
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('terminal')} className="cursor-pointer hover:bg-muted">
                    <div className="flex items-center gap-1">
                      Terminal
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('gate')} className="cursor-pointer hover:bg-muted">
                    <div className="flex items-center gap-1">
                      Gate
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Passengers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedFlights.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No flights found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedFlights.map((flight) => {
                    const passengerCount = passengers.filter(p => p.flightId === flight.id).length;
                    return (
                      <TableRow key={flight.id}>
                        <TableCell className="font-medium">{flight.airlineCode}</TableCell>
                        <TableCell>{flight.flightNumber}</TableCell>
                        <TableCell>{flight.terminal}</TableCell>
                        <TableCell>{flight.gate}</TableCell>
                        <TableCell>{passengerCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewFlight(flight.id)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteFlightId(flight.id)}
                              className="text-destructive hover:text-destructive"
                              title="Remove Flight"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Flight Details: {viewFlightData?.airlineCode} {viewFlightData?.flightNumber}
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
                <p className="text-muted-foreground text-sm">No passengers registered</p>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Ticket</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewFlightPassengers.map((passenger) => (
                        <TableRow key={passenger.id}>
                          <TableCell>{passenger.firstName} {passenger.lastName}</TableCell>
                          <TableCell>{passenger.ticketNumber}</TableCell>
                          <TableCell>
                            <PassengerStatusBadge status={passenger.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewFlight(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteFlightId}
        onOpenChange={() => setDeleteFlightId(null)}
        title="Remove Flight"
        description={`Are you sure you want to remove the flight "${(() => { const f = flights.find(f => f.id === deleteFlightId); return f ? `${f.airlineCode} ${f.flightNumber}` : ''; })()}"? This will also remove all associated passengers and their bags.`}
        confirmLabel="Remove Flight"
        onConfirm={handleDeleteFlight}
        isDestructive
      />
    </div>
  );
}
