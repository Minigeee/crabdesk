'use client';

import { AuditLogList } from '@/components/audit/audit-log-list';
import { PriorityBadge } from '@/components/tickets/priority-badge';
import { StatusBadge } from '@/components/tickets/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserSelect } from '@/components/users/user-select';
import { auditKeys } from '@/lib/audit/use-audit-logs';
import type { Enums, Tables } from '@/lib/database.types';
import { TicketWithRelations } from '@/lib/tickets/ticket-service';
import { useTicket, useTicketActions } from '@/lib/tickets/use-tickets';
import { useQueryClient } from '@tanstack/react-query';
import { approvalQueueKeys } from '@/lib/tickets/use-approval-queue';
import type { ApprovalQueueTicket } from '@/lib/tickets/use-approval-queue';
import { useRouter } from 'next/navigation';
import { AutoResponderService } from '@/lib/tickets/auto-responder-service';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/hooks';

interface TicketActionsProps {
  ticket: TicketWithRelations;
  onMergeTicket?: () => void;
  hideAuditLog?: boolean;
}

const TICKET_STATUSES: Enums<'ticket_status'>[] = [
  'open',
  'pending',
  'resolved',
  'closed',
];
const TICKET_PRIORITIES: Enums<'ticket_priority'>[] = [
  'low',
  'normal',
  'high',
  'urgent',
];

export function TicketActions({
  ticket: initialTicket,
  onMergeTicket,
  hideAuditLog,
}: TicketActionsProps) {
  const { organization } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  // Use hook for optimistic update
  const { data: ticket } = useTicket(initialTicket.id, true, {
    initialData: initialTicket,
  });
  const { updateStatus, updatePriority, updateAssignee } = useTicketActions(
    initialTicket.id
  );

  // Helper for audit log invalidation
  const invalidateAuditLogs = () => {
    return queryClient.invalidateQueries({
      queryKey: [...auditKeys.list('ticket', initialTicket.id)],
    });
  };

  // Handlers with audit log invalidation
  const handleStatusUpdate = async (status: Enums<'ticket_status'>) => {
    await updateStatus(status);
    await invalidateAuditLogs();
  };

  const handlePriorityUpdate = async (priority: Enums<'ticket_priority'>) => {
    await updatePriority(priority);
    await invalidateAuditLogs();
  };

  const handleAssigneeUpdate = async (assigneeId: string | null) => {
    await updateAssignee(assigneeId);
    await invalidateAuditLogs();
  };

  // Get next ticket in approval queue
  const handleNextTicket = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('tickets')
      .select(`
        *,
        latest_draft:response_drafts(
          *,
          created_at
        )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: true });

    if (!data) return;

    // Filter to only tickets with drafts awaiting approval
    const approvalQueue = data
      .filter(ticket => {
        const draft = Array.isArray(ticket.latest_draft) 
          ? ticket.latest_draft[0] 
          : ticket.latest_draft;
        return draft?.status === 'pending';
      })
      .map(ticket => ({
        ...ticket,
        latest_draft: Array.isArray(ticket.latest_draft) 
          ? ticket.latest_draft[0] 
          : ticket.latest_draft
      })) as ApprovalQueueTicket[];

    // Find the next ticket
    const currentIndex = approvalQueue.findIndex(t => t.id === initialTicket.id);
    const nextTicket = currentIndex === -1 || currentIndex === approvalQueue.length - 1 
      ? null 
      : approvalQueue[currentIndex + 1];

    // Navigate to next ticket if available
    if (nextTicket) {
      router.push(`/dashboard/tickets/${nextTicket.number}`);
    } else {
      // No more tickets to review, go back to list
      router.push('/dashboard/tickets');
    }
  };

  return (
    <div className='space-y-6'>
      <Card className='p-4'>
        <div className='space-y-4'>
          <div>
            <Label>Status</Label>
            <div className='mt-1.5 flex items-center gap-3'>
              <Select
                value={ticket?.status}
                onValueChange={(value) =>
                  handleStatusUpdate(value as Enums<'ticket_status'>)
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {ticket?.status && <StatusBadge status={ticket.status} />}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TICKET_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      <StatusBadge status={status} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Priority</Label>
            <div className='mt-1.5 flex items-center gap-3'>
              <Select
                value={ticket?.priority}
                onValueChange={(value) =>
                  handlePriorityUpdate(value as Enums<'ticket_priority'>)
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {ticket?.priority && <PriorityBadge priority={ticket.priority} />}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TICKET_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      <PriorityBadge priority={priority} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Assignee</Label>
            <div className='mt-1.5'>
              <UserSelect
                value={ticket?.assignee_id ?? undefined}
                onChange={(value) => handleAssigneeUpdate(value ?? null)}
              />
            </div>
          </div>

          {onMergeTicket && (
            <Button
              variant='outline'
              className='w-full'
              onClick={onMergeTicket}
            >
              Merge Ticket
            </Button>
          )}
        </div>
      </Card>

      {!hideAuditLog && (
        <Card className='p-4'>
          <h3 className='mb-4 font-medium'>Activity Log</h3>
          <AuditLogList entityType='ticket' entityId={initialTicket.id} />
        </Card>
      )}
    </div>
  );
}
