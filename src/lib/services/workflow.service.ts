import { createClient } from '@/lib/supabase/server';
import { type SupabaseClient } from '@supabase/supabase-js';
import { type Database } from '@/lib/supabase/database.types';
import { type Ticket } from '@/lib/types/ticket';
import { 
  type WorkflowTransition,
  type WorkflowValidationResult,
  type StatusMetadata,
  type WorkflowConfig
} from '@/lib/types/workflow';

export class WorkflowService {
  private supabase: SupabaseClient<Database>;
  private config: WorkflowConfig;

  // Define base transitions (can be overridden by organization config)
  private readonly baseTransitions: WorkflowTransition[] = [
    {
      from: 'open',
      to: 'in_progress',
      validation: {
        required: [], // No hard requirements
        recommended: [
          {
            type: 'hasAssignee',
            check: (ticket: Ticket) => !!ticket.assigned_to,
            message: 'Consider assigning the ticket before starting work'
          }
        ]
      },
      actions: [
        {
          type: 'notify',
          execute: async (ticket: Ticket) => {
            console.log('Ticket started:', ticket.id);
          }
        }
      ]
    },
    {
      from: 'in_progress',
      to: 'resolved',
      validation: {
        required: [], // No hard requirements
        recommended: [
          {
            type: 'hasResponse',
            check: async (ticket: Ticket) => {
              const { count } = await this.supabase
                .from('conversations')
                .select('*', { count: 'exact', head: true })
                .eq('ticket_id', ticket.id)
                .eq('is_internal', false);
              return (count || 0) > 0;
            },
            message: 'Consider adding a response before resolving'
          }
        ]
      }
    },
    {
      from: 'resolved',
      to: 'closed',
      validation: {
        required: [], // No hard requirements
        recommended: [
          {
            type: 'custom',
            check: async (ticket: Ticket) => {
              const resolvedDate = new Date(ticket.updated_at);
              const now = new Date();
              return now.getTime() - resolvedDate.getTime() >= 24 * 60 * 60 * 1000;
            },
            message: 'Consider waiting 24 hours before closing to ensure customer satisfaction'
          }
        ]
      }
    },
    // Allow reopening from any status to open
    {
      from: 'resolved',
      to: 'open',
      actions: [
        {
          type: 'notify',
          execute: async (ticket: Ticket) => {
            console.log('Ticket reopened:', ticket.id);
          }
        }
      ]
    },
    {
      from: 'closed',
      to: 'open',
      actions: [
        {
          type: 'notify',
          execute: async (ticket: Ticket) => {
            console.log('Ticket reopened:', ticket.id);
          }
        }
      ]
    }
  ];

  // Define status metadata
  private readonly statusMetadata: Record<Ticket['status'], StatusMetadata> = {
    open: {
      label: 'Open',
      description: 'Ticket needs attention',
      color: 'red',
      icon: 'alert-circle',
      order: 1
    },
    in_progress: {
      label: 'In Progress',
      description: 'Work has started',
      color: 'blue',
      icon: 'clock',
      order: 2
    },
    resolved: {
      label: 'Resolved',
      description: 'Solution provided',
      color: 'green',
      icon: 'check-circle',
      order: 3
    },
    closed: {
      label: 'Closed',
      description: 'No further action needed',
      color: 'gray',
      icon: 'archive',
      order: 4
    }
  };

  constructor(supabase?: SupabaseClient<Database>, config?: Partial<WorkflowConfig>) {
    if (!supabase) {
      throw new Error('Supabase client must be provided');
    }
    this.supabase = supabase;

    // Set default config
    this.config = {
      allowFreeTransitions: true,
      requireAssigneeForProgress: false,
      requireResponseForResolution: false,
      autoCloseAfterResolution: {
        enabled: false,
        hours: 24
      },
      allowCustomerToReopen: true,
      ...config
    };
  }

  static async create(config?: Partial<WorkflowConfig>): Promise<WorkflowService> {
    const supabase = await createClient();
    return new WorkflowService(supabase, config);
  }

  getStatusMetadata(status: Ticket['status']): StatusMetadata {
    return this.statusMetadata[status];
  }

  getAllowedTransitions(currentStatus: Ticket['status']): Ticket['status'][] {
    if (this.config.allowFreeTransitions) {
      // Allow transitions to any status except current
      return Object.keys(this.statusMetadata).filter(
        status => status !== currentStatus
      ) as Ticket['status'][];
    }

    // Return configured transitions
    return this.baseTransitions
      .filter(t => t.from === currentStatus)
      .map(t => t.to);
  }

  private async validateTransition(
    ticket: Ticket,
    newStatus: Ticket['status']
  ): Promise<WorkflowValidationResult> {
    // If free transitions are allowed and not explicitly forbidden by config
    if (this.config.allowFreeTransitions) {
      const required: string[] = [];
      const recommended: string[] = [];

      // Apply organization-specific rules
      if (newStatus === 'in_progress' && this.config.requireAssigneeForProgress) {
        if (!ticket.assigned_to) {
          required.push('Ticket must be assigned before starting work');
        }
      }

      if (newStatus === 'resolved' && this.config.requireResponseForResolution) {
        const { count } = await this.supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('ticket_id', ticket.id)
          .eq('is_internal', false);
        
        if ((count || 0) === 0) {
          required.push('Ticket must have at least one response before resolving');
        }
      }

      return {
        isValid: required.length === 0,
        required,
        recommended
      };
    }

    // Find configured transition
    const transition = this.baseTransitions.find(
      t => t.from === ticket.status && t.to === newStatus
    );

    if (!transition) {
      return {
        isValid: false,
        required: [`Invalid transition from ${ticket.status} to ${newStatus}`],
        recommended: []
      };
    }

    const required: string[] = [];
    const recommended: string[] = [];

    // Check validations
    if (transition.validation) {
      // Check required conditions
      for (const condition of transition.validation.required) {
        const isValid = await condition.check(ticket);
        if (!isValid) {
          required.push(condition.message);
        }
      }

      // Check recommended conditions
      for (const condition of transition.validation.recommended) {
        const isValid = await condition.check(ticket);
        if (!isValid) {
          recommended.push(condition.message);
        }
      }
    }

    return {
      isValid: required.length === 0,
      required,
      recommended
    };
  }

  async updateStatus(
    ticketId: string,
    newStatus: Ticket['status']
  ): Promise<{ success: boolean; required: string[]; recommended: string[] }> {
    // Get current ticket
    const { data: ticket, error: ticketError } = await this.supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return {
        success: false,
        required: ['Ticket not found'],
        recommended: []
      };
    }

    // Validate the transition
    const validation = await this.validateTransition(ticket, newStatus);
    if (!validation.isValid) {
      return {
        success: false,
        required: validation.required,
        recommended: validation.recommended
      };
    }

    // Find transition for actions
    const transition = this.baseTransitions.find(
      t => t.from === ticket.status && t.to === newStatus
    );

    // Update the status
    const { error: updateError } = await this.supabase
      .from('tickets')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (updateError) {
      return {
        success: false,
        required: ['Failed to update ticket status'],
        recommended: []
      };
    }

    // Execute transition actions if defined
    if (transition?.actions) {
      for (const action of transition.actions) {
        await action.execute(ticket);
      }
    }

    return {
      success: true,
      required: [],
      recommended: validation.recommended
    };
  }

  async getStatusHistory(ticketId: string): Promise<{
    status: Ticket['status'];
    changed_at: string;
    changed_by: string;
  }[]> {
    const { data, error } = await this.supabase
      .from('tickets')
      .select('status, updated_at, metadata->status_history')
      .eq('id', ticketId)
      .single();

    if (error || !data) return [];

    return (data.status_history || []) as {
      status: Ticket['status'];
      changed_at: string;
      changed_by: string;
    }[];
  }
} 