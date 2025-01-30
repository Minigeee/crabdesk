'use client';

import { CreateTicketDialog } from '@/components/tickets/create-ticket-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ticketKeys } from '@/lib/tickets/use-tickets';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, RotateCw } from 'lucide-react';
import { Suspense } from 'react';
import { TicketBulkActions } from './_components/ticket-bulk-actions';
import { TicketFilters } from './_components/ticket-filters';
import { TicketPagination } from './_components/ticket-pagination';
import { TicketPreview } from './_components/ticket-preview';
import { TicketQueueProvider } from './_components/ticket-queue-provider';
import { TicketTable } from './_components/ticket-table';
import { ApprovalWorkflowNav } from '@/components/tickets/approval-workflow-nav';
import { approvalQueueKeys } from '@/lib/tickets/use-approval-queue';

function TicketsPageContent() {
  const queryClient = useQueryClient();

  const queryState = queryClient.getQueryState(ticketKeys.lists());
  const isFetching = queryState?.status === 'pending';

  const handleRefresh = () => {
    // Invalidate all ticket queries to force a refresh
    queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    // Invalidate all response draft queries
    queryClient.invalidateQueries({ queryKey: ['response_draft'] });
    // Invalidate approval queue
    queryClient.invalidateQueries({ queryKey: approvalQueueKeys.all });
  };

  return (
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
              <Button
                variant='outline'
                size='icon'
                onClick={handleRefresh}
                title='Refresh tickets'
                disabled={isFetching}
              >
                <RotateCw
                  className={cn('h-4 w-4', isFetching && 'animate-spin')}
                />
              </Button>
              <ApprovalWorkflowNav />
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
          <div className='flex items-center justify-between border-b p-4'>
            <Suspense fallback={<Skeleton className='h-10 w-full' />}>
              <TicketFilters />
            </Suspense>
            <TicketBulkActions />
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
  );
}

export default function TicketsPage() {
  return (
    <TicketQueueProvider>
      <TicketsPageContent />
    </TicketQueueProvider>
  );
}
