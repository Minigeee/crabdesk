import { Database } from '@/lib/supabase/database.types';

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type NewConversation =
  Database['public']['Tables']['conversations']['Insert'];
export type ConversationUpdate =
  Database['public']['Tables']['conversations']['Update'];

export type ConversationWithUser = Conversation & {
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
};

export type ThreadedConversation = ConversationWithUser & {
  replies: ThreadedConversation[];
};

export type ConversationListResponse = {
  conversations: ThreadedConversation[];
  count: number;
};

// Type for file attachments
export type Attachment = {
  name: string;
  url: string;
  size: number;
  type: string;
  uploaded_at: string;
};
