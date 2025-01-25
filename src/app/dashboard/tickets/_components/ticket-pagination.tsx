'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react';
import { useTicketQueue } from './ticket-queue-provider';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function TicketPagination() {
  const { page, pageSize, totalCount, setPage, setPageSize } = useTicketQueue();

  const totalPages = Math.ceil(totalCount / pageSize);
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <div className='flex items-center justify-between px-2'>
      <div className='flex items-center space-x-6 text-sm'>
        <span className='text-muted-foreground'>
          {totalCount > 0
            ? `Showing ${startItem} to ${endItem} of ${totalCount} results`
            : 'No results'}
        </span>

        <div className='flex items-center space-x-2'>
          <span className='text-muted-foreground'>Rows per page</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='flex items-center space-x-2'>
        <Button
          variant='outline'
          size='icon'
          className='h-8 w-8'
          onClick={() => setPage(1)}
          disabled={!canGoPrevious}
        >
          <ChevronsLeftIcon className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          size='icon'
          className='h-8 w-8'
          onClick={() => setPage(page - 1)}
          disabled={!canGoPrevious}
        >
          <ChevronLeftIcon className='h-4 w-4' />
        </Button>

        <div className='flex items-center space-x-2'>
          <span className='text-sm'>
            Page {page} of {totalPages}
          </span>
        </div>

        <Button
          variant='outline'
          size='icon'
          className='h-8 w-8'
          onClick={() => setPage(page + 1)}
          disabled={!canGoNext}
        >
          <ChevronRightIcon className='h-4 w-4' />
        </Button>
        <Button
          variant='outline'
          size='icon'
          className='h-8 w-8'
          onClick={() => setPage(totalPages)}
          disabled={!canGoNext}
        >
          <ChevronsRightIcon className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
