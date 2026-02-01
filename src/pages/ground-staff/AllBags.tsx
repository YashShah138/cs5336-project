import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { BagLocation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { BagLocationBadge } from '@/components/StatusBadges';
import { Briefcase, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 10;

export default function AllBags() {
  const { bags, passengers, flights, getPassengerById, getFlightById } = useData();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<BagLocation | 'all'>('all');
  const [airlineFilter, setAirlineFilter] = useState<string>('all');
  const [flightFilter, setFlightFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // View modal
  const [viewBag, setViewBag] = useState<string | null>(null);

  const uniqueAirlines = useMemo(() => {
    const codes = new Set(flights.map(f => f.airlineCode));
    return Array.from(codes);
  }, [flights]);

  const filteredBags = useMemo(() => {
    return bags.filter((bag) => {
      const passenger = getPassengerById(bag.passengerId);
      const flight = getFlightById(bag.flightId);

      const matchesSearch = 
        bag.bagId.includes(searchTerm) ||
        passenger?.ticketNumber.includes(searchTerm) ||
        passenger?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        passenger?.lastName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLocation = locationFilter === 'all' || bag.location === locationFilter;
      const matchesAirline = airlineFilter === 'all' || flight?.airlineCode === airlineFilter;
      const matchesFlight = flightFilter === 'all' || bag.flightId === flightFilter;

      return matchesSearch && matchesLocation && matchesAirline && matchesFlight;
    });
  }, [bags, searchTerm, locationFilter, airlineFilter, flightFilter, getPassengerById, getFlightById]);

  const paginatedBags = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBags.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBags, currentPage]);

  const totalPages = Math.ceil(filteredBags.length / ITEMS_PER_PAGE);

  const viewBagData = viewBag ? bags.find(b => b.id === viewBag) : null;
  const viewBagPassenger = viewBagData ? getPassengerById(viewBagData.passengerId) : null;
  const viewBagFlight = viewBagData ? getFlightById(viewBagData.flightId) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            All Bags ({bags.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bag ID, ticket, name..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={locationFilter} onValueChange={(v) => { setLocationFilter(v as BagLocation | 'all'); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="check_in">Check-In</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="gate">Gate</SelectItem>
                <SelectItem value="loaded">Loaded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={airlineFilter} onValueChange={(v) => { setAirlineFilter(v); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Airline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Airlines</SelectItem>
                {uniqueAirlines.map((code) => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={flightFilter} onValueChange={(v) => { setFlightFilter(v); setCurrentPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Flight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flights</SelectItem>
                {flights.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.airlineCode} {f.flightNumber}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bag ID</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Airline</TableHead>
                  <TableHead>Flight</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Terminal</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No bags found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBags.map((bag) => {
                    const passenger = getPassengerById(bag.passengerId);
                    const flight = getFlightById(bag.flightId);
                    return (
                      <TableRow key={bag.id}>
                        <TableCell className="font-mono">{bag.bagId}</TableCell>
                        <TableCell>{passenger?.ticketNumber}</TableCell>
                        <TableCell>{passenger ? `${passenger.firstName} ${passenger.lastName}` : '-'}</TableCell>
                        <TableCell>{flight?.airlineCode}</TableCell>
                        <TableCell>{flight?.flightNumber}</TableCell>
                        <TableCell><BagLocationBadge location={bag.location} /></TableCell>
                        <TableCell>{bag.terminal}</TableCell>
                        <TableCell>{format(new Date(bag.updatedAt), 'HH:mm')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setViewBag(bag.id)}>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredBags.length)} of {filteredBags.length}
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

      {/* View Bag Modal */}
      <Dialog open={!!viewBag} onOpenChange={() => setViewBag(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bag Details: {viewBagData?.bagId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Passenger</p>
                <p className="font-medium">{viewBagPassenger?.firstName} {viewBagPassenger?.lastName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ticket</p>
                <p className="font-medium">{viewBagPassenger?.ticketNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Flight</p>
                <p className="font-medium">{viewBagFlight?.airlineCode} {viewBagFlight?.flightNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Location</p>
                {viewBagData && <BagLocationBadge location={viewBagData.location} />}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Location History</h4>
              <div className="space-y-2">
                {viewBagData?.locationHistory.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <BagLocationBadge location={entry.location} />
                      {entry.updatedBy && <span className="text-xs text-muted-foreground">by {entry.updatedBy}</span>}
                    </div>
                    <span className="text-muted-foreground">
                      {format(new Date(entry.timestamp), 'MMM d, HH:mm')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewBag(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
