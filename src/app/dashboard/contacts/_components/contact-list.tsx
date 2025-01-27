'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useContacts } from '@/lib/contacts/use-contacts';
import type { Tables } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { COLUMNS } from './columns';

type SortButtonProps = {
  active: boolean;
  ascending: boolean;
  onSort: () => void;
};

function SortButton({ active, ascending, onSort }: SortButtonProps) {
  return (
    <Button
      variant='ghost'
      size='sm'
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
          <ArrowUp className='h-4 w-4' />
        ) : (
          <ArrowDown className='h-4 w-4' />
        )
      ) : (
        <ArrowUpDown className='h-4 w-4' />
      )}
    </Button>
  );
}

export function ContactList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const page = Number(searchParams.get('page')) || 1;
  const sortColumn =
    (searchParams.get('sort') as keyof Tables<'contacts'>) || 'last_seen_at';
  const sortAscending = searchParams.get('order') === 'asc';
  const limit = 20;

  const { data, isPending } = useContacts({
    query,
    limit,
    offset: (page - 1) * limit,
    orderBy: { column: sortColumn, ascending: sortAscending },
  });

  const handleSort = useCallback(
    (column: keyof Tables<'contacts'>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (column === sortColumn) {
        params.set('order', sortAscending ? 'desc' : 'asc');
      } else {
        params.set('sort', column);
        params.set('order', 'asc');
      }
      if (params.get('page') === '1') {
        params.delete('page');
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams, sortColumn, sortAscending]
  );

  if (!data && !isPending) {
    return (
      <div className='flex min-h-[400px] items-center justify-center rounded-md border border-dashed p-8 text-center'>
        <div>
          <p className='text-sm text-muted-foreground'>No contacts found</p>
        </div>
      </div>
    );
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableHead
                key={column.id}
                style={{ width: column.width }}
                className={
                  column.sortable ? 'cursor-pointer select-none' : undefined
                }
                onClick={() =>
                  column.sortable &&
                  handleSort(column.id as keyof Tables<'contacts'>)
                }
              >
                <div className='flex items-center space-x-2'>
                  <span>{column.label}</span>
                  {column.sortable && (
                    <SortButton
                      active={sortColumn === column.id}
                      ascending={sortAscending}
                      onSort={() =>
                        handleSort(column.id as keyof Tables<'contacts'>)
                      }
                    />
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending ? (
            <TableRow>
              <TableCell colSpan={COLUMNS.length} className='h-24 text-center'>
                <div className='flex items-center justify-center space-x-2'>
                  <Loader2 className='mr-2 h-6 w-6 animate-spin' />
                  Loading...
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data?.data.map((contact) => (
              <TableRow
                key={contact.id}
                onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                className='cursor-pointer'
              >
                {COLUMNS.map((column) => (
                  <TableCell key={column.id}>{column.cell(contact)}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
