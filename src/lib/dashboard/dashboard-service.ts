import { Database } from '@/lib/database.types';
import { SupabaseClient } from '@supabase/supabase-js';
import { addDays, endOfDay, startOfDay } from 'date-fns';

export type TicketStatusMetrics = {
  status: Database['public']['Enums']['ticket_status'];
  count: number;
};

export type TicketPriorityMetrics = {
  priority: Database['public']['Enums']['ticket_priority'];
  count: number;
};

export type TicketAssignmentMetrics = {
  assigned: number;
  unassigned: number;
};

export type TicketTrendPoint = {
  date: string;
  count: number;
};

export class DashboardService {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly orgId: string
  ) {}

  async getTicketStatusMetrics(): Promise<TicketStatusMetrics[]> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('status')
      .eq('org_id', this.orgId)
      .not('status', 'eq', 'closed');

    if (error) throw error;

    const metrics: Record<string, number> = {};
    data.forEach((ticket) => {
      metrics[ticket.status] = (metrics[ticket.status] || 0) + 1;
    });

    return Object.entries(metrics).map(([status, count]) => ({
      status: status as Database['public']['Enums']['ticket_status'],
      count,
    }));
  }

  async getTicketPriorityMetrics(): Promise<TicketPriorityMetrics[]> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('priority')
      .eq('org_id', this.orgId)
      .not('status', 'eq', 'closed');

    if (error) throw error;

    const metrics: Record<string, number> = {};
    data.forEach((ticket) => {
      metrics[ticket.priority] = (metrics[ticket.priority] || 0) + 1;
    });

    return Object.entries(metrics).map(([priority, count]) => ({
      priority: priority as Database['public']['Enums']['ticket_priority'],
      count,
    }));
  }

  async getTicketAssignmentMetrics(): Promise<TicketAssignmentMetrics> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('assignee_id')
      .eq('org_id', this.orgId)
      .not('status', 'eq', 'closed');

    if (error) throw error;

    const assigned = data.filter((ticket) => ticket.assignee_id).length;
    const unassigned = data.length - assigned;

    return {
      assigned,
      unassigned,
    };
  }

  async getTicketTrend(): Promise<TicketTrendPoint[]> {
    const endDate = endOfDay(new Date());
    const startDate = startOfDay(addDays(endDate, -6)); // Last 7 days

    const { data, error } = await this.supabase
      .from('tickets')
      .select('created_at')
      .eq('org_id', this.orgId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Initialize counts for each day
    const counts: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i);
      counts[date.toISOString().split('T')[0]] = 0;
    }

    // Count tickets per day
    data.forEach((ticket) => {
      const date = ticket.created_at.split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
    });

    return Object.entries(counts).map(([date, count]) => ({
      date,
      count,
    }));
  }
}
