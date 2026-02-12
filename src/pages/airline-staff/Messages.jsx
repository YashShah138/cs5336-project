import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, RefreshCw, Send, AlertTriangle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AirlineStaffMessages() {
  const { user } = useAuth();
  const { addMessage, getMessagesByBoard, refreshData, bags, passengers, getPassengerById, getBagsByPassenger, removeBag } = useData();
  const { toast } = useToast();

  const staffUser = user;
  const airlineCode = staffUser?.airlineCode;
  const [newMessage, setNewMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [handleViolationMsg, setHandleViolationMsg] = useState(null);

  const messages = getMessagesByBoard('airline');

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSend = () => {
    if (!newMessage.trim()) return;
    if (newMessage.length > 500) {
      toast({ title: 'Message too long (max 500 characters)', variant: 'destructive' });
      return;
    }

    addMessage({
      boardType: 'airline',
      senderName: `${staffUser.firstName} ${staffUser.lastName}`,
      senderRole: 'airline_staff',
      airlineCode: staffUser.airlineCode,
      content: newMessage.trim(),
    });

    toast({ title: 'Message posted', className: 'bg-success text-success-foreground' });
    setNewMessage('');
  };

  const handleSecurityViolationAction = () => {
    if (!handleViolationMsg) return;
    const msg = handleViolationMsg;
    
    const passenger = msg.passengerId ? getPassengerById(msg.passengerId) : null;
    
    if (passenger) {
      // Remove all bags of this passenger
      const passengerBags = getBagsByPassenger(passenger.id);
      passengerBags.forEach(bag => {
        removeBag(bag.id);
      });

      // Send message to admin to remove passenger
      addMessage({
        boardType: 'admin',
        senderName: `${staffUser.firstName} ${staffUser.lastName}`,
        senderRole: 'airline_staff',
        airlineCode: staffUser.airlineCode,
        messageType: 'remove_passenger',
        passengerId: passenger.id,
        passengerName: `${passenger.firstName} ${passenger.lastName}`,
        content: `REQUEST: Please remove passenger ${passenger.firstName} ${passenger.lastName} (Ticket: ${passenger.ticketNumber}) from the system due to security violation. All bags have been removed by airline staff.`,
      });

      toast({ 
        title: 'Security violation handled', 
        description: `All bags removed for ${passenger.firstName} ${passenger.lastName}. Admin notified to remove passenger.`,
        className: 'bg-success text-success-foreground' 
      });
    }

    setHandleViolationMsg(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Airline Staff Message Board
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New Message */}
          <div className="space-y-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{newMessage.length}/500 characters</span>
              <Button onClick={handleSend} disabled={!newMessage.trim()}>
                <Send className="mr-2 h-4 w-4" />
                Post Message
              </Button>
            </div>
          </div>

          {/* Messages List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No messages yet</p>
              ) : (
                messages.map((message) => {
                  const isViolation = message.messageType === 'security_violation';
                  const isFromMyAirline = !message.airlineCode || message.airlineCode === airlineCode;
                  const canAct = isViolation && isFromMyAirline && message.passengerId;
                  // Check if passenger still exists (hasn't been handled yet)
                  const passengerStillExists = canAct ? getPassengerById(message.passengerId) : null;

                  return (
                    <Card key={message.id} className={`p-4 ${isViolation ? 'border-warning' : ''}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{message.senderName || message.staffName}</span>
                          {message.senderRole && (
                            <Badge variant="outline" className="text-xs">{message.senderRole.replace('_', ' ')}</Badge>
                          )}
                          {message.airlineCode && (
                            <Badge variant="outline" className="text-xs">{message.airlineCode}</Badge>
                          )}
                          {isViolation && (
                            <Badge className="bg-destructive text-destructive-foreground text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Security Violation
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {canAct && passengerStillExists && (
                        <div className="mt-3 pt-2 border-t">
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => setHandleViolationMsg(message)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Bags & Notify Admin
                          </Button>
                        </div>
                      )}
                      {canAct && !passengerStillExists && (
                        <div className="mt-3 pt-2 border-t">
                          <Badge variant="outline" className="text-xs text-muted-foreground">Handled</Badge>
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

      {/* Confirm violation handling */}
      <ConfirmDialog
        open={!!handleViolationMsg}
        onOpenChange={() => setHandleViolationMsg(null)}
        title="Handle Security Violation"
        description={`This will remove ALL bags of passenger "${handleViolationMsg?.passengerName || ''}" and send a message to the administrator to remove the passenger from the system. Continue?`}
        confirmLabel="Remove Bags & Notify Admin"
        onConfirm={handleSecurityViolationAction}
        isDestructive
      />
    </div>
  );
}
