'use client';

import { PriorityBadge } from '@/components/tickets/priority-badge';
import { StatusBadge } from '@/components/tickets/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export function TicketHistory({ contactId }: { contactId: string }) {
  const [showAll, setShowAll] = useState(false);

  // Query for tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets', contactId, showAll],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(showAll ? 50 : 5);
      return data || [];
    },
  });

  // Calculate ticket counts
  const { openTickets, totalTickets } = useMemo(() => {
    const open = tickets.filter((t) => t.status === 'open').length;
    return {
      openTickets: open,
      totalTickets: tickets.length,
    };
  }, [tickets]);

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <div>
          <CardTitle>Ticket History</CardTitle>
          <p className='mt-1 text-sm text-muted-foreground'>
            {openTickets} open, {totalTickets} total tickets
          </p>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setShowAll(!showAll)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : showAll ? (
            <ChevronUp className='h-4 w-4' />
          ) : (
            <ChevronDown className='h-4 w-4' />
          )}
        </Button>
      </CardHeader>
      <CardContent className='space-y-2'>
        {tickets.length === 0 ? (
          <div className='text-center text-sm text-muted-foreground'>
            No tickets found
          </div>
        ) : (
          tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/dashboard/tickets/${ticket.number}`}
              className='block'
            >
              <div className='flex flex-col rounded-lg border p-3 transition-colors hover:bg-muted/50'>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline'>#{ticket.number}</Badge>
                  <p className='text-sm font-medium'>{ticket.subject}</p>
                </div>
                <div className='mt-2 text-xs text-muted-foreground'>
                  Created{' '}
                  {formatDistanceToNow(new Date(ticket.created_at), {
                    addSuffix: true,
                  })}
                </div>
                <div className='mt-3 flex shrink-0 items-center gap-2'>
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
