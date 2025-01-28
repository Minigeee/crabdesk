-- Enable the pgvector extension
create extension if not exists vector;

-- Add vector column to email_messages
alter table email_messages 
add column if not exists content_embedding vector(1536);

-- Add vector column to notes
alter table notes 
add column if not exists content_embedding vector(1536);

-- Create a function to search email messages by similarity
create or replace function search_email_messages(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_org_id uuid
)
returns table (
  id uuid,
  thread_id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    em.id,
    em.thread_id,
    coalesce(em.text_body, em.html_body) as content,
    1 - (em.content_embedding <=> query_embedding) as similarity
  from email_messages em
  join email_threads et on et.id = em.thread_id
  where et.org_id = p_org_id
    and 1 - (em.content_embedding <=> query_embedding) > match_threshold
  order by em.content_embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create a function to search notes by similarity
create or replace function search_notes(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_org_id uuid
)
returns table (
  id uuid,
  entity_type varchar(50),
  entity_id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    n.id,
    n.entity_type,
    n.entity_id,
    n.content,
    1 - (n.content_embedding <=> query_embedding) as similarity
  from notes n
  where n.org_id = p_org_id
    and 1 - (n.content_embedding <=> query_embedding) > match_threshold
  order by n.content_embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create GiST index for faster similarity searches
create index on email_messages using ivfflat (content_embedding vector_cosine_ops)
  with (lists = 100);

create index on notes using ivfflat (content_embedding vector_cosine_ops)
  with (lists = 100);