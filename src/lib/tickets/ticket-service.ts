import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { Database } from '@/lib/database.types';
import { SupabaseClient, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type Ticket = Tables<'tickets'>;
export type TicketInsert = TablesInsert<'tickets'>;
export type TicketUpdate = TablesUpdate<'tickets'>;

export type TicketWithRelations = Ticket & {
  contact: Tables<'contacts'>;
  assignee?: Tables<'internal_users'>;
  team?: Tables<'teams'>;
};

export type TicketQueryFilters = {
  status?: Ticket['status'][];
  priority?: Ticket['priority'][];
  assignee_id?: string;
  team_id?: string;
  contact_id?: string;
  search?: string;
};

export type TicketOrderBy = {
  column: keyof Ticket;
  ascending?: boolean;
};

export type TicketQueryOptions = {
  filters?: TicketQueryFilters;
  orderBy?: TicketOrderBy[];
  page?: number;
  limit?: number;
  includeRelations?: boolean;
};

export class TicketService {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly orgId: string
  ) {}

  private buildQuery(
    query: ReturnType<SupabaseClient<Database>['from']>,
    options?: TicketQueryOptions
  ) {
    if (!options) return query;

    const { filters, orderBy, page, limit, includeRelations } = options;

    // Apply filters
    if (filters) {
      const { status, priority, assignee_id, team_id, contact_id, search } =
        filters;

      if (status?.length) {
        query = query.in('status', status);
      }

      if (priority?.length) {
        query = query.in('priority', priority);
      }

      if (assignee_id) {
        query = query.eq('assignee_id', assignee_id);
      }

      if (team_id) {
        query = query.eq('team_id', team_id);
      }

      if (contact_id) {
        query = query.eq('contact_id', contact_id);
      }

      if (search) {
        query = query.ilike('subject', `%${search}%`);
      }
    }

    // Apply ordering
    if (orderBy?.length) {
      orderBy.forEach(({ column, ascending = true }) => {
        query = query.order(column, { ascending });
      });
    } else {
      // Default ordering
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    if (page !== undefined && limit) {
      const from = page * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    }

    // Include relations
    if (includeRelations) {
      query = query.select(`
        *,
        contact:contacts(*),
        assignee:internal_users(*),
        team:teams(*)
      `);
    }

    return query;
  }

  async getTickets(
    options?: TicketQueryOptions
  ): Promise<{ data: Ticket[] | TicketWithRelations[]; count: number }> {
    // Start base query
    let query = this.supabase
      .from('tickets')
      .select('*', { count: 'exact' })
      .eq('org_id', this.orgId);

    // Apply filters and options
    query = this.buildQuery(query, options);

    const { data, error, count } = await query;
    console.log('query', options, data, error, count);

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
    };
  }

  async getTicketById<Rels extends boolean = false>(
    id: string,
    includeRelations: Rels
  ): Promise<Rels extends true ? TicketWithRelations : Ticket> {
    let query = this.supabase
      .from('tickets')
      .select(
        includeRelations
          ? `
        *,
        contact:contacts(*),
        assignee:internal_users(*),
        team:teams(*)
      `
          : '*'
      )
      .eq('org_id', this.orgId)
      .eq('id', id)
      .single();

    const { data, error } = await query;

    if (error) throw error;
    if (!data) throw new Error('Ticket not found');

    return data as unknown as Rels extends true ? TicketWithRelations : Ticket;
  }

  async createTicket(ticket: TicketInsert): Promise<Ticket> {
    const { data, error } = await this.supabase
      .from('tickets')
      .insert({ ...ticket, org_id: this.orgId })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create ticket');

    return data;
  }

  async updateTicket(id: string, update: TicketUpdate): Promise<Ticket> {
    const { data, error } = await this.supabase
      .from('tickets')
      .update(update)
      .eq('org_id', this.orgId)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update ticket');

    return data;
  }

  async deleteTicket(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('tickets')
      .delete()
      .eq('org_id', this.orgId)
      .eq('id', id);

    if (error) throw error;
  }

  async subscribeToTicket(
    ticketId: string,
    callback: (payload: RealtimePostgresChangesPayload<Ticket>) => void
  ): Promise<() => void> {
    const channel = this.supabase
      .channel(`ticket-${ticketId}`)
      .on<Ticket>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticketId} AND org_id=eq.${this.orgId}`,
        },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()

    return () => {
      void this.supabase.removeChannel(channel)
    }
  }

  async subscribeToOrgTickets(
    callback: (payload: RealtimePostgresChangesPayload<Ticket>) => void
  ): Promise<() => void> {
    const channel = this.supabase
      .channel('org-tickets')
      .on<Ticket>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `org_id=eq.${this.orgId}`,
        },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()

    return () => {
      void this.supabase.removeChannel(channel)
    }
  }
}
