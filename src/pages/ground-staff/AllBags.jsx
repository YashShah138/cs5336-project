import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { BagLocationBadge } from '@/components/StatusBadges';
import { Briefcase, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

export default function AllBags() {
  const { selectedGate, selectedFlight } = useOutletContext();
  const { bags, passengers, flights, getPassengerById, getFlightById } = useData();
  const [viewBag, setViewBag] = useState(null);

  // Show all bags arriving at or at this gate (for the selected flight)
  const gateBags = useMemo(() => {
    if (!selectedFlight) return [];
    return bags.filter(b => b.flightId === selectedFlight.id);
  }, [bags, selectedFlight]);

  const viewBagData = viewBag ? bags.find(b => b.id === viewBag) : null;
  const viewBagPassenger = viewBagData ? getPassengerById(viewBagData.passengerId) : null;
  const viewBagFlight = viewBagData ? getFlightById(viewBagData.flightId) : null;

  if (!selectedFlight) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No flight at your selected gate.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Bags for Gate {selectedGate} — {selectedFlight.airlineCode}{selectedFlight.flightNumber} ({gateBags.length})
          </CardTitle>
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
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gateBags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No bags found for this flight
                    </TableCell>
                  </TableRow>
                ) : (
                  gateBags.map((bag) => {
                    const passenger = getPassengerById(bag.passengerId);
                    return (
                      <TableRow key={bag.id}>
                        <TableCell className="font-mono">{bag.bagId}</TableCell>
                        <TableCell>{passenger?.ticketNumber}</TableCell>
                        <TableCell>{passenger ? `${passenger.firstName} ${passenger.lastName}` : '-'}</TableCell>
                        <TableCell><BagLocationBadge location={bag.location} /></TableCell>
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
        </CardContent>
      </Card>

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
                <p className="font-medium">{viewBagFlight?.airlineCode}{viewBagFlight?.flightNumber}</p>
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
                    <span className="text-muted-foreground">{format(new Date(entry.timestamp), 'MMM d, HH:mm')}</span>
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
