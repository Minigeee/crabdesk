import { Database } from '@/lib/supabase/database.types';

export type Ticket = Database['public']['Tables']['tickets']['Row'];
export type NewTicket = Database['public']['Tables']['tickets']['Insert'];
export type TicketUpdate = Database['public']['Tables']['tickets']['Update'];

export type TicketWithDetails = Ticket & {
  customer: {
    id: string;
    full_name: string;
    email: string;
  };
  assignee?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  team?: {
    id: string;
    name: string;
  } | null;
  organization?: {
    id: string;
    name: string;
  } | null;
};

export type TicketListResponse = {
  tickets: TicketWithDetails[];
  count: number;
};

export type TicketFilters = {
  status?: Ticket['status'][];
  priority?: Ticket['priority'][];
  assignedTo?: string;
  teamId?: string;
  organizationId?: string;
  search?: string;
};

export type TicketSort = {
  field: keyof Ticket;
  direction: 'asc' | 'desc';
}; 