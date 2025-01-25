'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuditLogs } from '@/lib/audit/use-audit-logs';
import { formatDistanceToNow } from 'date-fns';
import { Activity, UserCircle } from 'lucide-react';

interface AuditLogListProps {
  entityType: string;
  entityId: string;
}

export function AuditLogList({ entityType, entityId }: AuditLogListProps) {
  const { data: logs, isLoading } = useAuditLogs(entityType, entityId);

  if (isLoading) {
    return (
      <div className='space-y-3'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='flex items-start gap-3'>
            <Skeleton className='h-8 w-8 rounded-full' />
            <div className='flex-1 space-y-1'>
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-3 w-1/4' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className='flex items-center justify-center py-8 text-center text-sm text-muted-foreground'>
        <Activity className='mr-2 h-4 w-4' />
        No activity yet
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {logs.map((log) => (
        <div key={log.id} className='flex items-start gap-3'>
          <Avatar className='h-8 w-8'>
            {log.actor?.avatar_url && (
              <AvatarImage src={log.actor.avatar_url} />
            )}
            <AvatarFallback>
              {log.actor?.name?.[0] ?? <UserCircle className='h-4 w-4' />}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1'>
            <div className='text-sm'>
              <span className='font-medium'>{log.actor?.name ?? 'System'}</span>{' '}
              <span className='text-muted-foreground'>
                {formatAuditAction(
                  log.action,
                  log.changes as Record<string, any>
                )}
              </span>
            </div>
            <div className='text-xs text-muted-foreground'>
              {formatDistanceToNow(new Date(log.created_at), {
                addSuffix: true,
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatAuditAction(
  action: string,
  changes: Record<string, any>
): string {
  switch (action) {
    case 'insert':
      return 'created this ticket';
    case 'update': {
      const { old: oldValues, new: newValues } = changes;
      const changedFields = Object.keys(oldValues);
      if (changedFields.length === 0) return 'made changes';

      const fieldUpdates = changedFields.map((field) => {
        const oldValue = oldValues[field];
        const newValue = newValues[field];
        switch (field) {
          case 'status':
            return `changed status from ${oldValue} to ${newValue}`;
          case 'priority':
            return `changed priority from ${oldValue} to ${newValue}`;
          case 'assignee_id':
            return newValue ? 'assigned the ticket' : 'unassigned the ticket';
          case 'team_id':
            return newValue ? 'assigned to team' : 'removed from team';
          default:
            return `updated ${field.replace('_', ' ')}`;
        }
      });

      return fieldUpdates.join(' and ');
    }
    case 'delete':
      return 'deleted this ticket';
    case 'restore':
      return 'restored this ticket';
    default:
      return action;
  }
}
