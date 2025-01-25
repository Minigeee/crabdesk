import type { Tables, TablesInsert } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';

type MessageSender = {
  id: string;
  name: string;
  avatar_url?: string | null;
  email?: string;
};

export type MessageWithSender = Tables<'messages'> & {
  sender: MessageSender;
};

export class MessageService {
  async getMessages(ticketId: string): Promise<MessageWithSender[]> {
    const supabase = await createClient();

    // First get all messages for the ticket
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!messages?.length) return [];

    // Group messages by sender type for efficient fetching
    const internalUserIds = messages
      .filter((m) => m.sender_type === 'internal_user')
      .map((m) => m.sender_id);
    const contactIds = messages
      .filter((m) => m.sender_type === 'contact')
      .map((m) => m.sender_id);

    // Fetch internal users and contacts in parallel if needed
    const [internalUsers, contacts] = await Promise.all([
      internalUserIds.length
        ? supabase
            .from('internal_users')
            .select('id, name, avatar_url')
            .in('id', internalUserIds)
            .then(({ data, error }) => {
              if (error) throw error;
              return data;
            })
        : Promise.resolve([]),
      contactIds.length
        ? supabase
            .from('contacts')
            .select('id, name, email')
            .in('id', contactIds)
            .then(({ data, error }) => {
              if (error) throw error;
              return data;
            })
        : Promise.resolve([]),
    ]);

    // Create lookup maps for efficient joining
    const internalUserMap = new Map(
      internalUsers.map((user) => [user.id, user])
    );
    const contactMap = new Map(
      contacts.map((contact) => [contact.id, contact])
    );

    // Join the data
    return messages.map((message): MessageWithSender => {
      let sender: MessageSender;

      switch (message.sender_type) {
        case 'internal_user': {
          const user = internalUserMap.get(message.sender_id);
          if (!user) {
            throw new Error(`Internal user not found: ${message.sender_id}`);
          }
          sender = {
            id: user.id,
            name: user.name || 'Unknown User',
            avatar_url: user.avatar_url,
          };
          break;
        }
        case 'contact': {
          const contact = contactMap.get(message.sender_id);
          if (!contact) {
            throw new Error(`Contact not found: ${message.sender_id}`);
          }
          sender = {
            id: contact.id,
            name: contact.name || 'Unknown Contact',
            email: contact.email,
          };
          break;
        }
        case 'system':
          sender = {
            id: 'system',
            name: 'System',
          };
          break;
        default:
          throw new Error(`Unknown sender type: ${message.sender_type}`);
      }

      return {
        ...message,
        sender,
      };
    });
  }

  async addMessage(message: TablesInsert<'messages'>) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('messages')
      .insert([message])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async subscribeToMessages(
    ticketId: string,
    callback: (message: Tables<'messages'>) => void
  ) {
    const supabase = await createClient();

    return supabase
      .channel(`messages:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          callback(payload.new as Tables<'messages'>);
        }
      )
      .subscribe();
  }
}
