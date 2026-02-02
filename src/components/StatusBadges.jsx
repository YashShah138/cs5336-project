import React from 'react';
import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, BAG_LOCATION_COLORS, PASSENGER_STATUS_LABELS, BAG_LOCATION_LABELS } from '@/types';
import { cn } from '@/lib/utils';

export function PassengerStatusBadge({ status, className }) {
  return (
    <Badge className={cn(STATUS_COLORS[status], className)}>
      {PASSENGER_STATUS_LABELS[status]}
    </Badge>
  );
}

export function BagLocationBadge({ location, className }) {
  return (
    <Badge className={cn(BAG_LOCATION_COLORS[location], className)}>
      {BAG_LOCATION_LABELS[location]}
    </Badge>
  );
}
