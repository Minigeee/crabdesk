import { useOrganization } from '@/components/providers/organization-provider';
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import assert from 'assert';
import { useCallback, useEffect, useMemo } from 'react';
import { createClient } from '../supabase/client';
import {
  TicketService,
  type Ticket,
  type TicketInsert,
  type TicketQueryOptions,
  type TicketUpdate,
  type TicketWithRelations,
} from './ticket-service';

// Query keys
export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (options: TicketQueryOptions) =>
    [...ticketKeys.lists(), options] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
};

// Hook for managing ticket service instance
function useTicketService() {
  const { organization } = useOrganization();
  const service = useMemo(() => {
    const supabase = createClient();
    if (!organization) return null;
    return new TicketService(supabase, organization.id);
  }, [organization]);
  return service;
}

// Hook for fetching tickets list
export function useTickets(
  options?: TicketQueryOptions,
  queryOptions?: UseQueryOptions<{
    data: (Ticket | TicketWithRelations)[];
    count: number;
  }>
) {
  const ticketService = useTicketService();
  const queryClient = useQueryClient();

  // Setup real-time subscription
  useEffect(() => {
    if (!ticketService) return;
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      unsubscribe = await ticketService.subscribeToOrgTickets(async () => {
        // Invalidate queries when tickets change
        await queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      });
    };

    void setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [ticketService, queryClient]);

  return useQuery({
    queryKey: ticketKeys.list(options || {}),
    queryFn: () => {
      assert(ticketService, 'Ticket service is not initialized');
      return ticketService.getTickets(options);
    },
    ...queryOptions,
    enabled: !!ticketService && queryOptions?.enabled,
  });
}

// Hook for fetching single ticket
export function useTicket<Rels extends boolean = false>(
  id: string,
  includeRelations: Rels,
  queryOptions?: UseQueryOptions<Rels extends true ? TicketWithRelations : Ticket>
) {
  const ticketService = useTicketService();
  const queryClient = useQueryClient();

  // Setup real-time subscription for single ticket
  useEffect(() => {
    if (!ticketService) return;

    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      unsubscribe = await ticketService.subscribeToTicket(
        id,
        async (payload) => {
          // Invalidate the specific ticket query
          await queryClient.invalidateQueries({
            queryKey: ticketKeys.detail(id),
          });
        }
      );
    };

    void setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [id, ticketService, queryClient]);

  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => {
      assert(ticketService, 'Ticket service is not initialized');
      return ticketService.getTicketById(id, includeRelations);
    },
    ...queryOptions,
    enabled: !!ticketService && queryOptions?.enabled,
  });
}

// Hook for creating tickets
export function useCreateTicket() {
  const ticketService = useTicketService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newTicket: TicketInsert) => {
      assert(ticketService, 'Ticket service is not initialized');
      return ticketService.createTicket(newTicket);
    },
    onSuccess: () => {
      // Invalidate all ticket lists
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

// Hook for updating tickets
export function useUpdateTicket() {
  const ticketService = useTicketService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TicketUpdate }) => {
      assert(ticketService, 'Ticket service is not initialized');
      return ticketService.updateTicket(id, data);
    },
    onSuccess: (updatedTicket) => {
      // Update queries with new data
      queryClient.setQueryData(
        ticketKeys.detail(updatedTicket.id),
        updatedTicket
      );
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

// Hook for deleting tickets
export function useDeleteTicket() {
  const ticketService = useTicketService();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      assert(ticketService, 'Ticket service is not initialized');
      return ticketService.deleteTicket(id);
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: ticketKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

// Hook for ticket actions with optimistic updates
export function useTicketActions(id?: string) {
  const updateTicket = useUpdateTicket();
  const queryClient = useQueryClient();

  const optimisticUpdate = useCallback(
    (update: TicketUpdate, targetId: string) => {
      // Get current ticket data
      const currentData = queryClient.getQueryData<Ticket>(
        ticketKeys.detail(targetId)
      );
      if (!currentData) return;

      // Optimistically update the cache
      queryClient.setQueryData(ticketKeys.detail(targetId), {
        ...currentData,
        ...update,
      });

      // Perform the actual update
      return updateTicket.mutateAsync({ id: targetId, data: update });
    },
    [updateTicket, queryClient]
  );

  const bulkUpdate = useCallback(
    async (update: TicketUpdate, ids: string[]) => {
      return Promise.all(
        ids.map((targetId) => optimisticUpdate(update, targetId))
      );
    },
    [optimisticUpdate]
  );

  // If no ID is provided, only return bulk operations
  if (!id) {
    return {
      updateStatus: (status: Ticket['status'], ids: string[]) =>
        bulkUpdate({ status }, ids),
      updatePriority: (priority: Ticket['priority'], ids: string[]) =>
        bulkUpdate({ priority }, ids),
      updateAssignee: (assignee_id: string | null, ids: string[]) =>
        bulkUpdate({ assignee_id }, ids),
      updateTeam: (team_id: string | null, ids: string[]) =>
        bulkUpdate({ team_id }, ids),
    };
  }

  // If ID is provided, return single ticket operations
  return {
    updateStatus: (status: Ticket['status']) =>
      optimisticUpdate({ status }, id),
    updatePriority: (priority: Ticket['priority']) =>
      optimisticUpdate({ priority }, id),
    updateAssignee: (assignee_id: string | null) =>
      optimisticUpdate({ assignee_id }, id),
    updateTeam: (team_id: string | null) => optimisticUpdate({ team_id }, id),
  };
}
