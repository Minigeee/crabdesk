'use client';

import type { Tables } from '@/lib/database.types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useState } from 'react';
import { getEmailThreads } from '../actions';

type EmailThread = Tables<'email_threads'> & {
  messages: Tables<'email_messages'>[];
};

interface EmailTestingContext {
  tab: string;
  setTab: (tab: string) => void;
  selectedThread: EmailThread | null;
  setSelectedThread: (thread: EmailThread | null) => void;
  threads: EmailThread[];
  isLoading: boolean;
  error: Error | null;
  refreshThreads: () => Promise<void>;
}

const EmailTestingContext = createContext<EmailTestingContext | undefined>(
  undefined
);

async function fetchThreads(): Promise<EmailThread[]> {
  return getEmailThreads();
}

export function useEmailTesting() {
  const context = useContext(EmailTestingContext);
  if (!context) {
    throw new Error(
      'useEmailTesting must be used within an EmailTestingProvider'
    );
  }
  return context;
}

export function EmailTestingProvider({
  children,
  tab,
  setTab,
}: {
  children: React.ReactNode;
  tab: string;
  setTab: (tab: string) => void;
}) {
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(
    null
  );
  const queryClient = useQueryClient();

  const {
    data: threads = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['email-threads'],
    queryFn: fetchThreads,
    staleTime: 10 * 1000, // Consider data stale after 10 seconds
    refetchOnWindowFocus: true,
    retry: 3,
  });

  const refreshThreads = async () => {
    await queryClient.invalidateQueries({ queryKey: ['email-threads'] });
  };

  return (
    <EmailTestingContext.Provider
      value={{
        tab,
        setTab,
        selectedThread,
        setSelectedThread,
        threads,
        isLoading,
        error: error as Error | null,
        refreshThreads,
      }}
    >
      {children}
    </EmailTestingContext.Provider>
  );
}
