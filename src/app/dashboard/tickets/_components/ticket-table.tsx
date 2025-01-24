'use client';

import { PriorityBadge } from '@/components/tickets/priority-badge';
import { StatusBadge } from '@/components/tickets/status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Tables } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useTicketQueue } from './ticket-queue-provider';

dayjs.extend(relativeTime);

type SortButtonProps = {
  active: boolean;
  ascending: boolean;
  onSort: () => void;
};

function SortButton({ active, ascending, onSort }: SortButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        '-ml-3 h-8',
        active
          ? 'text-foreground hover:text-foreground'
          : 'text-muted-foreground hover:text-muted-foreground'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSort();
      }}
    >
      {active ? (
        ascending ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="h-4 w-4" />
      )}
    </Button>
  );
}

type ColumnDef = {
  id: keyof Tables<'tickets'>;
  label: string;
  sortable?: boolean;
  width?: number;
  cell: (ticket: Tables<'tickets'>) => React.ReactNode;
};

const COLUMNS: ColumnDef[] = [
  {
    id: 'number',
    label: 'ID',
    sortable: true,
    width: 80,
    cell: (ticket) => `#${ticket.number}`,
  },
  {
    id: 'subject',
    label: 'Subject',
    sortable: true,
    cell: (ticket) => ticket.subject,
  },
  {
    id: 'status',
    label: 'Status',
    sortable: true,
    width: 120,
    cell: (ticket) => <StatusBadge status={ticket.status} />,
  },
  {
    id: 'priority',
    label: 'Priority',
    sortable: true,
    width: 120,
    cell: (ticket) => <PriorityBadge priority={ticket.priority} />,
  },
  {
    id: 'created_at',
    label: 'Created',
    sortable: true,
    width: 160,
    cell: (ticket) => dayjs(ticket.created_at).fromNow(),
  },
];

export function TicketTable() {
  const router = useRouter();
  const {
    tickets,
    selectedTickets,
    setSelectedTickets,
    sort,
    setSort,
    setPreviewTicketId,
  } = useTicketQueue();

  const [focusedTicketId, setFocusedTicketId] = useState<string | null>(null);

  // Handle row selection
  const toggleTicket = useCallback(
    (ticketId: string, checked: boolean) => {
      setSelectedTickets((prev) =>
        checked ? [...prev, ticketId] : prev.filter((id) => id !== ticketId)
      );
    },
    [setSelectedTickets]
  );

  const toggleAllTickets = useCallback(
    (checked: boolean) => {
      setSelectedTickets(checked ? tickets.map((t) => t.id) : []);
    },
    [tickets, setSelectedTickets]
  );

  // Handle sorting
  const handleSort = useCallback(
    (column: keyof Tables<'tickets'>) => {
      setSort({
        column,
        ascending: sort.column === column ? !sort.ascending : true,
      });
    },
    [setSort, sort]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown': {
          e.preventDefault();
          const currentIndex = tickets.findIndex(
            (t) => t.id === focusedTicketId
          );
          let nextIndex = currentIndex;
          if (e.key === 'ArrowUp') {
            nextIndex =
              currentIndex <= 0 ? tickets.length - 1 : currentIndex - 1;
          } else {
            nextIndex =
              currentIndex >= tickets.length - 1 ? 0 : currentIndex + 1;
          }
          const nextTicket = tickets[nextIndex];
          if (nextTicket) {
            setFocusedTicketId(nextTicket.id);
            setPreviewTicketId(nextTicket.id);
          }
          break;
        }
        case ' ': {
          e.preventDefault();
          if (focusedTicketId) {
            toggleTicket(
              focusedTicketId,
              !selectedTickets.includes(focusedTicketId)
            );
          }
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (focusedTicketId) {
            const focusedIndex = tickets.findIndex(
              (t) => t.id === focusedTicketId
            );
            if (focusedIndex >= 0) {
              router.push(`/dashboard/tickets/${tickets[focusedIndex].number}`);
            }
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    tickets,
    focusedTicketId,
    selectedTickets,
    toggleTicket,
    setPreviewTicketId,
  ]);

  return (
    <div className='relative'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[40px] p-0'>
              <div className='flex h-10 items-center justify-center'>
                <Checkbox
                  checked={
                    tickets.length > 0 &&
                    selectedTickets.length === tickets.length
                  }
                  onCheckedChange={toggleAllTickets}
                  aria-label='Select all tickets'
                />
              </div>
            </TableHead>
            {COLUMNS.map((column) => (
              <TableHead
                key={column.id}
                style={{ width: column.width }}
                className={cn(column.sortable && 'cursor-pointer select-none')}
                onClick={() => column.sortable && handleSort(column.id)}
              >
                <div className='flex items-center space-x-2'>
                  <span>{column.label}</span>
                  {column.sortable && (
                    <SortButton
                      active={sort.column === column.id}
                      ascending={sort.ascending}
                      onSort={() => handleSort(column.id)}
                    />
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow
              key={ticket.id}
              data-state={
                selectedTickets.includes(ticket.id) ? 'selected' : 'inactive'
              }
              className={cn(
                'cursor-pointer',
                focusedTicketId === ticket.id && 'bg-accent'
              )}
              onClick={() => setPreviewTicketId(ticket.id)}
              onFocus={() => setFocusedTicketId(ticket.id)}
              tabIndex={0}
            >
              <TableCell className='p-0'>
                <div
                  className='flex h-14 items-center justify-center'
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedTickets.includes(ticket.id)}
                    onCheckedChange={(checked) =>
                      toggleTicket(ticket.id, checked as boolean)
                    }
                    aria-label={`Select ticket ${ticket.number}`}
                  />
                </div>
              </TableCell>
              {COLUMNS.map((column) => (
                <TableCell key={column.id}>{column.cell(ticket)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
