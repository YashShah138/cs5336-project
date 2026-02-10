import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PassengerStatusBadge, BagLocationBadge } from '@/components/StatusBadges';
import { useToast } from '@/hooks/use-toast';
import { validateName, validateIdentification, validateTicketNumber } from '@/lib/validation';
import { Plus, Search, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function PassengersManagement() {
  const { flights, passengers, bags, addPassenger, removePassenger, getPassengerById, getBagsByPassenger, getFlightById } = useData();
  const { toast } = useToast();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [identification, setIdentification] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [selectedFlight, setSelectedFlight] = useState('');
  const [errors, setErrors] = useState({});

  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [flightFilter, setFlightFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [viewPassenger, setViewPassenger] = useState(null);
  const [deletePassengerId, setDeletePassengerId] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    if (!validateName(firstName)) {
      newErrors.firstName = 'Minimum 2 letters required';
    }
    if (!validateName(lastName)) {
      newErrors.lastName = 'Minimum 2 letters required';
    }
    if (!validateIdentification(identification)) {
      newErrors.identification = 'Must be exactly 6 digits';
    }
    if (!validateTicketNumber(ticketNumber)) {
      newErrors.ticketNumber = 'Must be exactly 10 digits';
    }
    if (!selectedFlight) {
      newErrors.flight = 'Please select a flight';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPassenger = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Check for duplicate ticket
    const existingTicket = passengers.find(p => p.ticketNumber === ticketNumber);
    if (existingTicket) {
      toast({ title: 'Ticket number already exists', variant: 'destructive' });
      return;
    }

    addPassenger({
      firstName,
      lastName,
      identification,
      ticketNumber,
      flightId: selectedFlight,
    });

    toast({ title: 'Passenger added successfully', className: 'bg-success text-success-foreground' });
    setFirstName('');
    setLastName('');
    setIdentification('');
    setTicketNumber('');
    setSelectedFlight('');
    setErrors({});
  };

  const handleDeletePassenger = () => {
    if (deletePassengerId) {
      removePassenger(deletePassengerId);
      toast({ title: 'Passenger removed successfully', className: 'bg-success text-success-foreground' });
      setDeletePassengerId(null);
    }
  };

  const filteredPassengers = useMemo(() => {
    return passengers.filter((p) => {
      const matchesSearch = 
        p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.ticketNumber.includes(searchTerm) ||
        p.identification.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesFlight = flightFilter === 'all' || p.flightId === flightFilter;

      return matchesSearch && matchesStatus && matchesFlight;
    });
  }, [passengers, searchTerm, statusFilter, flightFilter]);

  const paginatedPassengers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPassengers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPassengers, currentPage]);

  const totalPages = Math.ceil(filteredPassengers.length / ITEMS_PER_PAGE);

  const viewPassengerData = viewPassenger ? getPassengerById(viewPassenger) : null;
  const viewPassengerFlight = viewPassengerData ? getFlightById(viewPassengerData.flightId) : null;
  const viewPassengerBags = viewPassenger ? getBagsByPassenger(viewPassenger) : [];

  return (
    <div className="space-y-6">
      {/* Add Passenger Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Passenger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPassenger} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name (min 2 letters)</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={errors.firstName ? 'border-destructive' : ''}
              />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name (min 2 letters)</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={errors.lastName ? 'border-destructive' : ''}
              />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="identification">Identification (6 digits)</Label>
              <Input
                id="identification"
                placeholder="123456"
                value={identification}
                onChange={(e) => setIdentification(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={errors.identification ? 'border-destructive' : ''}
              />
              {errors.identification && <p className="text-xs text-destructive">{errors.identification}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticketNumber">Ticket Number (10 digits)</Label>
              <Input
                id="ticketNumber"
                placeholder="1234567890"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className={errors.ticketNumber ? 'border-destructive' : ''}
              />
              {errors.ticketNumber && <p className="text-xs text-destructive">{errors.ticketNumber}</p>}
            </div>
            <div className="space-y-2">
              <Label>Flight</Label>
              <Select value={selectedFlight} onValueChange={setSelectedFlight}>
                <SelectTrigger className={errors.flight ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select flight" />
                </SelectTrigger>
                <SelectContent>
                  {flights.map((flight) => (
                    <SelectItem key={flight.id} value={flight.id}>
                      {flight.airlineCode} {flight.flightNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.flight && <p className="text-xs text-destructive">{errors.flight}</p>}
            </div>
            <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Add Passenger
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Passengers Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>All Passengers ({passengers.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ticket, or ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="not_checked_in">Not Checked In</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="boarded">Boarded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={flightFilter} onValueChange={(v) => { setFlightFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Flight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Flights</SelectItem>
                  {flights.map((flight) => (
                    <SelectItem key={flight.id} value={flight.id}>
                      {flight.airlineCode} {flight.flightNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Identification</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Flight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPassengers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No passengers found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPassengers.map((passenger) => {
                    const flight = getFlightById(passenger.flightId);
                    return (
                      <TableRow key={passenger.id}>
                        <TableCell className="font-medium">{passenger.firstName} {passenger.lastName}</TableCell>
                        <TableCell>{passenger.identification}</TableCell>
                        <TableCell>{passenger.ticketNumber}</TableCell>
                        <TableCell>{flight ? `${flight.airlineCode} ${flight.flightNumber}` : '-'}</TableCell>
                        <TableCell>
                          <PassengerStatusBadge status={passenger.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewPassenger(passenger.id)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletePassengerId(passenger.id)}
                              className="text-destructive hover:text-destructive"
                              title="Remove Passenger"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredPassengers.length)} of {filteredPassengers.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Passenger Modal */}
      <Dialog open={!!viewPassenger} onOpenChange={() => setViewPassenger(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Passenger Details: {viewPassengerData?.firstName} {viewPassengerData?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Identification</p>
                <p className="font-medium">{viewPassengerData?.identification}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ticket Number</p>
                <p className="font-medium">{viewPassengerData?.ticketNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Flight</p>
                <p className="font-medium">{viewPassengerFlight ? `${viewPassengerFlight.airlineCode} ${viewPassengerFlight.flightNumber}` : '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                {viewPassengerData && <PassengerStatusBadge status={viewPassengerData.status} />}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Bags ({viewPassengerBags.length})</h4>
              {viewPassengerBags.length === 0 ? (
                <p className="text-muted-foreground text-sm">No bags checked</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bag ID</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Terminal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewPassengerBags.map((bag) => (
                      <TableRow key={bag.id}>
                        <TableCell>{bag.bagId}</TableCell>
                        <TableCell>
                          <BagLocationBadge location={bag.location} />
                        </TableCell>
                        <TableCell>{bag.terminal}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPassenger(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletePassengerId}
        onOpenChange={() => setDeletePassengerId(null)}
        title="Remove Passenger"
        description={`Are you sure you want to remove the passenger with the name "${(() => { const p = passengers.find(p => p.id === deletePassengerId); return p ? `${p.firstName} ${p.lastName}` : ''; })()}"? This will also remove all associated bags.`}
        confirmLabel="Remove Passenger"
        onConfirm={handleDeletePassenger}
        isDestructive
      />
    </div>
  );
}
