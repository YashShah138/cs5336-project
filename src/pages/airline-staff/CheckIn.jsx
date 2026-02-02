import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { PassengerStatusBadge } from '@/components/StatusBadges';
import { useToast } from '@/hooks/use-toast';
import { validateTicketNumber } from '@/lib/validation';
import { generateBagId } from '@/lib/generators';
import { Search, Briefcase, AlertTriangle, Check, X } from 'lucide-react';

export default function CheckIn() {
  const { user } = useAuth();
  const { passengers, flights, bags, getPassengerByTicket, getFlightById, addBag, updatePassengerStatus, addIssue } = useData();
  const { toast } = useToast();

  const staffUser = user;
  const airlineCode = staffUser?.airlineCode;

  // Search state
  const [ticketNumber, setTicketNumber] = useState('');
  const [foundPassenger, setFoundPassenger] = useState(undefined);
  const [searchError, setSearchError] = useState('');

  // Check-in state
  const [bagCount, setBagCount] = useState(0);
  const [bagDetails, setBagDetails] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Issue modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueType, setIssueType] = useState('security_violation');
  const [issueDescription, setIssueDescription] = useState('');

  const handleSearch = () => {
    setSearchError('');
    setFoundPassenger(undefined);
    setBagCount(0);
    setBagDetails([]);

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

    if (passenger.status !== 'not_checked_in') {
      setSearchError('Passenger has already checked in');
      return;
    }

    setFoundPassenger(passenger);
  };

  const handleBagCountChange = (count) => {
    const num = parseInt(count) || 0;
    setBagCount(num);
    
    const flight = foundPassenger ? getFlightById(foundPassenger.flightId) : null;
    const newBags = Array.from({ length: num }, (_, i) => ({
      bagId: bagDetails[i]?.bagId || generateBagId(),
      counter: bagDetails[i]?.counter || '',
    }));
    setBagDetails(newBags);
  };

  const updateBagCounter = (index, counter) => {
    const updated = [...bagDetails];
    updated[index] = { ...updated[index], counter };
    setBagDetails(updated);
  };

  const handleCheckIn = () => {
    if (!foundPassenger) return;

    // Validate counters
    if (bagDetails.some(b => !b.counter.trim())) {
      toast({ title: 'Please enter counter number for all bags', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    const flight = getFlightById(foundPassenger.flightId);
    
    // Add bags
    bagDetails.forEach((bag) => {
      addBag({
        bagId: bag.bagId,
        passengerId: foundPassenger.id,
        flightId: foundPassenger.flightId,
        location: 'check_in',
        terminal: flight?.terminal || '',
        counterNumber: bag.counter,
      });
    });

    // Update passenger status
    updatePassengerStatus(foundPassenger.id, 'checked_in');

    toast({ 
      title: 'Check-in complete', 
      description: `${foundPassenger.firstName} ${foundPassenger.lastName} checked in with ${bagCount} bag(s)`,
      className: 'bg-success text-success-foreground'
    });

    // Reset
    setTicketNumber('');
    setFoundPassenger(undefined);
    setBagCount(0);
    setBagDetails([]);
    setIsProcessing(false);
  };

  const handleReportIssue = () => {
    if (!foundPassenger || !issueDescription.trim()) return;

    addIssue({
      type: issueType,
      description: issueDescription,
      passengerId: foundPassenger.id,
      reportedBy: `${staffUser.firstName} ${staffUser.lastName}`,
    });

    toast({ 
      title: 'Issue reported', 
      description: issueType === 'security_violation' ? 'Security has been notified' : 'Passenger flagged for removal',
      className: 'bg-warning text-warning-foreground'
    });

    setShowIssueModal(false);
    setIssueDescription('');
    setTicketNumber('');
    setFoundPassenger(undefined);
  };

  const handleCancel = () => {
    setTicketNumber('');
    setFoundPassenger(undefined);
    setBagCount(0);
    setBagDetails([]);
    setSearchError('');
  };

  const flight = foundPassenger ? getFlightById(foundPassenger.flightId) : null;

  return (
    <div className="space-y-6">
      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Passenger
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

      {/* Passenger Details & Check-in */}
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
                <p className="text-sm text-muted-foreground">Terminal / Gate</p>
                <p className="font-medium">{flight?.terminal} / {flight?.gate}</p>
              </div>
            </div>

            {/* Bag Selection */}
            <div className="space-y-4">
              <div className="w-48">
                <Label>Number of Bags</Label>
                <Select value={String(bagCount)} onValueChange={handleBagCountChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 11 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>{i} bag{i !== 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bag Details */}
              {bagCount > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Bag Details
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {bagDetails.map((bag, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Bag {index + 1}</span>
                          <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{bag.bagId}</span>
                        </div>
                        <div>
                          <Label className="text-xs">Counter Number</Label>
                          <Input
                            placeholder="e.g., C12"
                            value={bag.counter}
                            onChange={(e) => updateBagCounter(index, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Terminal: {flight?.terminal} (auto-filled)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              <Button onClick={handleCheckIn} disabled={isProcessing}>
                <Check className="mr-2 h-4 w-4" />
                Complete Check-In
              </Button>
              <Button variant="outline" onClick={() => setShowIssueModal(true)}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Report Issue
              </Button>
              <Button variant="ghost" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issue Modal */}
      <Dialog open={showIssueModal} onOpenChange={setShowIssueModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Issue Type</Label>
              <Select value={issueType} onValueChange={(v) => setIssueType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="security_violation">Security Violation</SelectItem>
                  <SelectItem value="passenger_removal">Passenger Needs Removal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the issue..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIssueModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReportIssue}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
