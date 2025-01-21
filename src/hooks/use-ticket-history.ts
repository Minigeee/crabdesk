import { TicketHistoryService } from '@/lib/services/client/ticket-history.service';
import { useInfiniteQuery } from '@tanstack/react-query';

export function useTicketHistory(ticketId: string, changeType: string = 'all') {
  const pageSize = 20;
  const historyService = TicketHistoryService.getInstance();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['ticketHistory', ticketId, changeType],
      queryFn: async ({ pageParam = 1 }) => {
        return historyService.getHistory(
          ticketId,
          pageParam,
          pageSize,
          changeType,
        );
      },
      getNextPageParam: (lastPage, allPages) => {
        const nextPage = allPages.length + 1;
        return lastPage.count > allPages.length * pageSize
          ? nextPage
          : undefined;
      },
      initialPageParam: 1,
    });

  const history = data?.pages.flatMap((page) => page.data) ?? [];
  const hasMore = !!hasNextPage;

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return {
    history,
    isLoading,
    hasMore,
    loadMore,
    isFetchingMore: isFetchingNextPage,
  };
}
