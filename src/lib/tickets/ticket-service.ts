import type { Tables, TablesInsert, TablesUpdate } from '@/lib/database.types';
import { Database } from '@/lib/database.types';
import {
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from '@supabase/supabase-js';

export type Ticket = Tables<'tickets'>;
export type TicketInsert = TablesInsert<'tickets'>;
export type TicketUpdate = TablesUpdate<'tickets'>;

export type TicketWithRelations = Ticket & {
  contact: Tables<'contacts'>;
  assignee?: Tables<'users'>;
  team?: Tables<'teams'>;
};

export type TicketQueryFilters = {
  status?: Ticket['status'][];
  priority?: Ticket['priority'][];
  assignee_id?: string;
  team_id?: string;
  contact_id?: string;
  search?: string;
  includeClosed?: boolean;
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

export type FileAttachment = {
  file: File;
  filename: string;
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
      const {
        status,
        priority,
        assignee_id,
        team_id,
        contact_id,
        search,
        includeClosed,
      } = filters;

      // Handle status filter with closed tickets logic
      if (status?.length) {
        query = query.in('status', status);
      } else if (!includeClosed) {
        // If no status filter and closed tickets not included, exclude closed tickets
        query = query.neq('status', 'closed');
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
    } else {
      // If no filters at all, still exclude closed tickets by default
      query = query.neq('status', 'closed');
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
        assignee:users(*),
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
    // console.log('query', options, data, error, count);

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
    const query = this.supabase
      .from('tickets')
      .select(
        includeRelations
          ? `
        *,
        contact:contacts(*),
        assignee:users(*),
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

  async getTicketByNumber<Rels extends boolean = false>(
    number: number,
    includeRelations: Rels
  ): Promise<Rels extends true ? TicketWithRelations : Ticket> {
    const query = this.supabase
      .from('tickets')
      .select(
        includeRelations
          ? `
        *,
        contact:contacts(*),
        assignee:users(*),
        team:teams(*)
      `
          : '*'
      )
      .eq('org_id', this.orgId)
      .eq('number', number)
      .single();

    const { data, error } = await query;

    if (error) throw error;
    if (!data) throw new Error('Ticket not found');

    return data as unknown as Rels extends true ? TicketWithRelations : Ticket;
  }

  private async uploadFile(
    file: File,
    ticketId: string
  ): Promise<Tables<'attachments'>> {
    const supabase = this.supabase;
    const filename = `${Date.now()}-${file.name}`;
    const path = `tickets/${ticketId}/${filename}`;

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(path, file);

    if (uploadError) throw uploadError;

    // Create attachment record
    const { data: attachment, error: attachmentError } = await supabase
      .from('attachments')
      .insert({
        org_id: this.orgId,
        ticket_id: ticketId,
        bucket: 'attachments',
        path,
        filename: file.name,
        size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (attachmentError) throw attachmentError;
    return attachment;
  }

  async createTicket(
    ticket: TicketInsert,
    attachments?: FileAttachment[]
  ): Promise<Ticket> {
    const supabase = this.supabase;

    // Create the ticket first
    const { data: newTicket, error: ticketError } = await supabase
      .from('tickets')
      .insert({ ...ticket, org_id: this.orgId })
      .select()
      .single();

    if (ticketError) throw ticketError;
    if (!newTicket) throw new Error('Failed to create ticket');

    // If we have attachments, upload them
    if (attachments?.length) {
      try {
        await Promise.all(
          attachments.map(({ file }) => this.uploadFile(file, newTicket.id))
        );
      } catch (error) {
        // If attachment upload fails, we should probably delete the ticket
        await supabase.from('tickets').delete().eq('id', newTicket.id);
        throw error;
      }
    }

    return newTicket;
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
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      void this.supabase.removeChannel(channel);
    };
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
          callback(payload);
        }
      )
      .subscribe();

    return () => {
      void this.supabase.removeChannel(channel);
    };
  }
}
