import type { Database, Tables } from '@/lib/database.types';
import { EmbeddingService } from '@/lib/embeddings/service';
import { SupabaseClient } from '@supabase/supabase-js';
import { chunkMarkdown } from './markdown-chunker';

export type Article = Tables<'articles'>;
export type ArticleChunk = Tables<'article_chunks'>;
export type ArticleInsert = Omit<
  Article,
  'id' | 'created_at' | 'updated_at' | 'version'
>;
export type ArticleUpdate = Partial<
  Omit<Article, 'id' | 'created_at' | 'updated_at' | 'version'>
>;

export class ArticleService {
  private embeddingService: EmbeddingService;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly orgId: string
  ) {
    this.embeddingService = new EmbeddingService(supabase, orgId);
  }

  async getArticles() {
    const { data, error } = await this.supabase
      .from('articles')
      .select('*')
      .eq('org_id', this.orgId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getArticle(id: string) {
    const { data, error } = await this.supabase
      .from('articles')
      .select('*')
      .eq('org_id', this.orgId)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  private async createChunks(
    articleId: string,
    articleTitle: string,
    content: string
  ) {
    // Generate chunks
    const chunks = chunkMarkdown(content);

    // Generate embeddings for all chunks in parallel
    const embeddings = await Promise.all(
      chunks.map((chunk) =>
        this.embeddingService.generateEmbedding(
          `# ${articleTitle}\n\n${chunk.content}`
        )
      )
    );

    // Insert all chunks
    const { error } = await this.supabase.from('article_chunks').insert(
      chunks.map((chunk, index) => ({
        article_id: articleId,
        content: chunk.content,
        chunk_index: index,
        metadata: chunk.metadata,
        embedding: this.embeddingService.embedToString(embeddings[index]),
      }))
    );

    if (error) throw error;
  }

  private async deleteChunks(articleId: string) {
    const { error } = await this.supabase
      .from('article_chunks')
      .delete()
      .eq('article_id', articleId);

    if (error) throw error;
  }

  async createArticle(article: ArticleInsert) {
    // First create the article
    const { data, error } = await this.supabase
      .from('articles')
      .insert({
        ...article,
        org_id: this.orgId,
        version: 1,
      })
      .select()
      .single();

    if (error) throw error;

    // Then create chunks
    await this.createChunks(data.id, article.title, article.content);

    return data;
  }

  async updateArticle(id: string, updates: ArticleUpdate) {
    // First increment the version
    const { data: version } = await this.supabase.rpc(
      'increment_article_version',
      { article_id: id }
    );

    // Then update the article
    const { data, error } = await this.supabase
      .from('articles')
      .update({
        ...updates,
        version: version ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', this.orgId)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If content was updated, recreate chunks
    if (updates.content) {
      await this.deleteChunks(id);
      await this.createChunks(id, data.title, updates.content);
    }

    return data;
  }

  async deleteArticle(id: string) {
    // The chunks will be automatically deleted due to ON DELETE CASCADE
    const { error } = await this.supabase
      .from('articles')
      .delete()
      .eq('org_id', this.orgId)
      .eq('id', id);

    if (error) throw error;
  }

  // Search articles using embeddings
  async searchArticles(query: string, limit = 5) {
    const embedding = await this.embeddingService.generateEmbedding(query);

    const { data, error } = await this.supabase.rpc('search_article_chunks', {
      query_embedding: this.embeddingService.embedToString(embedding),
      match_threshold: 0.7,
      match_count: limit,
      p_org_id: this.orgId,
    });

    if (error) throw error;
    return data;
  }
}
