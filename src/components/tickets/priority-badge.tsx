import { Badge } from '@/components/ui/badge';
import type { Enums } from '@/lib/database.types';
import { humanize } from '@/lib/utils/text';

type PriorityBadgeProps = {
  priority: Enums<'ticket_priority'>;
};

function getPriorityClasses(priority: Enums<'ticket_priority'>) {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
    case 'high':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400';
    case 'normal':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
    case 'low':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-400';
    default:
      return '';
  }
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <Badge variant='secondary' className={getPriorityClasses(priority)}>
      {humanize(priority)}
    </Badge>
  );
}
