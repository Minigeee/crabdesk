'use server';

import { revalidatePath } from 'next/cache';
import { TicketService } from '@/lib/services/ticket.service';
import { type NewTicket, type TicketUpdate, type TicketFilters, type TicketSort } from '@/lib/types/ticket';

export async function createTicket(ticket: NewTicket) {
  try {
    const ticketService = await TicketService.create();
    const result = await ticketService.create(ticket);
    revalidatePath('/tickets');
    return { data: result, error: null };
  } catch (error) {
    console.error('Error creating ticket:', error);
    return { data: null, error: 'Failed to create ticket' };
  }
}

export async function updateTicket(id: string, updates: TicketUpdate) {
  try {
    const ticketService = await TicketService.create();
    const result = await ticketService.update(id, updates);
    revalidatePath('/tickets');
    revalidatePath(`/tickets/${id}`);
    return { data: result, error: null };
  } catch (error) {
    console.error('Error updating ticket:', error);
    return { data: null, error: 'Failed to update ticket' };
  }
}

export async function deleteTicket(id: string) {
  try {
    const ticketService = await TicketService.create();
    await ticketService.delete(id);
    revalidatePath('/tickets');
    return { error: null };
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return { error: 'Failed to delete ticket' };
  }
}

export async function getTicket(id: string) {
  try {
    const ticketService = await TicketService.create();
    const result = await ticketService.getById(id);
    return { data: result, error: null };
  } catch (error) {
    console.error('Error getting ticket:', error);
    return { data: null, error: 'Failed to get ticket' };
  }
}

export async function listTickets(
  page = 1,
  pageSize = 10,
  filters?: TicketFilters,
  sort?: TicketSort
) {
  try {
    const ticketService = await TicketService.create();
    const result = await ticketService.list(page, pageSize, filters, sort);
    return { data: result, error: null };
  } catch (error) {
    console.error('Error listing tickets:', error);
    return { data: null, error: 'Failed to list tickets' };
  }
} 