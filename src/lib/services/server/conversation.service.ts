import { createClient } from '@/lib/supabase/server';
import { type SupabaseClient } from '@supabase/supabase-js';
import { type Database } from '@/lib/supabase/database.types';
import { type NewConversation, type ConversationWithUser, type ThreadedConversation } from '@/lib/types/conversation';

export class ServerConversationService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase?: SupabaseClient<Database>) {
    if (supabase) {
      this.supabase = supabase;
    } else {
      throw new Error('Supabase client must be provided');
    }
  }

  static async create(): Promise<ServerConversationService> {
    const supabase = await createClient();
    return new ServerConversationService(supabase);
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
} 