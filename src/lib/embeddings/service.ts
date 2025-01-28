import type { Database } from '@/lib/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class EmbeddingService {
  constructor(
    private supabase: SupabaseClient<Database>,
    private orgId: string
  ) {}

  /**
   * Generate embeddings for a text using OpenAI's text-embedding-3-small model
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  }

  /**
   * Convert number[] embedding to pgvector string format
   */
  embedToString(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  /**
   * Update or create embeddings for email messages
   */
  async updateEmailMessageEmbeddings(messageId: string) {
    const { data: message } = await this.supabase
      .from('email_messages')
      .select('text_body, html_body')
      .eq('id', messageId)
      .single();

    if (!message) return;

    const content = message.text_body || message.html_body;
    if (!content) return;

    const embedding = await this.generateEmbedding(content);

    await this.supabase
      .from('email_messages')
      .update({ content_embedding: this.embedToString(embedding) })
      .eq('id', messageId);
  }

  /**
   * Update or create embeddings for notes
   */
  async updateNoteEmbeddings(noteId: string) {
    const { data: note } = await this.supabase
      .from('notes')
      .select('content')
      .eq('id', noteId)
      .single();

    if (!note?.content) return;

    const embedding = await this.generateEmbedding(note.content);

    await this.supabase
      .from('notes')
      .update({ content_embedding: this.embedToString(embedding) })
      .eq('id', noteId);
  }

  /**
   * Search email messages by semantic similarity
   */
  async searchEmailMessages(
    query: string,
    options: {
      threshold?: number;
      limit?: number;
    } = {}
  ) {
    const { threshold = 0.7, limit = 10 } = options;
    const embedding = await this.generateEmbedding(query);

    const { data } = await this.supabase.rpc('search_email_messages', {
      query_embedding: this.embedToString(embedding),
      match_threshold: threshold,
      match_count: limit,
      p_org_id: this.orgId,
    });

    return data;
  }

  /**
   * Search notes by semantic similarity
   */
  async searchNotes(
    query: string,
    options: {
      threshold?: number;
      limit?: number;
    } = {}
  ) {
    const { threshold = 0.7, limit = 10 } = options;
    const embedding = await this.generateEmbedding(query);

    const { data } = await this.supabase.rpc('search_notes', {
      query_embedding: this.embedToString(embedding),
      match_threshold: threshold,
      match_count: limit,
      p_org_id: this.orgId,
    });

    return data;
  }
}
