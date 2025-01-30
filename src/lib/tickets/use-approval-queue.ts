import { Tables } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const approvalQueueKeys = {
  all: ['approval_queue'] as const,
  queue: () => [...approvalQueueKeys.all, 'queue'] as const,
  ticket: (id: string) => [...approvalQueueKeys.all, 'ticket', id] as const,
};

export interface ApprovalQueueTicket extends Tables<'tickets'> {
  latest_draft: Tables<'response_drafts'>;
}

export function useApprovalQueue() {
  const supabase = createClient();

  return useQuery({
    queryKey: approvalQueueKeys.queue(),
    queryFn: async () => {
      // Get tickets with their latest draft that needs approval
      const { data, error } = await supabase
        .from('tickets')
        .select(
          `
          *,
          latest_draft:response_drafts(
            *,
            created_at
          )
        `
        )
        .eq('status', 'open')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filter to only tickets with drafts awaiting approval
      const approvalQueue = data
        .filter((ticket) => {
          const draft = Array.isArray(ticket.latest_draft)
            ? ticket.latest_draft[0]
            : ticket.latest_draft;
          return draft?.status === 'pending';
        })
        .map((ticket) => ({
          ...ticket,
          latest_draft: Array.isArray(ticket.latest_draft)
            ? ticket.latest_draft[0]
            : ticket.latest_draft,
        }));

      return approvalQueue as ApprovalQueueTicket[];
    },
  });
}

export function useNextApprovalTicket(currentTicketId?: string) {
  const { data: queue } = useApprovalQueue();

  return useMemo(() => {
    if (!queue?.length || !currentTicketId) return null;

    const currentIndex = queue.findIndex((t) => t.id === currentTicketId);
    if (currentIndex === -1) return null;

    return queue[(currentIndex + 1) % queue.length];
  }, [queue, currentTicketId]);
}
