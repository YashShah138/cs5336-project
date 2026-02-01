import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { User, BagLocation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BagLocationBadge } from '@/components/StatusBadges';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Eye, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function BagsManagement() {
  const { user } = useAuth();
  const { bags, passengers, flights, getPassengerById, getFlightById, addIssue } = useData();
  const { toast } = useToast();

  const staffUser = user as User;
  const airlineCode = staffUser?.airlineCode;

  // Filters
  const [locationFilter, setLocationFilter] = useState<BagLocation | 'all'>('all');

  // Modals
  const [viewBag, setViewBag] = useState<string | null>(null);
  const [reportBag, setReportBag] = useState<string | null>(null);
  const [violationDescription, setViolationDescription] = useState('');

  // Filter bags by airline
  const airlineBags = useMemo(() => {
    return bags.filter(bag => {
      const flight = getFlightById(bag.flightId);
      return flight?.airlineCode === airlineCode;
    });
  }, [bags, airlineCode, getFlightById]);

  const filteredBags = useMemo(() => {
    if (locationFilter === 'all') return airlineBags;
    return airlineBags.filter(b => b.location === locationFilter);
  }, [airlineBags, locationFilter]);

  const viewBagData = viewBag ? bags.find(b => b.id === viewBag) : null;
  const viewBagPassenger = viewBagData ? getPassengerById(viewBagData.passengerId) : null;
  const viewBagFlight = viewBagData ? getFlightById(viewBagData.flightId) : null;

  const handleReportViolation = () => {
    if (!reportBag || !violationDescription.trim()) return;

    const bag = bags.find(b => b.id === reportBag);
    if (!bag) return;

    addIssue({
      type: 'security_violation',
      description: violationDescription,
      bagId: bag.bagId,
      passengerId: bag.passengerId,
      reportedBy: `${staffUser.firstName} ${staffUser.lastName}`,
    });

    toast({ 
      title: 'Violation reported', 
      description: 'Security has been notified',
      className: 'bg-warning text-warning-foreground'
    });

    setReportBag(null);
    setViolationDescription('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Bags for {airlineCode} ({filteredBags.length})
            </CardTitle>
            <Select value={locationFilter} onValueChange={(v) => setLocationFilter(v as BagLocation | 'all')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="check_in">Check-In</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="gate">Gate</SelectItem>
                <SelectItem value="loaded">Loaded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bag ID</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Terminal</TableHead>
                  <TableHead>Counter/Gate</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No bags found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBags.map((bag) => {
                    const passenger = getPassengerById(bag.passengerId);
                    return (
                      <TableRow key={bag.id}>
                        <TableCell className="font-mono">{bag.bagId}</TableCell>
                        <TableCell>{passenger?.ticketNumber}</TableCell>
                        <TableCell>{passenger ? `${passenger.firstName} ${passenger.lastName}` : '-'}</TableCell>
                        <TableCell>
                          <BagLocationBadge location={bag.location} />
                        </TableCell>
                        <TableCell>{bag.terminal}</TableCell>
                        <TableCell>{bag.counterNumber || bag.gateNumber || '-'}</TableCell>
                        <TableCell>{format(new Date(bag.updatedAt), 'HH:mm')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setViewBag(bag.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {bag.location === 'security' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setReportBag(bag.id)}
                                className="text-warning hover:text-warning"
                              >
                                <AlertTriangle className="h-4 w-4" />
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
                    <BagLocationBadge location={entry.location} />
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

      {/* Report Violation Modal */}
      <Dialog open={!!reportBag} onOpenChange={() => setReportBag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Security Violation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the violation..."
                value={violationDescription}
                onChange={(e) => setViolationDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportBag(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReportViolation}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
