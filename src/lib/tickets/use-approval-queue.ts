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
  drafts: Tables<'response_drafts'>[];
  latest_pending_draft: Tables<'response_drafts'>;
}

export function useApprovalQueue() {
  const supabase = createClient();

  return useQuery({
    queryKey: approvalQueueKeys.queue(),
    queryFn: async () => {
      // Get tickets with all their drafts
      const { data, error } = await supabase
        .from('tickets')
        .select(
          `
          *,
          drafts:response_drafts(
            *
          )
        `
        )
        .eq('status', 'open')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filter to tickets that have any pending drafts
      const approvalQueue = data
        .filter((ticket) => {
          const drafts = Array.isArray(ticket.drafts) ? ticket.drafts : [];
          return drafts.some((draft) => draft.status === 'pending');
        })
        .map((ticket) => {
          const drafts = Array.isArray(ticket.drafts) ? ticket.drafts : [];
          // Get the latest pending draft
          const latestPendingDraft = drafts
            .filter((draft) => draft.status === 'pending')
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )[0];

          return {
            ...ticket,
            latest_pending_draft: latestPendingDraft,
          };
        });

      return approvalQueue as ApprovalQueueTicket[];
    },
  });
}

export function useNextApprovalTicket(currentTicketId?: string) {
  const { data: queue } = useApprovalQueue();

  return useMemo(() => {
    if (!queue?.length || !currentTicketId) return null;

    const currentIndex = queue.findIndex((t) => t.id === currentTicketId);
    if (currentIndex === -1 || (queue.length === 1 && currentIndex === 0))
      return null;

    return queue[(currentIndex + 1) % queue.length];
  }, [queue, currentTicketId]);
}
