'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Tables } from '@/lib/database.types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { StatusBadge } from './status-badge';

interface ContactPanelProps {
  contact: Tables<'contacts'>;
  recentTickets: Tables<'tickets'>[];
  onEditContact?: () => void;
}

export function ContactPanel({
  contact,
  recentTickets,
  onEditContact,
}: ContactPanelProps) {
  return (
    <div className='space-y-6'>
      <Card className='p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='font-medium'>Contact Information</h3>
          {onEditContact && (
            <Button variant='ghost' size='sm' onClick={onEditContact}>
              Edit
            </Button>
          )}
        </div>

        <Link href={`/dashboard/contacts/${contact.id}`} passHref>
          <Button
            variant='outline'
            className='mb-4 flex items-center justify-start text-left gap-3 w-full h-fit'
        >
          <Avatar>
            <AvatarFallback>
              {contact.name?.[0] ?? contact.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className='font-medium'>{contact.name ?? 'No Name'}</div>
              <div className='text-sm text-muted-foreground'>{contact.email}</div>
            </div>
          </Button>
        </Link>

        <div className='space-y-2 text-sm'>
          <div className='flex justify-between text-muted-foreground'>
            <span>First seen</span>
            <span>
              {formatDistanceToNow(new Date(contact.first_seen_at), {
                addSuffix: true,
              })}
            </span>
          </div>
          <div className='flex justify-between text-muted-foreground'>
            <span>Last seen</span>
            <span>
              {formatDistanceToNow(new Date(contact.last_seen_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </Card>

      <Card className='p-4'>
        <h3 className='mb-2 font-medium'>Recent Tickets</h3>
        <div className='space-y-2'>
          {recentTickets.length === 0 ? (
            <div className='text-sm text-muted-foreground'>
              No recent tickets
            </div>
          ) : (
            recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/tickets/${ticket.number}`}
              >
                <Button
                  variant='ghost'
                  className='flex h-fit w-full items-center justify-between text-left'
                >
                  <div className='min-w-0'>
                    <div className='truncate text-sm'>{ticket.subject}</div>
                    <div className='text-xs text-muted-foreground'>
                      {formatDistanceToNow(new Date(ticket.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                  <StatusBadge status={ticket.status} />
                </Button>
              </Link>
            ))
          )}
        </div>
      </Card>

      <Card className='p-4'>
        <h3 className='mb-4 font-medium'>Custom Fields</h3>
        <div className='space-y-2'>
          {Object.entries(contact.metadata as Record<string, unknown>).map(
            ([key, value]) => (
              <div key={key} className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>{key}</span>
                <span>{String(value)}</span>
              </div>
            )
          )}
          {Object.keys(contact.metadata as Record<string, unknown>).length ===
            0 && (
            <div className='text-sm text-muted-foreground'>
              No custom fields
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
