'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SearchBar } from '@/components/ui/search-bar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/auth/hooks';
import type { Enums } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { CheckIcon, FilterIcon, UserIcon, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTicketQueue } from './ticket-queue-provider';

// Separate closed status for special handling
const OPEN_STATUS_OPTIONS: { label: string; value: Enums<'ticket_status'> }[] =
  [
    { label: 'Open', value: 'open' },
    { label: 'Pending', value: 'pending' },
    { label: 'Resolved', value: 'resolved' },
  ];

const PRIORITY_OPTIONS: { label: string; value: Enums<'ticket_priority'> }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

export function TicketFilters() {
  const { filters, setFilters } = useTicketQueue();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  // Count active filters (excluding assignee since it's now separate)
  const activeFilterCount = [
    localFilters.status?.length || 0,
    localFilters.priority?.length || 0,
    localFilters.team_id ? 1 : 0,
    localFilters.dateRange ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleStatusToggle = (status: Enums<'ticket_status'>) => {
    const current = localFilters.status || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];

    setLocalFilters((prev) => ({
      ...prev,
      status: updated.length > 0 ? updated : undefined,
    }));
  };

  const handleShowClosedToggle = (checked: boolean) => {
    setLocalFilters((prev) => ({
      ...prev,
      includeClosed: checked,
    }));
  };

  const handlePriorityToggle = (priority: Enums<'ticket_priority'>) => {
    const current = localFilters.priority || [];
    const updated = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority];

    setLocalFilters((prev) => ({
      ...prev,
      priority: updated.length > 0 ? updated : undefined,
    }));
  };

  const handleAssigneeToggle = () => {
    // Directly update filters for immediate effect
    const newFilters = {
      ...filters,
      assignee_id: filters.assignee_id ? undefined : user?.id,
    };
    setFilters(newFilters);
    setLocalFilters(newFilters);
  };

  const handleApply = () => {
    setFilters(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters = {
      status: undefined,
      priority: undefined,
      assignee_id: undefined,
      team_id: undefined,
      dateRange: undefined,
      includeClosed: false,
    };
    setLocalFilters(resetFilters);
    setFilters(resetFilters);
    setIsOpen(false);
  };

  const handleSearch = (value: string) => {
    setFilters({
      ...filters,
      search: value || undefined,
    });
  };

  return (
    <div className='flex items-center gap-4'>
      <SearchBar
        value={filters.search || ''}
        onChange={handleSearch}
        placeholder='Search tickets...'
        className='w-[300px]'
      />

      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          className={cn(
            'gap-2',
            filters.assignee_id === user?.id && 'border-primary bg-primary/10'
          )}
          onClick={handleAssigneeToggle}
        >
          {filters.assignee_id === user?.id && (
            <CheckIcon className='h-4 w-4' />
          )}
          <UserIcon className='h-4 w-4' />
          <span>My tickets</span>
        </Button>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className={cn(
                'border-dashed',
                activeFilterCount > 0 && 'border-primary'
              )}
            >
              <FilterIcon className='mr-2 h-4 w-4' />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant='secondary'
                  className='ml-2 rounded-sm px-1 font-normal'
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-[340px] p-4' align='start'>
            <div className='space-y-4'>
              {/* Status filters */}
              <div className='space-y-2'>
                <h4 className='text-sm font-medium'>Status</h4>
                <div className='flex flex-wrap gap-2'>
                  {OPEN_STATUS_OPTIONS.map((status) => (
                    <Button
                      key={status.value}
                      variant='outline'
                      className={cn(
                        'justify-start',
                        localFilters.status?.includes(status.value) &&
                          'border-primary bg-primary/10'
                      )}
                      onClick={() => handleStatusToggle(status.value)}
                    >
                      {localFilters.status?.includes(status.value) && (
                        <CheckIcon className='mr-2 h-4 w-4' />
                      )}
                      {status.label}
                    </Button>
                  ))}
                </div>
                <div className='flex items-center space-x-2 pt-2'>
                  <Switch
                    checked={localFilters.includeClosed || false}
                    onCheckedChange={handleShowClosedToggle}
                  />
                  <span className='text-sm text-muted-foreground'>
                    Show closed tickets
                  </span>
                </div>
              </div>

              <Separator />

              {/* Priority filters */}
              <div className='space-y-2'>
                <h4 className='text-sm font-medium'>Priority</h4>
                <div className='flex flex-wrap gap-2'>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <Button
                      key={priority.value}
                      variant='outline'
                      className={cn(
                        'justify-start',
                        localFilters.priority?.includes(priority.value) &&
                          'border-primary bg-primary/10'
                      )}
                      onClick={() => handlePriorityToggle(priority.value)}
                    >
                      {localFilters.priority?.includes(priority.value) && (
                        <CheckIcon className='mr-2 h-4 w-4' />
                      )}
                      {priority.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className='flex items-center justify-between pt-4'>
                <Button
                  variant='ghost'
                  onClick={handleReset}
                  className='text-muted-foreground'
                >
                  Reset filters
                </Button>
                <Button onClick={handleApply}>Apply filters</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {(activeFilterCount > 0 || filters.assignee_id) && (
          <Button
            variant='ghost'
            size='sm'
            className='h-8 px-2 text-muted-foreground hover:text-foreground'
            onClick={handleReset}
          >
            <XCircle className='h-4 w-4' />
          </Button>
        )}
      </div>
    </div>
  );
}
