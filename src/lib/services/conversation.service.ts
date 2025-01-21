import { createClient } from '@/lib/supabase/server';
import { type SupabaseClient, type RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { type Database } from '@/lib/supabase/database.types';
import { 
  type NewConversation, 
  type ConversationUpdate, 
  type ConversationWithUser,
  type ThreadedConversation,
  type Conversation 
} from '@/lib/types/conversation';

export class ConversationService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase?: SupabaseClient<Database>) {
    if (supabase) {
      this.supabase = supabase;
    } else {
      throw new Error('Supabase client must be provided');
    }
  }

  static async create(): Promise<ConversationService> {
    const supabase = await createClient();
    return new ConversationService(supabase);
  }

  async create(conversation: NewConversation): Promise<ConversationWithUser | null> {
    const { data, error } = await this.supabase
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

  async update(id: string, updates: ConversationUpdate): Promise<ConversationWithUser | null> {
    const { data, error } = await this.supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
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

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private async fetchReplies(parentId: string): Promise<ThreadedConversation[]> {
    const { data, error } = await this.supabase
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
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Recursively fetch replies for each message
    const threaded = await Promise.all(
      (data || []).map(async (reply) => ({
        ...reply,
        replies: await this.fetchReplies(reply.id)
      }))
    );

    return threaded;
  }

  async getTicketConversations(ticketId: string): Promise<ThreadedConversation[]> {
    // Get root level conversations (no parent_id)
    const { data, error } = await this.supabase
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
      .eq('ticket_id', ticketId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // For each root conversation, fetch its threaded replies
    const threaded = await Promise.all(
      (data || []).map(async (conversation) => ({
        ...conversation,
        replies: await this.fetchReplies(conversation.id)
      }))
    );

    return threaded;
  }

  async getById(id: string): Promise<ThreadedConversation | null> {
    const { data, error } = await this.supabase
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
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Fetch replies for this conversation
    const replies = await this.fetchReplies(data.id);
    return { ...data, replies };
  }

  async subscribeToTicketConversations(
    ticketId: string, 
    callback: (payload: ThreadedConversation) => void
  ) {
    return this.supabase
      .channel(`ticket-${ticketId}-conversations`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `ticket_id=eq.${ticketId}`
        },
        async (payload: RealtimePostgresChangesPayload<Conversation>) => {
          if (payload.new && 'id' in payload.new) {
            // When a new message comes in, fetch its complete data with user details
            const conversation = await this.getById(payload.new.id);
            if (conversation) {
              callback(conversation);
            }
          }
        }
      )
      .subscribe();
  }
} 