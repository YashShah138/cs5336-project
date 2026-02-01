import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { User, MessageBoardType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, RefreshCw, Send } from 'lucide-react';
import { format } from 'date-fns';

interface MessageBoardProps {
  boardType: MessageBoardType;
}

export default function MessageBoard({ boardType }: MessageBoardProps) {
  const { user } = useAuth();
  const { addMessage, getMessagesByBoard, refreshData } = useData();
  const { toast } = useToast();

  const staffUser = user as User;
  const [newMessage, setNewMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const messages = getMessagesByBoard(boardType);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
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
      boardType,
      staffId: staffUser.id,
      staffName: `${staffUser.firstName} ${staffUser.lastName}`,
      airlineCode: staffUser.airlineCode,
      content: newMessage.trim(),
    });

    toast({ title: 'Message posted', className: 'bg-success text-success-foreground' });
    setNewMessage('');
  };

  const boardTitle = {
    airline: 'Airline Staff',
    gate: 'Gate Staff',
    ground: 'Ground Staff',
  }[boardType];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {boardTitle} Message Board
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
                messages.map((message) => (
                  <Card key={message.id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{message.staffName}</span>
                        {message.airlineCode && (
                          <Badge variant="outline" className="text-xs">{message.airlineCode}</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.createdAt), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
