'use client';

import { ApprovalWorkflowNav } from '@/components/tickets/approval-workflow-nav';
import { Badge } from '@/components/ui/badge';
import type { TicketWithRelations } from '@/lib/tickets/ticket-service';

interface TicketHeaderProps {
  ticket: TicketWithRelations;
}

export function TicketHeader({ ticket }: TicketHeaderProps) {
  return (
    <div className='border-b bg-background p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <Badge variant='outline' className='-mt-1 mr-2 text-sm'>
            #{ticket.number}
          </Badge>
          <h1 className='mb-1 text-xl font-semibold'>{ticket.subject}</h1>
        </div>
        <ApprovalWorkflowNav variant='detail' currentTicketId={ticket.id} />
      </div>
      <div className='text-sm text-muted-foreground'>
        Opened by {ticket.contact.name ?? ticket.contact.email}
      </div>
    </div>
  );
}
