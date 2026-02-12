import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { BagLocationBadge } from '@/components/StatusBadges';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Check, AlertTriangle } from 'lucide-react';

export default function SecurityClearance() {
  const { user } = useAuth();
  const { bags, passengers, flights, getPassengerById, getFlightById, updateBagLocation, addMessage } = useData();
  const { toast } = useToast();

  const staffUser = user;

  const [clearBagId, setClearBagId] = useState(null);
  const [reportBag, setReportBag] = useState(null);
  const [violationDescription, setViolationDescription] = useState('');

  // Bags at check-in (queue) or security
  const pendingBags = useMemo(() => {
    return bags.filter(b => b.location === 'check_in' || b.location === 'security');
  }, [bags]);

  const handleMoveTosecurity = (bagId) => {
    const bag = bags.find(b => b.id === bagId);
    if (!bag) return;
    if (bag.location === 'check_in') {
      updateBagLocation(bag.id, 'security', undefined, `${staffUser.firstName} ${staffUser.lastName}`);
      toast({
        title: 'Bag moved to security check',
        description: `Bag ${bag.bagId} is now at security check`,
        className: 'bg-success text-success-foreground'
      });
    }
  };

  const handleClearSecurity = () => {
    if (!clearBagId) return;
    
    const bag = bags.find(b => b.id === clearBagId);
    if (!bag) return;

    const flight = getFlightById(bag.flightId);
    updateBagLocation(bag.id, 'gate', flight?.gate, `${staffUser.firstName} ${staffUser.lastName}`);

    toast({
      title: 'Bag cleared for gate',
      description: `Bag ${bag.bagId} cleared security and moved to gate ${flight?.gate || ''}`,
      className: 'bg-success text-success-foreground'
    });

    setClearBagId(null);
  };

  const handleReportViolation = () => {
    if (!reportBag || !violationDescription.trim()) return;

    const bag = bags.find(b => b.id === reportBag);
    if (!bag) return;

    const passenger = getPassengerById(bag.passengerId);
    const flight = getFlightById(bag.flightId);

    // Update bag location to security_violation
    updateBagLocation(bag.id, 'security_violation', undefined, `${staffUser.firstName} ${staffUser.lastName}`);

    // Send message to airline staff message board
    addMessage({
      boardType: 'airline',
      senderName: `${staffUser.firstName} ${staffUser.lastName}`,
      senderRole: 'ground_staff',
      airlineCode: flight?.airlineCode,
      messageType: 'security_violation',
      bagId: bag.bagId,
      passengerId: bag.passengerId,
      passengerName: passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Unknown',
      flightInfo: flight ? `${flight.airlineCode}${flight.flightNumber}` : '',
      content: `SECURITY VIOLATION: Bag ${bag.bagId} belonging to passenger ${passenger ? `${passenger.firstName} ${passenger.lastName}` : 'Unknown'} (Ticket: ${passenger?.ticketNumber || ''}) on flight ${flight ? `${flight.airlineCode}${flight.flightNumber}` : ''}. Violation: ${violationDescription}. ACTION REQUIRED: Remove all bags of this passenger and inform administrator to remove passenger.`,
    });

    toast({
      title: 'Security violation reported',
      description: 'Message sent to airline staff message board',
      className: 'bg-warning text-warning-foreground'
    });

    setReportBag(null);
    setViolationDescription('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Security Clearance ({pendingBags.length} pending)
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
                  <TableHead>Flight</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingBags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No bags pending security clearance
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingBags.map((bag) => {
                    const passenger = getPassengerById(bag.passengerId);
                    const flight = getFlightById(bag.flightId);
                    const isAtCheckIn = bag.location === 'check_in';
                    const isAtSecurity = bag.location === 'security';
                    return (
                      <TableRow key={bag.id}>
                        <TableCell className="font-mono">{bag.bagId}</TableCell>
                        <TableCell>{passenger?.ticketNumber}</TableCell>
                        <TableCell>{passenger ? `${passenger.firstName} ${passenger.lastName}` : '-'}</TableCell>
                        <TableCell>{flight ? `${flight.airlineCode}${flight.flightNumber}` : '-'}</TableCell>
                        <TableCell><BagLocationBadge location={bag.location} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {isAtCheckIn && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleMoveTosecurity(bag.id)}
                                title="Move to Security Check"
                              >
                                Move to Security
                              </Button>
                            )}
                            {isAtSecurity && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => setClearBagId(bag.id)}
                                  className="text-success hover:text-success"
                                  title="Clear Security"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => setReportBag(bag.id)}
                                  className="text-warning hover:text-warning"
                                  title="Report Violation"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </Button>
                              </>
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

      {/* Clear Security Confirmation */}
      <ConfirmDialog
        open={!!clearBagId}
        onOpenChange={() => setClearBagId(null)}
        title="Clear Security"
        description="Confirm this bag has passed security checks and should be moved to the gate?"
        confirmLabel="Clear for Gate"
        onConfirm={handleClearSecurity}
      />

      {/* Report Violation Modal */}
      <Dialog open={!!reportBag} onOpenChange={() => setReportBag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Security Violation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This will send a message to the airline staff message board. The airline staff will then remove all bags 
              of this passenger and inform the administrator to remove the passenger from the system.
            </p>
            <div className="space-y-2">
              <Label>Violation Description</Label>
              <Textarea
                placeholder="Describe the security violation..."
                value={violationDescription}
                onChange={(e) => setViolationDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportBag(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReportViolation} disabled={!violationDescription.trim()}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
