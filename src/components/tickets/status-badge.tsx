import { Badge } from '@/components/ui/badge';
import type { Enums } from '@/lib/database.types';
import { humanize } from '@/lib/utils/text';

type StatusBadgeProps = {
  status: Enums<'ticket_status'>;
};

function getStatusClasses(status: Enums<'ticket_status'>) {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400';
    case 'resolved':
      return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
    case 'closed':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-400';
    default:
      return '';
  }
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant='secondary' className={getStatusClasses(status)}>
      {humanize(status)}
    </Badge>
  );
}
