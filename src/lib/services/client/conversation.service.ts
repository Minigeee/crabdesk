import { createClient } from '@/lib/supabase/client';
import { type ThreadedConversation, type NewConversation } from '@/lib/types/conversation';

export class ClientConversationService {
  async create(conversation: NewConversation) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('conversations')
      .insert(conversation)
      .select(`
        *,
        user:users (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async subscribeToTicketConversations(
    ticketId: string,
    onNewMessage: (message: ThreadedConversation) => void,
    onUpdateMessage: (message: ThreadedConversation) => void,
    onDeleteMessage: (id: string) => void
  ) {
    const supabase = createClient();
    
    return supabase
      .channel(`ticket-${ticketId}-conversations`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `ticket_id=eq.${ticketId}`
        },
        async (payload) => {
          if (payload.new) {
            // Fetch the complete message with user details
            const { data } = await supabase
              .from('conversations')
              .select(`
                *,
                user:users (
                  id,
                  full_name,
                  email,
                  avatar_url
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              onNewMessage(data as ThreadedConversation);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `ticket_id=eq.${ticketId}`
        },
        async (payload) => {
          if (payload.new) {
            const { data } = await supabase
              .from('conversations')
              .select(`
                *,
                user:users (
                  id,
                  full_name,
                  email,
                  avatar_url
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              onUpdateMessage(data as ThreadedConversation);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'conversations',
          filter: `ticket_id=eq.${ticketId}`
        },
        (payload) => {
          if (payload.old) {
            onDeleteMessage(payload.old.id);
          }
        }
      )
      .subscribe();
  }
} 