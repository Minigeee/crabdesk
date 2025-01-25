'use client';

import type { Enums, Tables } from '@/lib/database.types';
import { useTickets } from '@/lib/tickets/use-tickets';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type TicketFilters = {
  status?: Enums<'ticket_status'>[];
  priority?: Enums<'ticket_priority'>[];
  assignee_id?: string;
  team_id?: string;
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
};

type TicketSort = {
  column: keyof Tables<'tickets'>;
  ascending: boolean;
};

type TicketQueueContextType = {
  // State
  selectedTickets: string[];
  previewTicketId: string | null;
  filters: TicketFilters;
  sort: TicketSort;
  page: number;
  pageSize: number;

  // Ticket data
  tickets: Tables<'tickets'>[];
  totalCount: number;
  isLoading: boolean;

  // Actions
  setSelectedTickets: Dispatch<SetStateAction<string[]>>;
  setPreviewTicketId: Dispatch<SetStateAction<string | null>>;
  setFilters: (filters: TicketFilters) => void;
  setSort: (sort: TicketSort) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
};

const TicketQueueContext = createContext<TicketQueueContextType | null>(null);

export function TicketQueueProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [previewTicketId, setPreviewTicketId] = useState<string | null>(null);

  // URL synced state
  const page = Number(searchParams.get('page')) || 1;
  const pageSize = Number(searchParams.get('size')) || 25;
  const status = searchParams.getAll('status') as Enums<'ticket_status'>[];
  const priority = searchParams.getAll(
    'priority'
  ) as Enums<'ticket_priority'>[];
  const assignee = searchParams.get('assignee') || undefined;
  const team = searchParams.get('team') || undefined;
  const search = searchParams.get('search') || undefined;
  const sortColumn =
    (searchParams.get('sort') as keyof Tables<'tickets'>) || 'created_at';
  const sortAsc = searchParams.get('asc') === 'true';

  // Construct filters object
  const filters: TicketFilters = useMemo(
    () => ({
      status: status.length > 0 ? status : undefined,
      priority: priority.length > 0 ? priority : undefined,
      assignee_id: assignee,
      team_id: team,
      search,
    }),
    [status, priority, assignee, team, search]
  );

  // Fetch tickets with current filters
  const { data, isLoading } = useTickets({
    filters,
    orderBy: [{ column: sortColumn, ascending: sortAsc }],
    page: page - 1,
    limit: pageSize,
  });
  const { data: tickets = [], count: totalCount = 0 } = data ?? {};

  // URL sync helpers
  const updateSearchParams = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        params.delete(key);
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else if (value !== null) {
          params.set(key, value);
        }
      });

      // If page is 1, remove it from the URL
      if (params.get('page') === '1') {
        params.delete('page');
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  // Action handlers
  const setFilters = useCallback(
    (newFilters: TicketFilters) => {
      updateSearchParams({
        search: newFilters.search || null,
        status: newFilters.status || null,
        priority: newFilters.priority || null,
        assignee: newFilters.assignee_id || null,
        team: newFilters.team_id || null,
        page: '1', // Reset to first page on filter change
      });
    },
    [updateSearchParams]
  );

  const setSort = useCallback(
    (sort: TicketSort) => {
      updateSearchParams({
        sort: sort.column,
        asc: sort.ascending.toString(),
      });
    },
    [updateSearchParams]
  );

  const setPage = useCallback(
    (newPage: number) => {
      updateSearchParams({
        page: newPage.toString(),
      });
    },
    [updateSearchParams]
  );

  const setPageSize = useCallback(
    (newSize: number) => {
      updateSearchParams({
        size: newSize.toString(),
        page: '1', // Reset to first page on size change
      });
    },
    [updateSearchParams]
  );

  const value = {
    // State
    selectedTickets,
    previewTicketId,
    filters,
    sort: { column: sortColumn, ascending: sortAsc },
    page,
    pageSize,

    // Ticket data
    tickets,
    totalCount,
    isLoading,

    // Actions
    setSelectedTickets,
    setPreviewTicketId,
    setFilters,
    setSort,
    setPage,
    setPageSize,
  };

  return (
    <TicketQueueContext.Provider value={value}>
      {children}
    </TicketQueueContext.Provider>
  );
}

export function useTicketQueue() {
  const context = useContext(TicketQueueContext);
  if (!context) {
    throw new Error('useTicketQueue must be used within a TicketQueueProvider');
  }
  return context;
}
