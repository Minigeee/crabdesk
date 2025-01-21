import { type Database } from '@/lib/supabase/database.types';

export type Ticket = Database['public']['Tables']['tickets']['Row'];
export type NewTicket = Database['public']['Tables']['tickets']['Insert'];
export type TicketUpdate = Database['public']['Tables']['tickets']['Update'];

export type TicketWithDetails = Ticket & {
  customer: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  assignee: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  team: {
    id: string;
    name: string;
  } | null;
  organization: {
    id: string;
    name: string;
  } | null;
};

export type TicketListResponse = {
  tickets: TicketWithDetails[];
  count: number;
};

export type TicketStatus = Ticket['status'];
export type TicketPriority = Ticket['priority'];

export type TicketFilters = {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  search?: string;
  assignedTo?: string;
  teamId?: string;
  organizationId?: string;
};

export type SortableTicketField = 'title' | 'created_at' | 'updated_at' | 'status' | 'priority' | 'due_date';

export type TicketSort = {
  field: SortableTicketField;
  direction: 'asc' | 'desc';
}; 