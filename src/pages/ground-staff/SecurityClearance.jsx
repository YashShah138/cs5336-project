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
  const { bags, passengers, flights, getPassengerById, getFlightById, updateBagLocation, addIssue } = useData();
  const { toast } = useToast();

  const staffUser = user;

  const [clearBagId, setClearBagId] = useState(null);
  const [reportBag, setReportBag] = useState(null);
  const [violationDescription, setViolationDescription] = useState('');

  // Bags at check-in or security
  const pendingBags = useMemo(() => {
    return bags.filter(b => b.location === 'check_in' || b.location === 'security');
  }, [bags]);

  const handleClearSecurity = () => {
    if (!clearBagId) return;
    
    const bag = bags.find(b => b.id === clearBagId);
    if (!bag) return;

    const flight = getFlightById(bag.flightId);
    updateBagLocation(bag.id, 'gate', flight?.gate, `${staffUser.firstName} ${staffUser.lastName}`);

    toast({
      title: 'Bag cleared for gate',
      description: `Bag ${bag.bagId} cleared security and moved to gate`,
      className: 'bg-success text-success-foreground'
    });

    setClearBagId(null);
  };

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
      title: 'Security violation reported',
      description: 'The incident has been logged',
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
                  <TableHead>Airline</TableHead>
                  <TableHead>Flight</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingBags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No bags pending security clearance
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingBags.map((bag) => {
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
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
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
            <div className="space-y-2">
              <Label>Description</Label>
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
            <Button variant="destructive" onClick={handleReportViolation}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
