'use client';

import { TicketActions } from '@/components/tickets/ticket-actions';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Users } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useTicket } from '@/lib/tickets/use-tickets';
import { useTicketQueue } from './ticket-queue-provider';

export function TicketPreview() {
  const { previewTicketId } = useTicketQueue();
  const { data: ticket, isLoading } = useTicket(previewTicketId || '', true);

  if (!previewTicketId) {
    return (
      <div className='flex h-full items-center justify-center text-center text-sm text-muted-foreground'>
        Select a ticket to view details
      </div>
    );
  }

  if (isLoading) {
    return <TicketPreviewSkeleton />;
  }

  if (!ticket) {
    return (
      <div className='flex h-full items-center justify-center text-center text-sm text-muted-foreground'>
        Ticket not found
      </div>
    );
  }

  const metadata = ticket.metadata as Record<string, any>;

  return (
    <div className='flex h-full flex-col'>
      <div className='border-b p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <Badge variant='outline'>#{ticket.number}</Badge>
          <Link href={`/dashboard/tickets/${ticket.number}`}>
            <Button variant='ghost' size='sm'>
              <ArrowUpRight className='mr-1 h-4 w-4' />
              Open
            </Button>
          </Link>
        </div>
        <h3 className='line-clamp-2 font-medium'>{ticket.subject}</h3>
        {metadata.description && (
          <p className='mt-2 line-clamp-2 text-sm'>{metadata.description}</p>
        )}
      </div>

      <ScrollArea className='flex-1'>
        <div className='space-y-6 p-4'>
          <TicketActions ticket={ticket} hideAuditLog />

          <Card className='p-4'>
            <div className='space-y-3'>
              <div>
                <div className='mb-1.5 text-sm text-muted-foreground'>
                  Created
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <Clock className='h-4 w-4 text-muted-foreground' />
                  <span>
                    {formatDistanceToNow(new Date(ticket.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>

              {ticket.resolved_at && (
                <div>
                  <div className='mb-1.5 text-sm text-muted-foreground'>
                    Resolved
                  </div>
                  <div className='flex items-center gap-2 text-sm'>
                    <Clock className='h-4 w-4 text-muted-foreground' />
                    <span>
                      {formatDistanceToNow(new Date(ticket.resolved_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Contact Info */}
          <Card className='p-4'>
            <div className='space-y-3'>
              <div className='mb-1.5 text-sm text-muted-foreground'>
                Contact
              </div>
              {ticket.contact && (
                <div className='flex items-center gap-3'>
                  <Avatar className='h-8 w-8'>
                    <AvatarFallback>
                      {ticket.contact.name?.[0] ??
                        ticket.contact.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className='text-sm font-medium'>
                      {ticket.contact.name ?? 'No Name'}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      {ticket.contact.email}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}

function TicketPreviewSkeleton() {
  return (
    <div className='flex h-full flex-col'>
      <div className='border-b p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <Skeleton className='h-5 w-16' />
          <Skeleton className='h-8 w-16' />
        </div>
        <Skeleton className='h-6 w-3/4' />
      </div>

      <div className='space-y-6 p-4'>
        <Card className='p-4'>
          <div className='space-y-4'>
            <div className='space-y-3'>
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-6 w-24' />
              <Skeleton className='h-4 w-16' />
              <Skeleton className='h-6 w-24' />
            </div>

            <div className='space-y-3'>
              <Skeleton className='h-4 w-20' />
              <div className='flex items-center gap-2'>
                <Skeleton className='h-6 w-6 rounded-full' />
                <Skeleton className='h-4 w-32' />
              </div>
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='space-y-3'>
            <Skeleton className='h-4 w-16' />
            <div className='flex items-center gap-2'>
              <Skeleton className='h-4 w-4' />
              <Skeleton className='h-4 w-32' />
            </div>
          </div>
        </Card>

        <Card className='p-4'>
          <div className='space-y-3'>
            <Skeleton className='h-4 w-16' />
            <div className='flex items-center gap-3'>
              <Skeleton className='h-8 w-8 rounded-full' />
              <div className='space-y-1'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-32' />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
