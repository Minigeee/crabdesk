import { Badge } from '@/components/ui/badge';
import type { Tables } from '@/lib/database.types';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type ResponseStatus =
  | 'awaiting_auto_response'
  | 'awaiting_approval'
  | 'needs_manual_response'
  | 'response_edited'
  | 'response_sent'
  | 'needs_action'
  | 'customer_replied'
  | 'resolved';

function getStatusClasses(status: ResponseStatus) {
  switch (status) {
    case 'awaiting_auto_response':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-400';
    case 'awaiting_approval':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
    case 'needs_manual_response':
      return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
    case 'response_edited':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400';
    case 'response_sent':
      return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
    case 'needs_action':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400';
    case 'customer_replied':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400';
    case 'resolved':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-400';
    default:
      return '';
  }
}

const statusConfig: Record<ResponseStatus, { label: string }> = {
  awaiting_auto_response: {
    label: 'Processing',
  },
  awaiting_approval: {
    label: 'Needs Approval',
  },
  needs_manual_response: {
    label: 'Manual Response',
  },
  response_edited: {
    label: 'Ready to Send',
  },
  response_sent: {
    label: 'Sent',
  },
  needs_action: {
    label: 'Action Required',
  },
  customer_replied: {
    label: 'Customer Replied',
  },
  resolved: {
    label: 'Resolved',
  },
};

export function ResponseStatusBadge({ ticket }: { ticket: Tables<'tickets'> }) {
  // Query the latest response draft for this ticket
  const { data: draft } = useQuery({
    queryKey: ['response_draft', ticket.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('response_drafts')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
  });

  // Determine the response status based on ticket and draft state
  const getResponseStatus = (): ResponseStatus => {
    // If ticket is resolved, show that first
    if (ticket.status === 'resolved') {
      return 'resolved';
    }

    // If no draft exists yet
    if (!draft) {
      return 'awaiting_auto_response';
    }

    // Handle different draft statuses
    switch (draft.status) {
      case 'pending':
        return 'awaiting_approval';
      case 'rejected':
        return 'needs_manual_response';
      case 'modified':
        return 'response_edited';
      case 'approved':
        // If approved but not sent yet
        if (!draft.approved_at) {
          return 'response_edited';
        }
        return 'response_sent';
    }

    // Default case
    return 'needs_action';
  };

  const status = getResponseStatus();
  const config = statusConfig[status];

  return (
    <Badge variant='secondary' className={cn(getStatusClasses(status))}>
      {config.label}
    </Badge>
  );
} 