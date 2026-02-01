import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PassengerStatus, BagLocation, STATUS_COLORS, BAG_LOCATION_COLORS, PASSENGER_STATUS_LABELS, BAG_LOCATION_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: PassengerStatus;
  className?: string;
}

export function PassengerStatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge className={cn(STATUS_COLORS[status], className)}>
      {PASSENGER_STATUS_LABELS[status]}
    </Badge>
  );
}

interface BagLocationBadgeProps {
  location: BagLocation;
  className?: string;
}

export function BagLocationBadge({ location, className }: BagLocationBadgeProps) {
  return (
    <Badge className={cn(BAG_LOCATION_COLORS[location], className)}>
      {BAG_LOCATION_LABELS[location]}
    </Badge>
  );
}
