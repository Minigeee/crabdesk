'use client';

import { AuditLogList } from '@/components/audit/audit-log-list';
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
import type { Enums } from '@/lib/database.types';
import { TicketWithRelations } from '@/lib/tickets/ticket-service';
import { useTicket, useTicketActions } from '@/lib/tickets/use-tickets';
import { useQueryClient } from '@tanstack/react-query';

interface TicketActionsProps {
  ticket: TicketWithRelations;
  onMergeTicket?: () => void;
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
}: TicketActionsProps) {
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
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
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
                  <SelectValue placeholder='Select priority' />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
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

      <Card className='p-4'>
        <h3 className='mb-4 font-medium'>Activity Log</h3>
        <AuditLogList entityType='ticket' entityId={initialTicket.id} />
      </Card>
    </div>
  );
}
