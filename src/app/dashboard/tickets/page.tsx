import { Suspense } from 'react'
import { TicketQueueProvider } from './_components/ticket-queue-provider'
import { TicketFilters } from './_components/ticket-filters'
import { TicketTable } from './_components/ticket-table'
import { TicketPreview } from './_components/ticket-preview'
import { TicketBulkActions } from './_components/ticket-bulk-actions'
import { TicketPagination } from './_components/ticket-pagination'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function TicketsPage() {
  return (
    <TicketQueueProvider>
      <div className="flex flex-col space-y-4 p-4 md:p-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-x-4 lg:space-y-0">
          <div className="hidden w-[400px] xl:block">
            <Card className="sticky top-4">
              <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
                <TicketPreview />
              </Suspense>
            </Card>
          </div>
          
          <div className="flex-1 space-y-4">
            <Card>
              <div className="border-b border-border p-4 flex justify-between">
                <Suspense fallback={<Skeleton className="h-10 w-full" />}>
                  <TicketFilters />
                </Suspense>
                <TicketBulkActions />
              </div>

              <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <TicketTable />
              </Suspense>

              <div className="border-t border-border p-4">
                <Suspense fallback={<Skeleton className="h-10 w-full" />}>
                  <TicketPagination />
                </Suspense>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </TicketQueueProvider>
  )
} 