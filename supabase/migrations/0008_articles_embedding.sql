-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create article_chunks table
CREATE TABLE article_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  content text NOT NULL,
  chunk_index int NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(article_id, chunk_index)
);

-- Create indexes
CREATE INDEX article_chunks_article_idx ON article_chunks(article_id);
CREATE INDEX article_chunks_embedding_idx ON article_chunks USING ivfflat (embedding vector_cosine_ops);

-- Create function to search article chunks
CREATE OR REPLACE FUNCTION search_article_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_org_id uuid
)
RETURNS TABLE (
  chunk_id uuid,
  article_id uuid,
  article_title varchar(255),
  chunk_content text,
  chunk_index int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ac.id as chunk_id,
    ac.article_id,
    a.title as article_title,
    ac.content as chunk_content,
    ac.chunk_index,
    1 - (ac.embedding <=> query_embedding) as similarity
  FROM article_chunks ac
  JOIN articles a ON a.id = ac.article_id
  WHERE 
    a.org_id = p_org_id
    AND a.status = 'published'
    AND 1 - (ac.embedding <=> query_embedding) > match_threshold
  ORDER BY ac.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function to increment version numbers
CREATE OR REPLACE FUNCTION increment_article_version(article_id uuid)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  new_version int;
BEGIN
  UPDATE articles
  SET version = version + 1
  WHERE id = article_id
  RETURNING version INTO new_version;
  
  RETURN new_version;
END;
$$; 