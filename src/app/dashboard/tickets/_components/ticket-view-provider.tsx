'use client';

import { createContext, useContext, useState } from 'react';
import type { Tables } from '@/lib/database.types';

interface ReplyContext {
  threadId: string;
  inReplyTo: string;
  originalMessage: Tables<'email_messages'>;
}

interface TicketViewState {
  emailReplyText: string;
  setEmailReplyText: (text: string) => void;
  isEmailReplyOpen: boolean;
  setIsEmailReplyOpen: (open: boolean) => void;
  replyContext: ReplyContext | null;
  setReplyContext: (context: ReplyContext | null) => void;
}

const TicketViewContext = createContext<TicketViewState | null>(null);

export function useTicketView() {
  const context = useContext(TicketViewContext);
  if (!context) {
    throw new Error('useTicketView must be used within a TicketViewProvider');
  }
  return context;
}

export function TicketViewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [emailReplyText, setEmailReplyText] = useState('');
  const [isEmailReplyOpen, setIsEmailReplyOpen] = useState(false);
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null);

  return (
    <TicketViewContext.Provider
      value={{
        emailReplyText,
        setEmailReplyText,
        isEmailReplyOpen,
        setIsEmailReplyOpen,
        replyContext,
        setReplyContext,
      }}
    >
      {children}
    </TicketViewContext.Provider>
  );
}
