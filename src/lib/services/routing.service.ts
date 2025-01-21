import { type Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';
import { type Ticket } from '@/lib/types/ticket';
import { type SupabaseClient } from '@supabase/supabase-js';

interface AgentWorkload {
  id: string;
  activeTickets: number;
  team_id: string | null;
}

export class RoutingService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase?: SupabaseClient<Database>) {
    if (supabase) {
      this.supabase = supabase;
    } else {
      throw new Error('Supabase client must be provided');
    }
  }

  static async create(): Promise<RoutingService> {
    const supabase = await createClient();
    return new RoutingService(supabase);
  }

  private async getAgentWorkloads(
    organizationId: string,
  ): Promise<AgentWorkload[]> {
    // Get all agents in the organization
    const { data: agents, error: agentsError } = await this.supabase
      .from('users')
      .select('id, team_id')
      .eq('organization_id', organizationId)
      .in('role', ['agent', 'admin']);

    if (agentsError) throw agentsError;

    // Get active ticket counts for each agent
    const workloads = await Promise.all(
      agents.map(async (agent) => {
        const { count } = await this.supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', agent.id)
          .in('status', ['open', 'in_progress']);

        return {
          id: agent.id,
          team_id: agent.team_id,
          activeTickets: count || 0,
        };
      }),
    );

    return workloads;
  }

  private async findLeastLoadedAgent(
    workloads: AgentWorkload[],
    teamId?: string | null,
  ): Promise<string | null> {
    const eligibleAgents = teamId
      ? workloads.filter((agent) => agent.team_id === teamId)
      : workloads;

    if (eligibleAgents.length === 0) return null;

    // Sort by number of active tickets
    const sortedAgents = [...eligibleAgents].sort(
      (a, b) => a.activeTickets - b.activeTickets,
    );

    return sortedAgents[0].id;
  }

  async routeTicket(ticket: Ticket): Promise<string | null> {
    if (!ticket.organization_id) return null;

    // Get all agent workloads in the organization
    const workloads = await this.getAgentWorkloads(ticket.organization_id);

    // If ticket already has a team assigned, try to find agent from that team
    if (ticket.team_id) {
      const teamAgent = await this.findLeastLoadedAgent(
        workloads,
        ticket.team_id,
      );
      if (teamAgent) return teamAgent;
    }

    // If no team agent found or no team specified, find least loaded agent overall
    const agent = await this.findLeastLoadedAgent(workloads);
    return agent;
  }

  async autoAssignTicket(ticketId: string): Promise<boolean> {
    // Get ticket details
    const { data: ticket, error: ticketError } = await this.supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) return false;

    // Find best agent
    const assignedTo = await this.routeTicket(ticket);
    if (!assignedTo) return false;

    // Update ticket assignment
    const { error: updateError } = await this.supabase
      .from('tickets')
      .update({ assigned_to: assignedTo })
      .eq('id', ticketId);

    return !updateError;
  }

  async autoAssignUnassignedTickets(organizationId: string): Promise<number> {
    // Get all unassigned tickets
    const { data: tickets, error: ticketsError } = await this.supabase
      .from('tickets')
      .select('*')
      .eq('organization_id', organizationId)
      .is('assigned_to', null)
      .in('status', ['open']);

    if (ticketsError || !tickets) return 0;

    // Get agent workloads once for all tickets
    const workloads = await this.getAgentWorkloads(organizationId);

    // Assign each ticket
    let assignedCount = 0;
    for (const ticket of tickets) {
      const assignedTo = await this.findLeastLoadedAgent(
        workloads,
        ticket.team_id,
      );

      if (assignedTo) {
        const { error: updateError } = await this.supabase
          .from('tickets')
          .update({ assigned_to: assignedTo })
          .eq('id', ticket.id);

        if (!updateError) {
          assignedCount++;
          // Update local workload tracking
          const agentWorkload = workloads.find((w) => w.id === assignedTo);
          if (agentWorkload) agentWorkload.activeTickets++;
        }
      }
    }

    return assignedCount;
  }
}
