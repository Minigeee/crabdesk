'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type SortableTicketField,
  type TicketWithDetails,
} from '@/lib/types/ticket';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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

interface TicketListProps {
  tickets: TicketWithDetails[];
  totalCount: number;
  currentPage: number;
  onRowClick?: (ticket: TicketWithDetails) => void;
}

export function TicketList({ tickets, onRowClick }: TicketListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = searchParams.get('sort') as SortableTicketField;
  const direction = searchParams.get('direction') as 'asc' | 'desc';

  const handleSort = (field: SortableTicketField) => {
    const params = new URLSearchParams(searchParams);
    if (sort === field) {
      params.set('direction', direction === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sort', field);
      params.set('direction', 'asc');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  if (tickets.length === 0) {
    return (
      <div className='rounded-md border p-4 text-center text-muted-foreground'>
        No tickets found
      </div>
    );
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button variant='ghost' onClick={() => handleSort('title')}>
                Title
                <ArrowUpDown className='ml-2 h-4 w-4' />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant='ghost' onClick={() => handleSort('status')}>
                Status
                <ArrowUpDown className='ml-2 h-4 w-4' />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant='ghost' onClick={() => handleSort('priority')}>
                Priority
                <ArrowUpDown className='ml-2 h-4 w-4' />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant='ghost' onClick={() => handleSort('created_at')}>
                Created
                <ArrowUpDown className='ml-2 h-4 w-4' />
              </Button>
            </TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead className='w-[50px]'></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow
              key={ticket.id}
              onClick={() => {
                if (onRowClick) {
                  onRowClick(ticket);
                } else {
                  router.push(`/tickets/${ticket.id}`);
                }
              }}
              className='cursor-pointer'
            >
              <TableCell className='font-medium'>{ticket.title}</TableCell>
              <TableCell>
                <Badge className={STATUS_COLORS[ticket.status]}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={PRIORITY_COLORS[ticket.priority]}>
                  {ticket.priority}
                </Badge>
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(ticket.created_at), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell>{ticket.customer?.full_name}</TableCell>
              <TableCell>
                {ticket.assignee?.full_name || 'Unassigned'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      className='h-8 w-8 p-0'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/tickets/${ticket.id}`);
                      }}
                    >
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/tickets/${ticket.id}/edit`);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
