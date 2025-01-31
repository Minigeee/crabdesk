import type { Database } from '@/lib/database.types';
import { SupabaseClient } from '@supabase/supabase-js';
import { EmailThread } from '../email/types';
import { EmbeddingService } from '../embeddings/service';

/**
 * Retrieves an email thread with all its messages
 */
export async function getEmailThread(
  supabase: SupabaseClient<Database>,
  threadId: string
): Promise<EmailThread | null> {
  const { data: thread, error } = await supabase
    .from('email_threads')
    .select(
      `
      *,
      messages: email_messages (
        message_id,
        from_email,
        from_name,
        text_body,
        created_at
      )
    `
    )
    .eq('id', threadId)
    .order('created_at', { ascending: true })
    .single();

  if (error) throw error;
  return thread;
}

/**
 * Combines an array of text content into a single string for embedding
 */
export function combineTextForEmbedding(texts: string[]): string {
  return texts
    .filter(Boolean) // Remove empty strings
    .join('\n\n'); // Join with double newlines for clear separation
}

/**
 * Options for semantic search
 */
export interface SemanticSearchOptions {
  threshold?: number;
  limit?: number;
}

/**
 * Retrieves semantically similar notes using the embedding service
 */
export async function getSemanticallySimilarNotes(
  embeddings: EmbeddingService,
  searchTexts: string[],
  options: SemanticSearchOptions = {}
) {
  const combinedText = combineTextForEmbedding(searchTexts);
  if (!combinedText) {
    return []; // No valid text content to search with
  }

  return embeddings.searchNotes(combinedText, {
    threshold: options.threshold ?? 0.6,
    limit: options.limit ?? 5,
  });
}

/**
 * Retrieves semantically similar article chunks using the embedding service
 */
export async function getSemanticallySimilarArticleChunks(
  supabase: SupabaseClient<Database>,
  orgId: string,
  searchTexts: string[],
  options: SemanticSearchOptions = {}
) {
  const combinedText = combineTextForEmbedding(searchTexts);
  if (!combinedText) {
    return [];
  }

  // Generate embedding for the combined text
  const embeddings = new EmbeddingService(supabase, orgId);
  const embedding = await embeddings.generateEmbedding(combinedText);

  // Search for similar article chunks
  const { data, error } = await supabase.rpc('search_article_chunks', {
    query_embedding: embeddings.embedToString(embedding),
    match_threshold: options.threshold ?? 0.6,
    match_count: options.limit ?? 5,
    p_org_id: orgId,
  });
  // console.log('getSemanticallySimilarArticleChunks', data, options, orgId, embedding.length, error);

  if (error) throw error;
  return data || [];
}
