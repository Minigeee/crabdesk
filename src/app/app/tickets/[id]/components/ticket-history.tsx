'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useTicketHistory } from '@/hooks/use-ticket-history';
import type { TicketHistoryEntry } from '@/lib/services/client/ticket-history.service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

dayjs.extend(relativeTime);

type TicketHistoryProps = {
  ticketId: string;
};

export function TicketHistory({ ticketId }: TicketHistoryProps) {
  const [changeType, setChangeType] = useState<string>('all');
  const { history, isLoading, hasMore, loadMore, isFetchingMore } =
    useTicketHistory(ticketId, changeType);

  const getChangeDescription = (entry: TicketHistoryEntry) => {
    const { change_type, previous_values, new_values } = entry;

    switch (change_type) {
      case 'status':
        return `Changed status from ${previous_values.status} to ${new_values.status}`;
      case 'priority':
        return `Changed priority from ${previous_values.priority} to ${new_values.priority}`;
      case 'assignment':
        const assigneeName = new_values.assigned_to_name || 'unknown user';
        return new_values.assigned_to
          ? `Assigned ticket to ${assigneeName}`
          : 'Unassigned ticket';
      case 'update':
        const changes = [];
        for (const [key, value] of Object.entries(new_values)) {
          if (key === 'title') changes.push('Updated title');
          if (key === 'description') changes.push('Updated description');
          if (key === 'tags') changes.push('Updated tags');
        }
        return changes.join(', ');
      default:
        return 'Updated ticket';
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className='flex items-start space-x-4'>
          <Skeleton className='h-10 w-10 rounded-full' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-[250px]' />
            <Skeleton className='h-4 w-[200px]' />
          </div>
        </div>
      ));
    }

    if (!history.length) {
      return (
        <div className='flex items-center w-full justify-center space-x-2 h-20'>
          <AlertCircle className='h-4 w-4 text-muted-foreground' />
          <p className='text-sm text-muted-foreground'>
            No activity history found
          </p>
        </div>
      );
    }

    return (
      <>
        {history.map((entry) => (
          <div key={entry.id} className='flex items-start space-x-4'>
            <Avatar className='h-10 w-10'>
              <AvatarImage src={entry.user?.avatar_url || ''} />
              <AvatarFallback>
                {entry.user?.full_name
                  ?.split(' ')
                  .map((n: string) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div className='space-y-1'>
              <div className='flex items-center space-x-2'>
                <span className='font-medium'>{entry.user?.full_name}</span>
                <Badge variant='secondary'>{entry.change_type}</Badge>
                <span
                  className='text-sm text-muted-foreground'
                  title={dayjs(entry.created_at).format('MMM D, YYYY h:mm A')}
                >
                  {dayjs(entry.created_at).fromNow()}
                </span>
              </div>
              <p className='text-sm text-muted-foreground'>
                {getChangeDescription(entry)}
              </p>
            </div>
          </div>
        ))}
        {hasMore && (
          <Button
            variant='outline'
            className='w-full'
            onClick={loadMore}
            disabled={isFetchingMore}
          >
            {isFetchingMore ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </>
    );
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>Activity History</h3>
        <Select value={changeType} onValueChange={setChangeType}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Filter by type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Changes</SelectItem>
            <SelectItem value='status'>Status Changes</SelectItem>
            <SelectItem value='priority'>Priority Changes</SelectItem>
            <SelectItem value='assignment'>Assignments</SelectItem>
            <SelectItem value='update'>Updates</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-4 p-4'>{renderContent()}</div>
    </div>
  );
}
