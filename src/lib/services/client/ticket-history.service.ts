import { createClient } from '@/lib/supabase/client';

export type TicketHistoryEntry = {
  id: string;
  created_at: string;
  ticket_id: string;
  user_id: string;
  change_type: string;
  previous_values: any;
  new_values: any;
  metadata: any;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
};

export class TicketHistoryService {
  private static instance: TicketHistoryService;
  private supabase;

  private constructor() {
    this.supabase = createClient();
  }

  public static getInstance(): TicketHistoryService {
    if (!TicketHistoryService.instance) {
      TicketHistoryService.instance = new TicketHistoryService();
    }
    return TicketHistoryService.instance;
  }

  async getHistory(
    ticketId: string,
    page = 1,
    pageSize = 20,
    changeType: string = 'all',
  ): Promise<{ data: TicketHistoryEntry[]; count: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase
      .from('ticket_history')
      .select(
        `
        *,
        user:users (
          id,
          full_name,
          email,
          avatar_url
        )
      `,
        { count: 'exact' },
      )
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (changeType !== 'all') {
      query = query.eq('change_type', changeType);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return {
      data: (data || []) as TicketHistoryEntry[],
      count: count || 0,
    };
  }
}
