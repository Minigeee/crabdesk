import { Suspense } from 'react'
import { TicketList } from './components/ticket-list'
import { TicketFilters } from './components/ticket-filters'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { listTickets } from './actions'
import { type TicketFilters as TicketFiltersType, type SortableTicketField } from '@/lib/types/ticket'

interface PageProps {
  searchParams: {
    page?: string
    search?: string
    status?: string | string[]
    priority?: string | string[]
    sort?: string
    direction?: 'asc' | 'desc'
  }
}

export const dynamic = 'force-dynamic'

export default async function TicketsPage({ searchParams }: PageProps) {
  // Parse search params
  const page = Number(searchParams.page) || 1
  const sort = searchParams.sort as SortableTicketField | undefined
  const direction = searchParams.direction as 'asc' | 'desc' | undefined
  
  // Convert search params to filters
  const filters: TicketFiltersType = {
    search: searchParams.search,
    status: Array.isArray(searchParams.status) 
      ? searchParams.status as TicketFiltersType['status']
      : searchParams.status 
        ? [searchParams.status] as TicketFiltersType['status']
        : undefined,
    priority: Array.isArray(searchParams.priority)
      ? searchParams.priority as TicketFiltersType['priority']
      : searchParams.priority
        ? [searchParams.priority] as TicketFiltersType['priority']
        : undefined,
  }

  // Fetch tickets
  const result = await listTickets(
    page,
    10,
    filters,
    sort && direction ? { field: sort, direction } : undefined
  )

  if (result.error || !result.data) {
    throw new Error(result.error || 'Failed to fetch tickets')
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex h-14 items-center px-4">
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold">Tickets</h1>
            <Button asChild>
              <Link href="/tickets/new">
                <Plus className="mr-2 h-4 w-4" />
                New Ticket
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 space-y-4 p-8 pt-6">
        <TicketFilters />
        <Suspense fallback={<div>Loading tickets...</div>}>
          <TicketList 
            tickets={result.data.data}
            totalCount={result.data.count}
            currentPage={page}
          />
        </Suspense>
      </div>
    </div>
  )
} 