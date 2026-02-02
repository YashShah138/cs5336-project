import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { BagLocationBadge } from '@/components/StatusBadges';
import { useToast } from '@/hooks/use-toast';
import { Truck, Package, Check, X } from 'lucide-react';

export default function LoadBags() {
  const { user } = useAuth();
  const { bags, passengers, flights, getPassengerById, getFlightById, updateBagLocation } = useData();
  const { toast } = useToast();
  const staffUser = user;
  const [loadBagId, setLoadBagId] = useState(null);
  const gateBags = useMemo(() => bags.filter(b => b.location === 'gate'), [bags]);

  const handleLoadBag = () => {
    if (!loadBagId) return;
    const bag = bags.find(b => b.id === loadBagId);
    if (!bag) return;
    updateBagLocation(bag.id, 'loaded', undefined, `${staffUser.firstName} ${staffUser.lastName}`);
    toast({ title: 'Bag loaded', description: `Bag ${bag.bagId} has been loaded onto the aircraft`, className: 'bg-success text-success-foreground' });
    setLoadBagId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Load Bags ({gateBags.length} at gate)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Bag ID</TableHead><TableHead>Ticket</TableHead><TableHead>Passenger</TableHead><TableHead>Passenger Status</TableHead><TableHead>Airline</TableHead><TableHead>Flight</TableHead><TableHead>Gate</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {gateBags.length === 0 ? (<TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No bags at gate ready for loading</TableCell></TableRow>) : (
                  gateBags.map((bag) => {
                    const passenger = getPassengerById(bag.passengerId);
                    const flight = getFlightById(bag.flightId);
                    const isBoarded = passenger?.status === 'boarded';
                    return (
                      <TableRow key={bag.id}>
                        <TableCell className="font-mono">{bag.bagId}</TableCell>
                        <TableCell>{passenger?.ticketNumber}</TableCell>
                        <TableCell>{passenger ? `${passenger.firstName} ${passenger.lastName}` : '-'}</TableCell>
                        <TableCell><div className="flex items-center gap-2">{isBoarded ? (<><Check className="h-4 w-4 text-success" /><span className="text-success text-sm">Boarded</span></>) : (<><X className="h-4 w-4 text-destructive" /><span className="text-destructive text-sm">Not Boarded</span></>)}</div></TableCell>
                        <TableCell>{flight?.airlineCode}</TableCell>
                        <TableCell>{flight?.flightNumber}</TableCell>
                        <TableCell>{flight?.gate}</TableCell>
                        <TableCell className="text-right">{isBoarded ? (<Button variant="ghost" size="sm" onClick={() => setLoadBagId(bag.id)} className="text-success hover:text-success"><Package className="mr-2 h-4 w-4" />Load Bag</Button>) : (<Tooltip><TooltipTrigger asChild><span><Button variant="ghost" size="sm" disabled><Package className="mr-2 h-4 w-4" />Load Bag</Button></span></TooltipTrigger><TooltipContent>Passenger must board before loading bag</TooltipContent></Tooltip>)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog open={!!loadBagId} onOpenChange={() => setLoadBagId(null)} title="Load Bag" description="Confirm this bag should be loaded onto the aircraft?" confirmLabel="Load Bag" onConfirm={handleLoadBag} />
    </div>
  );
}
