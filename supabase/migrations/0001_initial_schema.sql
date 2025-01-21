-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "citext";

-- Create enum types
create type user_role as enum ('admin', 'agent', 'customer');
create type ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');

-- Organizations table
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  name text not null,
  domain text,
  settings jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb
);

-- Teams table
create table teams (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  name text not null,
  description text,
  organization_id uuid references organizations(id),
  settings jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb
);

-- Users table
create table users (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  email citext not null unique,
  full_name text not null,
  role user_role not null default 'customer',
  organization_id uuid references organizations(id),
  team_id uuid references teams(id),
  avatar_url text,
  settings jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb
);

-- Tickets table
create table tickets (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  title text not null,
  description text not null,
  status ticket_status not null default 'open',
  priority ticket_priority not null default 'medium',
  customer_id uuid not null references users(id),
  assigned_to uuid references users(id),
  team_id uuid references teams(id),
  organization_id uuid references organizations(id),
  parent_ticket_id uuid references tickets(id),
  due_date timestamp with time zone,
  tags text[] default array[]::text[],
  settings jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb
);

-- Ticket history table
create table ticket_history (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  ticket_id uuid not null references tickets(id),
  user_id uuid not null references users(id),
  change_type text not null,
  previous_values jsonb,
  new_values jsonb,
  metadata jsonb default '{}'::jsonb
);

-- Create index for ticket history
create index idx_ticket_history_ticket_id on ticket_history(ticket_id);
create index idx_ticket_history_user_id on ticket_history(user_id);

-- Conversations table
create table conversations (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  ticket_id uuid not null references tickets(id),
  user_id uuid not null references users(id),
  message text not null,
  is_internal boolean not null default false,
  parent_id uuid references conversations(id),
  attachments jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb
);

-- Articles table
create table articles (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  title text not null,
  content text not null,
  author_id uuid not null references users(id),
  status text not null default 'draft',
  published_at timestamp with time zone,
  tags text[] default array[]::text[],
  metadata jsonb default '{}'::jsonb
);

-- Categories table
create table categories (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  name text not null,
  description text,
  parent_id uuid references categories(id),
  metadata jsonb default '{}'::jsonb
);

-- Article categories junction table
create table article_categories (
  article_id uuid not null references articles(id),
  category_id uuid not null references categories(id),
  primary key (article_id, category_id)
);

-- Team members junction table
create table team_members (
  team_id uuid not null references teams(id),
  user_id uuid not null references users(id),
  role text not null default 'member',
  created_at timestamp with time zone default now(),
  primary key (team_id, user_id)
);

-- Metrics table
create table metrics (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  name text not null,
  value numeric not null,
  dimension text not null,
  timestamp timestamp with time zone not null,
  metadata jsonb default '{}'::jsonb
);

-- Create indexes
create index idx_tickets_customer_id on tickets(customer_id);
create index idx_tickets_assigned_to on tickets(assigned_to);
create index idx_tickets_team_id on tickets(team_id);
create index idx_conversations_ticket_id on conversations(ticket_id);
create index idx_users_organization_id on users(organization_id);
create index idx_users_team_id on users(team_id);
create index idx_articles_author_id on articles(author_id);

-- Create updated_at triggers
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_organizations_updated_at
  before update on organizations
  for each row
  execute function update_updated_at();

create trigger update_teams_updated_at
  before update on teams
  for each row
  execute function update_updated_at();

create trigger update_users_updated_at
  before update on users
  for each row
  execute function update_updated_at();

create trigger update_tickets_updated_at
  before update on tickets
  for each row
  execute function update_updated_at();

create trigger update_conversations_updated_at
  before update on conversations
  for each row
  execute function update_updated_at();

create trigger update_articles_updated_at
  before update on articles
  for each row
  execute function update_updated_at();

create trigger update_categories_updated_at
  before update on categories
  for each row
  execute function update_updated_at(); 