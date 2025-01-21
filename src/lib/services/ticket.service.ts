import { createClient } from '@/lib/supabase/server';
import { type SupabaseClient } from '@supabase/supabase-js';
import { type Database } from '@/lib/supabase/database.types';
import { type NewTicket, type TicketUpdate, type TicketFilters, type TicketSort, type TicketWithDetails } from '@/lib/types/ticket';

export class TicketService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase?: SupabaseClient<Database>) {
    if (supabase) {
      this.supabase = supabase;
    } else {
      throw new Error('Supabase client must be provided');
    }
  }

  static async create(): Promise<TicketService> {
    const supabase = await createClient();
    return new TicketService(supabase);
  }

  async create(ticket: NewTicket): Promise<TicketWithDetails | null> {
    const { data, error } = await this.supabase
      .from('tickets')
      .insert(ticket)
      .select(`
        *,
        customer:users!tickets_customer_id_fkey (
          id,
          full_name,
          email
        ),
        assignee:users!tickets_assigned_to_fkey (
          id,
          full_name,
          email
        ),
        team:teams (
          id,
          name
        ),
        organization:organizations (
          id,
          name
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updates: TicketUpdate): Promise<TicketWithDetails | null> {
    const { data, error } = await this.supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        customer:users!tickets_customer_id_fkey (
          id,
          full_name,
          email
        ),
        assignee:users!tickets_assigned_to_fkey (
          id,
          full_name,
          email
        ),
        team:teams (
          id,
          name
        ),
        organization:organizations (
          id,
          name
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getById(id: string): Promise<TicketWithDetails | null> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select(`
        *,
        customer:users!tickets_customer_id_fkey (
          id,
          full_name,
          email
        ),
        assignee:users!tickets_assigned_to_fkey (
          id,
          full_name,
          email
        ),
        team:teams (
          id,
          name
        ),
        organization:organizations (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async list(
    page = 1,
    pageSize = 10,
    filters?: TicketFilters,
    sort?: TicketSort
  ): Promise<{ data: TicketWithDetails[]; count: number }> {
    let query = this.supabase
      .from('tickets')
      .select(`
        *,
        customer:users!tickets_customer_id_fkey (
          id,
          full_name,
          email
        ),
        assignee:users!tickets_assigned_to_fkey (
          id,
          full_name,
          email
        ),
        team:teams (
          id,
          name
        ),
        organization:organizations (
          id,
          name
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters) {
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }
      if (filters.teamId) {
        query = query.eq('team_id', filters.teamId);
      }
      if (filters.organizationId) {
        query = query.eq('organization_id', filters.organizationId);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  }
} 