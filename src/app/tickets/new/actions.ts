'use server';

import { createClient } from '@/lib/supabase/server';
import { TicketService } from '@/lib/services/ticket.service';
import { type NewTicket } from '@/lib/types/ticket';
import { revalidatePath } from 'next/cache';

export type CreateTicketData = {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer_id: string;
  tags?: string[];
};

export async function createTicket(data: CreateTicketData): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'You must be logged in to create a ticket' };
    }

    // Get the user's role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return { error: 'Failed to verify user role' };
    }

    // If user is a customer, they can only create tickets for themselves
    if (userData.role === 'customer' && data.customer_id !== user.id) {
      return { error: 'Customers can only create tickets for themselves' };
    }

    // If user is an agent/admin, verify the customer exists
    if (userData.role !== 'customer') {
      const { data: customerData, error: customerError } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.customer_id)
        .eq('role', 'customer')
        .single();

      if (customerError || !customerData) {
        return { error: 'Invalid customer selected' };
      }
    }

    const ticketService = await TicketService.create();
    const ticket: NewTicket = {
      ...data,
      status: 'open',
    };

    await ticketService.create(ticket);
    revalidatePath('/tickets');
    return {};
  } catch (error) {
    console.error('Failed to create ticket:', error);
    return { error: 'Failed to create ticket. Please try again.' };
  }
} 