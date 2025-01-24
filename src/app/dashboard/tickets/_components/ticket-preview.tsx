'use client';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useTicket } from '@/lib/tickets/use-tickets';
import { ArrowUpRightIcon, UserCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { useTicketQueue } from './ticket-queue-provider';
import { StatusBadge } from '@/components/tickets/status-badge'
import { PriorityBadge } from '@/components/tickets/priority-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { humanize } from '@/lib/utils/text'

dayjs.extend(relativeTime)

export function TicketPreview() {
  const { previewTicketId } = useTicketQueue();
  const { data: ticket, isLoading } = useTicket(previewTicketId || '', true);

  if (!previewTicketId) {
    return (
      <div className='flex h-[600px] items-center justify-center text-center text-sm text-muted-foreground'>
        Select a ticket to view details
      </div>
    );
  }

  if (isLoading) {
    return <TicketPreviewSkeleton />;
  }

  if (!ticket) {
    return (
      <div className='flex h-[600px] items-center justify-center text-center text-sm text-muted-foreground'>
        Ticket not found
      </div>
    );
  }

  return (
    <div className='flex h-[600px] flex-col'>
      {/* Header */}
      <div className='border-b p-4'>
        <div className='mb-2 flex items-center justify-between'>
          <Badge variant='outline'>#{ticket.number}</Badge>
          <Link
            href={`/dashboard/tickets/${ticket.number}`}
            className='text-muted-foreground hover:text-foreground'
          >
            <ArrowUpRightIcon className='h-4 w-4' />
          </Link>
        </div>
        <h3 className='text-lg font-semibold'>{ticket.subject}</h3>
      </div>

      {/* Content */}
      <ScrollArea className='flex-1 p-4'>
        <div className='space-y-4'>
          {/* Status and Priority */}
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <p className='text-sm text-muted-foreground'>Status</p>
              <StatusBadge status={ticket.status} />
            </div>
            <div className='space-y-1'>
              <p className='text-sm text-muted-foreground'>Priority</p>
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-muted-foreground'>Created</p>
              <p className='text-sm'>
                {dayjs(ticket.created_at).format('MMM D, YYYY h:mm A')}
                <span className='ml-1 text-muted-foreground'>
                  ({dayjs(ticket.created_at).fromNow()})
                </span>
              </p>
            </div>
            {ticket.resolved_at && (
              <div>
                <p className='text-sm text-muted-foreground'>Resolved</p>
                <p className='text-sm'>
                  {dayjs(ticket.resolved_at).format('MMM D, YYYY h:mm A')}
                  <span className='ml-1 text-muted-foreground'>
                    ({dayjs(ticket.resolved_at).fromNow()})
                  </span>
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Assignment */}
          <div className='space-y-2'>
            <p className='text-sm text-muted-foreground'>Assigned To</p>
            {ticket.assignee ? (
              <div className='flex items-center space-x-2'>
                <Avatar className='h-6 w-6'>
                  <AvatarImage src={ticket.assignee.avatar_url || undefined} />
                  <AvatarFallback>
                    <UserCircle className='h-4 w-4' />
                  </AvatarFallback>
                </Avatar>
                <p className='text-sm'>{ticket.assignee.name}</p>
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>Unassigned</p>
            )}
          </div>

          {ticket.team && (
            <>
              <Separator />
              <div className='space-y-2'>
                <p className='text-sm text-muted-foreground'>Team</p>
                <div className='flex items-center space-x-2'>
                  <Users className='h-4 w-4 text-muted-foreground' />
                  <p className='text-sm'>{humanize(ticket.team.name)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function TicketPreviewSkeleton() {
  return (
    <div className='flex h-[600px] flex-col'>
      <div className='border-b p-4'>
        <div className='mb-2 flex items-center justify-between'>
          <Skeleton className='h-5 w-16' />
          <Skeleton className='h-4 w-4' />
        </div>
        <Skeleton className='h-6 w-3/4' />
      </div>

      <div className='flex-1 p-4'>
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <Skeleton className='h-4 w-12' />
              <Skeleton className='h-5 w-20' />
            </div>
            <div className='space-y-1'>
              <Skeleton className='h-4 w-12' />
              <Skeleton className='h-5 w-20' />
            </div>
          </div>

          <Separator />

          <div className='space-y-4'>
            <div>
              <Skeleton className='h-4 w-12' />
              <Skeleton className='mt-1 h-4 w-32' />
            </div>
            <div>
              <Skeleton className='h-4 w-12' />
              <Skeleton className='mt-1 h-4 w-32' />
            </div>
          </div>

          <Separator />

          <div className='space-y-2'>
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-8 w-48' />
          </div>
        </div>
      </div>
    </div>
  );
}
