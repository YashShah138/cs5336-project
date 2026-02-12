import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, RefreshCw, Plane, UserX, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminMessages() {
  const { user } = useAuth();
  const { messages, getMessagesByBoard, refreshData, removeFlight, removePassenger, getPassengerById, getFlightById, flights, passengers, bags } = useData();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [removePassengerId, setRemovePassengerId] = useState(null);
  const [removeFlightId, setRemoveFlightId] = useState(null);

  const adminMessages = getMessagesByBoard('admin');

  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleRemovePassenger = () => {
    if (!removePassengerId) return;
    const passenger = getPassengerById(removePassengerId);
    removePassenger(removePassengerId);
    toast({ 
      title: 'Passenger removed', 
      description: passenger ? `${passenger.firstName} ${passenger.lastName} has been removed from the system` : 'Passenger removed',
      className: 'bg-success text-success-foreground' 
    });
    setRemovePassengerId(null);
  };

  const handleRemoveFlight = () => {
    if (!removeFlightId) return;
    const flight = getFlightById(removeFlightId);
    removeFlight(removeFlightId);
    toast({ 
      title: 'Flight departed', 
      description: flight ? `Flight ${flight.airlineCode}${flight.flightNumber} and all passengers/bags removed` : 'Flight removed',
      className: 'bg-success text-success-foreground' 
    });
    setRemoveFlightId(null);
  };

  const getMessageActions = (message) => {
    const actions = [];

    // Departure notification - allow removing flight
    if (message.messageType === 'departure_ready' && message.flightId) {
      const flight = getFlightById(message.flightId);
      if (flight) {
        actions.push(
          <Button 
            key="depart" 
            size="sm" 
            variant="default"
            onClick={() => setRemoveFlightId(message.flightId)}
            className="bg-success hover:bg-success/90 text-success-foreground"
          >
            <Plane className="mr-2 h-4 w-4" />
            Remove Flight (Departed)
          </Button>
        );
      }
    }

    // Passenger removal request
    if (message.messageType === 'remove_passenger' && message.passengerId) {
      const passenger = getPassengerById(message.passengerId);
      if (passenger) {
        actions.push(
          <Button 
            key="remove" 
            size="sm" 
            variant="destructive"
            onClick={() => setRemovePassengerId(message.passengerId)}
          >
            <UserX className="mr-2 h-4 w-4" />
            Remove Passenger
          </Button>
        );
      }
    }

    return actions;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Admin Messages
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {adminMessages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No messages</p>
              ) : (
                adminMessages.map((message) => {
                  const actions = getMessageActions(message);
                  return (
                    <Card key={message.id} className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{message.senderName || message.staffName}</span>
                          {message.senderRole && (
                            <Badge variant="outline" className="text-xs">{message.senderRole.replace('_', ' ')}</Badge>
                          )}
                          {message.airlineCode && (
                            <Badge variant="outline" className="text-xs">{message.airlineCode}</Badge>
                          )}
                          {message.messageType === 'departure_ready' && (
                            <Badge className="bg-success text-success-foreground text-xs">Departure</Badge>
                          )}
                          {message.messageType === 'remove_passenger' && (
                            <Badge className="bg-destructive text-destructive-foreground text-xs">Removal Request</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap mb-3">{message.content}</p>
                      {actions.length > 0 && (
                        <div className="flex gap-2 pt-2 border-t">
                          {actions}
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Remove Passenger Confirmation */}
      <ConfirmDialog
        open={!!removePassengerId}
        onOpenChange={() => setRemovePassengerId(null)}
        title="Remove Passenger"
        description={`Are you sure you want to remove the passenger "${(() => { const p = getPassengerById(removePassengerId); return p ? `${p.firstName} ${p.lastName}` : ''; })()}" from the system? This will also remove all associated bags.`}
        confirmLabel="Remove Passenger"
        onConfirm={handleRemovePassenger}
        isDestructive
      />

      {/* Remove Flight Confirmation */}
      <ConfirmDialog
        open={!!removeFlightId}
        onOpenChange={() => setRemoveFlightId(null)}
        title="Remove Flight (Departed)"
        description={`Are you sure you want to remove flight "${(() => { const f = getFlightById(removeFlightId); return f ? `${f.airlineCode}${f.flightNumber}` : ''; })()}"? This will remove the flight and all passengers and their bags.`}
        confirmLabel="Remove Flight"
        onConfirm={handleRemoveFlight}
        isDestructive
      />
    </div>
  );
}
