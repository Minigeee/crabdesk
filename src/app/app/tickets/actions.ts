'use server';

import { getUser } from '@/lib/auth/utils';
import { TicketService } from '@/lib/services/ticket.service';
import { type NewTicket } from '@/lib/types/ticket';
import { revalidatePath } from 'next/cache';

export async function createTicket(data: Partial<NewTicket>) {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const ticketService = await TicketService.create();

  const ticket: NewTicket = {
    title: data.title!,
    description: data.description!,
    priority: data.priority!,
    customer_id: user.role === 'customer' ? user.id : data.customer_id!,
    status: 'open',
    assigned_to: data.assigned_to,
    team_id: data.team_id,
    organization_id: user.organization_id,
    tags: data.tags || [],
    settings: {},
    metadata: {
      ...(typeof data.metadata === 'object' ? data.metadata : {}),
      created_by: user.id,
      created_by_role: user.role,
    },
  };

  const result = await ticketService.create(ticket);
  revalidatePath('/app/tickets');
  return result;
}
