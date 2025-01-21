'use server';

import { revalidatePath } from 'next/cache';
import { TicketService } from '@/lib/services/ticket.service';
import { type TicketUpdate } from '@/lib/types/ticket';
import { getUser } from '@/lib/auth/utils';
import { notifyTicketUpdate, notifyTicketAssignment, notifyTicketStatusChange, notifyTicketPriorityChange } from '@/lib/utils/notifications';

export async function updateTicket(ticketId: string, updates: TicketUpdate) {
  try {
    const user = await getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Initialize services
    const ticketService = await TicketService.create();

    // Get current ticket to check permissions and track changes
    const currentTicket = await ticketService.getById(ticketId);
    if (!currentTicket) {
      throw new Error('Ticket not found');
    }

    // Validate permissions based on user role
    if (user.role === 'customer' && currentTicket.customer_id !== user.id) {
      throw new Error('Unauthorized');
    }

    // For customers, only allow updating title and description
    if (user.role === 'customer') {
      const allowedUpdates: Partial<TicketUpdate> = {
        title: updates.title,
        description: updates.description,
      };
      updates = allowedUpdates;
    }

    // Update the ticket
    const updatedTicket = await ticketService.update(ticketId, {
      ...updates,
      updated_at: new Date().toISOString(),
    });

    if (!updatedTicket) {
      throw new Error('Failed to update ticket');
    }

    // Track significant changes and send notifications
    if (updates.assigned_to && updates.assigned_to !== currentTicket.assigned_to) {
      await notifyTicketAssignment(ticketId, updates.assigned_to, user.id);
    }

    if (updates.status && updates.status !== currentTicket.status) {
      await notifyTicketStatusChange(ticketId, updates.status, user.id);
    }

    if (updates.priority && updates.priority !== currentTicket.priority) {
      await notifyTicketPriorityChange(ticketId, updates.priority, user.id);
    }

    // Send general update notification for other changes
    await notifyTicketUpdate(ticketId, updates, user.id);

    // Revalidate the tickets list and detail pages
    revalidatePath('/app/tickets');
    revalidatePath(`/app/tickets/${ticketId}`);

    return { success: true, data: updatedTicket };
  } catch (error) {
    console.error('Error updating ticket:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update ticket' 
    };
  }
}

export async function deleteTicket(ticketId: string) {
  try {
    const user = await getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Initialize services
    const ticketService = await TicketService.create();

    // Get current ticket to check permissions
    const ticket = await ticketService.getById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Only agents and admins can delete tickets
    if (user.role === 'customer') {
      throw new Error('Unauthorized');
    }

    // Delete the ticket
    await ticketService.delete(ticketId);

    // Revalidate the tickets list
    revalidatePath('/app/tickets');

    return { success: true };
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete ticket' 
    };
  }
} 