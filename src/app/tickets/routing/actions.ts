'use server';

import { revalidatePath } from 'next/cache';
import { RoutingService } from '@/lib/services/routing.service';

export async function autoAssignTicket(ticketId: string) {
  try {
    const routingService = await RoutingService.create();
    const success = await routingService.autoAssignTicket(ticketId);
    if (success) {
      revalidatePath('/tickets');
      revalidatePath(`/tickets/${ticketId}`);
    }
    return { success, error: null };
  } catch (error) {
    console.error('Error auto-assigning ticket:', error);
    return { success: false, error: 'Failed to auto-assign ticket' };
  }
}

export async function autoAssignUnassignedTickets(organizationId: string) {
  try {
    const routingService = await RoutingService.create();
    const assignedCount = await routingService.autoAssignUnassignedTickets(organizationId);
    revalidatePath('/tickets');
    return { assignedCount, error: null };
  } catch (error) {
    console.error('Error auto-assigning tickets:', error);
    return { assignedCount: 0, error: 'Failed to auto-assign tickets' };
  }
} 