import type { TablesInsert } from '@/lib/database.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import assert from 'assert';
import { useEffect, useMemo } from 'react';
import { MessageService, MessageWithSender } from './message-service';

// Query keys
export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (ticketId: string) => [...messageKeys.lists(), { ticketId }] as const,
};

export function useMessages(ticketId: string) {
  const queryClient = useQueryClient();

  // Create memoized service instance
  const messageService = useMemo(() => {
    return new MessageService();
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    if (!messageService) return;

    const subscription = messageService.subscribeToMessages(
      ticketId,
      async (message) => {
        // When we get a new message via subscription, we need to fetch its sender data
        const updatedMessages = await messageService.getMessages(ticketId);
        // Update the messages list in the cache with full sender data
        queryClient.setQueryData(messageKeys.list(ticketId), updatedMessages);
      }
    );

    return () => {
      subscription.then((sub) => sub.unsubscribe());
    };
  }, [ticketId, messageService, queryClient]);

  // Query for messages
  const query = useQuery<MessageWithSender[]>({
    queryKey: messageKeys.list(ticketId),
    queryFn: async () => {
      assert(messageService, 'Message service is not initialized');
      return messageService.getMessages(ticketId);
    },
    enabled: !!messageService,
  });

  // Mutation for adding messages
  const mutation = useMutation({
    mutationFn: async (message: TablesInsert<'messages'>) => {
      assert(messageService, 'Message service is not initialized');
      return messageService.addMessage(message);
    },
    onSuccess: async () => {
      // Refetch to get the updated list with sender data
      await queryClient.invalidateQueries({
        queryKey: messageKeys.list(ticketId),
      });
    },
  });

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ?? mutation.error,
    addMessage: mutation.mutate,
    addMessageAsync: mutation.mutateAsync,
    refetch: query.refetch,
  };
}
