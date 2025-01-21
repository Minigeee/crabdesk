'use client';

import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/ui/search-bar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type TicketFilters as TicketFiltersType } from '@/lib/types/ticket';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export function TicketFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL
  const [filters, setFilters] = useState<TicketFiltersType>({
    status: searchParams.getAll('status') as (typeof STATUSES)[number][],
    priority: searchParams.getAll('priority') as (typeof PRIORITIES)[number][],
    search: searchParams.get('search') || '',
  });

  const updateUrl = useCallback(
    (newFilters: TicketFiltersType) => {
      const params = new URLSearchParams();

      // Preserve non-filter params
      const preserveParams = ['page', 'sort', 'direction'];
      preserveParams.forEach((param) => {
        const value = searchParams.get(param);
        if (value) params.set(param, value);
      });

      // Update search param
      if (newFilters.search) {
        params.set('search', newFilters.search);
      }

      // Update status params
      if (newFilters.status?.length) {
        newFilters.status.forEach((status) => {
          params.append('status', status);
        });
      }

      // Update priority params
      if (newFilters.priority?.length) {
        newFilters.priority.forEach((priority) => {
          params.append('priority', priority);
        });
      }

      // Reset to first page when filters change
      params.delete('page');

      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleStatusChange = (value: (typeof STATUSES)[number]) => {
    const newStatuses = filters.status?.includes(value)
      ? filters.status.filter((s) => s !== value)
      : [...(filters.status || []), value];

    const newFilters = { ...filters, status: newStatuses };
    setFilters(newFilters);
    updateUrl(newFilters);
  };

  const handlePriorityChange = (value: (typeof PRIORITIES)[number]) => {
    const newPriorities = filters.priority?.includes(value)
      ? filters.priority.filter((p) => p !== value)
      : [...(filters.priority || []), value];

    const newFilters = { ...filters, priority: newPriorities };
    setFilters(newFilters);
    updateUrl(newFilters);
  };

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, search: value };
    setFilters(newFilters);
    updateUrl(newFilters);
  };

  const clearFilters = () => {
    const newFilters = { status: [], priority: [], search: '' };
    setFilters(newFilters);
    updateUrl(newFilters);
  };

  const hasActiveFilters = !!(
    filters.search ||
    filters.status?.length ||
    filters.priority?.length
  );

  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
      <div className='flex-1'>
        <div className='max-w-sm'>
          <SearchBar
            value={filters.search ?? ''}
            onChange={handleSearchChange}
            placeholder='Search tickets...'
          />
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <Select
          value={filters.status?.length ? filters.status.join(',') : undefined}
          onValueChange={(value) =>
            handleStatusChange(value as (typeof STATUSES)[number])
          }
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={
            filters.priority?.length ? filters.priority.join(',') : undefined
          }
          onValueChange={(value) =>
            handlePriorityChange(value as (typeof PRIORITIES)[number])
          }
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Priority' />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant='outline'
            onClick={clearFilters}
            className='whitespace-nowrap'
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
