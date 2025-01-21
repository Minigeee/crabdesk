import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { type TicketWithDetails } from '@/lib/types/ticket';
import { formatDistanceToNow } from 'date-fns';

const PRIORITY_COLORS = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-yellow-500',
  urgent: 'bg-red-500',
} as const;

const STATUS_COLORS = {
  open: 'bg-green-500',
  in_progress: 'bg-blue-500',
  resolved: 'bg-gray-500',
  closed: 'bg-gray-700',
} as const;

interface TicketSidebarProps {
  ticket: TicketWithDetails;
}

export function TicketSidebar({ ticket }: TicketSidebarProps) {
  return (
    <div className='w-80 border-r bg-muted/10'>
      <div className='space-y-6 p-6'>
        {/* Title */}
        <div>
          <h2 className='text-lg font-semibold'>{ticket.title}</h2>
          <h1 className='text-xs text-muted-foreground'>{ticket.id}</h1>
        </div>

        {/* Description */}
        <div className='space-y-2'>
          <Label>Description</Label>
          <p className='whitespace-pre-wrap text-sm'>
            {ticket.description}
          </p>
        </div>

        {/* Status and Priority */}
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label>Status</Label>
            <Badge
              className={cn(
                'w-full justify-center',
                STATUS_COLORS[ticket.status],
              )}
            >
              {ticket.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className='space-y-2'>
            <Label>Priority</Label>
            <Badge
              className={cn(
                'w-full justify-center',
                PRIORITY_COLORS[ticket.priority],
              )}
            >
              {ticket.priority}
            </Badge>
          </div>
        </div>

        {/* Assignment */}
        <div className='space-y-2'>
          <Label>Assignment</Label>
          <div className='rounded-lg border bg-background px-4 py-3'>
            <div className='space-y-2'>
              <div>
                <p className='text-sm text-muted-foreground'>Assigned To</p>
                <p className='text-sm font-medium'>
                  {ticket.assignee?.full_name || 'Unassigned'}
                </p>
              </div>
              {ticket.team_id && (
                <div>
                  <p className='text-sm text-muted-foreground'>Team</p>
                  <p className='text-sm font-medium'>
                    {ticket.team?.name || 'Unknown Team'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className='space-y-2'>
          <Label>Customer</Label>
          <div className='rounded-lg border bg-background px-4 py-3'>
            <div className='space-y-1'>
              <p className='text-sm font-semibold'>
                {ticket.customer?.full_name}
              </p>
              <p className='text-xs text-muted-foreground'>
                {ticket.customer?.email}
              </p>
              {ticket.organization_id && (
                <p className='text-xs text-muted-foreground'>
                  {ticket.organization?.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div className='space-y-2'>
            <Label>Tags</Label>
            <div className='flex flex-wrap gap-2'>
              {ticket.tags.map((tag) => (
                <Badge key={tag} variant='secondary'>
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className='space-y-2'>
          <Label>Details</Label>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Created</span>
              <span>
                {formatDistanceToNow(new Date(ticket.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>Updated</span>
              <span>
                {formatDistanceToNow(new Date(ticket.updated_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
            {ticket.due_date && (
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Due</span>
                <span>
                  {formatDistanceToNow(new Date(ticket.due_date), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 