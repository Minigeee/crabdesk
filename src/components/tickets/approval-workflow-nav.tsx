import { Button } from '@/components/ui/button';
import {
  useApprovalQueue,
  useNextApprovalTicket,
} from '@/lib/tickets/use-approval-queue';
import { ChevronRight, ListChecks } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ApprovalWorkflowNavProps {
  currentTicketId?: string;
  variant?: 'list' | 'detail';
}

export function ApprovalWorkflowNav({
  currentTicketId,
  variant = 'list',
}: ApprovalWorkflowNavProps) {
  const router = useRouter();
  const { data: queue } = useApprovalQueue();
  const nextTicket = useNextApprovalTicket(currentTicketId);

  if (!queue?.length) return null;

  const handleStartReview = () => {
    router.push(`/dashboard/tickets/${queue[0].number}`);
  };

  const handleNextTicket = () => {
    if (nextTicket) {
      router.push(`/dashboard/tickets/${nextTicket.number}`);
    }
  };

  if (!nextTicket) return null;

  if (variant === 'list') {
    return (
      <Button variant='outline' onClick={handleStartReview} className='gap-2'>
        <ListChecks className='h-4 w-4' />
        Review Responses ({queue.length})
      </Button>
    );
  }

  return (
    <div className='flex items-center gap-4'>
      <span className='text-sm text-muted-foreground'>
        {queue.length - (nextTicket ? queue.indexOf(nextTicket) : queue.length)}{' '}
        of {queue.length} tickets reviewed
      </span>
      <Button
        onClick={handleNextTicket}
        disabled={!nextTicket}
        className='gap-2'
      >
        Next Ticket
        <ChevronRight className='h-4 w-4' />
      </Button>
    </div>
  );
}
