'use client';

import { CreateTicketDialog } from '@/components/tickets/create-ticket-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { Suspense } from 'react';
import { TicketBulkActions } from './_components/ticket-bulk-actions';
import { TicketFilters } from './_components/ticket-filters';
import { TicketPagination } from './_components/ticket-pagination';
import { TicketPreview } from './_components/ticket-preview';
import { TicketQueueProvider } from './_components/ticket-queue-provider';
import { TicketTable } from './_components/ticket-table';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TicketsPage() {
  return (
    <TicketQueueProvider>
      <div className='flex h-[calc(100vh-65px)]'>
        {/* Left Panel - Preview */}
        <div className='hidden w-[400px] border-r xl:block'>
          <Suspense fallback={<Skeleton className='h-full w-full' />}>
            <TicketPreview />
          </Suspense>
        </div>

        {/* Right Panel - Table */}
        <div className='flex-1'>
          <div className='flex h-full flex-col'>
            {/* Header */}
            <div className='flex items-center justify-between border-b p-4'>
              <h1 className='text-2xl font-bold tracking-tight'>Tickets</h1>
              <div className='flex items-center gap-2'>
                <TicketBulkActions />
                <CreateTicketDialog
                  trigger={
                    <Button>
                      <Plus className='mr-2 h-4 w-4' />
                      New Ticket
                    </Button>
                  }
                />
              </div>
            </div>

            {/* Filters */}
            <div className='border-b p-4'>
              <Suspense fallback={<Skeleton className='h-10 w-full' />}>
                <TicketFilters />
              </Suspense>
            </div>

            {/* Table with Scroll */}
            <ScrollArea className='flex-1'>
              <Suspense fallback={<Skeleton className='h-full w-full' />}>
                <TicketTable />
              </Suspense>
            </ScrollArea>

            {/* Footer */}
            <div className='border-t p-4'>
              <Suspense fallback={<Skeleton className='h-10 w-full' />}>
                <TicketPagination />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </TicketQueueProvider>
  );
}
