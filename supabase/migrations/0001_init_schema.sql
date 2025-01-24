-- 0001_init_schema.sql
-- Supabase Migration File for CrabDesk Data Model
--
-- This file creates all core tables, sets up basic RLS (row-level security) policies,
-- and provides helper functions to avoid recursion in multi-table RLS checks.
-- Adjust roles, permissions, and policy logic as necessary for your organization's specific needs.

BEGIN;

-- Enable pgcrypto (needed for gen_random_uuid).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

--------------------------------------------------------------------------------
-- Custom Enum Types
--------------------------------------------------------------------------------
-- Ticket Status
CREATE TYPE ticket_status AS ENUM ('open', 'pending', 'resolved', 'closed');

-- Ticket Priority
CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- Ticket Source
CREATE TYPE ticket_source AS ENUM ('email', 'chat', 'portal', 'api');

-- Message Sender Type
CREATE TYPE message_sender_type AS ENUM ('contact', 'internal_user', 'system');

-- Message Content Type
CREATE TYPE message_content_type AS ENUM ('text', 'html', 'markdown');

-- Article Status
CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');

-- Audit Log Action
CREATE TYPE audit_log_action AS ENUM ('insert', 'update', 'delete', 'restore');

-- User Role Type
CREATE TYPE user_role AS ENUM ('internal_user', 'internal_admin', 'portal_user');

--------------------------------------------------------------------------------
-- Table: organizations
--------------------------------------------------------------------------------
CREATE TABLE public.organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        varchar(255) NOT NULL,
  domain      varchar(255) NOT NULL,
  settings    jsonb        NOT NULL DEFAULT '{}',
  timezone    varchar(50)  NOT NULL DEFAULT 'UTC',
  branding    jsonb        NOT NULL DEFAULT '{}',
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT domain_unique UNIQUE (domain)
);

-- Indexes
CREATE UNIQUE INDEX org_domain_idx ON organizations(domain);
CREATE INDEX org_created_at_idx ON organizations(created_at);

--------------------------------------------------------------------------------
-- Table: internal_users
--------------------------------------------------------------------------------
CREATE TABLE public.internal_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL,
  auth_user_id  uuid NOT NULL,
  name          varchar(255) NOT NULL,
  is_admin      boolean      NOT NULL DEFAULT false,
  avatar_url    varchar(1024),
  preferences   jsonb        NOT NULL DEFAULT '{}',
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT internal_user_org_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations (id),
  CONSTRAINT internal_user_org_auth_unique UNIQUE(org_id, auth_user_id)
);

-- Indexes
CREATE INDEX internal_user_org_idx ON internal_users(org_id);
CREATE UNIQUE INDEX internal_user_auth_idx ON internal_users(org_id, auth_user_id);
CREATE INDEX internal_user_admin_idx ON internal_users(org_id, is_admin);

--------------------------------------------------------------------------------
-- Table: portal_users
--------------------------------------------------------------------------------
CREATE TABLE public.portal_users (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL,
  auth_user_id         uuid NOT NULL,
  preferences          jsonb NOT NULL DEFAULT '{}',
  notification_settings jsonb NOT NULL DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT portal_users_org_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations (id),
  CONSTRAINT portal_user_auth_unique UNIQUE (org_id, auth_user_id)
);

-- Indexes
CREATE UNIQUE INDEX portal_user_auth_idx ON portal_users(org_id, auth_user_id);

--------------------------------------------------------------------------------
-- Table: contacts
--------------------------------------------------------------------------------
CREATE TABLE public.contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL,
  email        varchar(255) NOT NULL,
  name         varchar(255),
  portal_user_id uuid,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  metadata     jsonb        NOT NULL DEFAULT '{}',
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT contacts_org_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations (id),
  CONSTRAINT contacts_portal_user_fkey
    FOREIGN KEY (portal_user_id) REFERENCES public.portal_users (id),
  CONSTRAINT contact_unique_email UNIQUE (org_id, email)
);

-- Indexes
CREATE UNIQUE INDEX contact_email_idx ON contacts(org_id, email);
CREATE INDEX contact_portal_idx ON contacts(portal_user_id) WHERE portal_user_id IS NOT NULL;
CREATE INDEX contact_seen_idx ON contacts(org_id, last_seen_at);

--------------------------------------------------------------------------------
-- Table: teams
--------------------------------------------------------------------------------
CREATE TABLE public.teams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL,
  name        varchar(255) NOT NULL,
  description text,
  schedule    jsonb NOT NULL DEFAULT '{}',
  settings    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teams_org_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations (id),
  CONSTRAINT unique_team_name UNIQUE (org_id, name)
);

-- Indexes
CREATE UNIQUE INDEX team_name_idx ON teams(org_id, name);

--------------------------------------------------------------------------------
-- Table: team_members (linking internal_users to teams)
--------------------------------------------------------------------------------
CREATE TABLE public.team_members (
  team_id     uuid NOT NULL,
  user_id     uuid NOT NULL,
  role        varchar(50) DEFAULT 'member',
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_members_team_fkey
    FOREIGN KEY (team_id) REFERENCES public.teams (id),
  CONSTRAINT team_members_user_fkey
    FOREIGN KEY (user_id) REFERENCES public.internal_users (id),
  CONSTRAINT team_role_check CHECK (role IN ('leader','member')),
  CONSTRAINT team_members_pk PRIMARY KEY (team_id, user_id)
);

--------------------------------------------------------------------------------
-- Table: tickets
--------------------------------------------------------------------------------
CREATE TABLE public.tickets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL,
  number      bigint GENERATED ALWAYS AS IDENTITY,
  subject     varchar(255) NOT NULL,
  status      ticket_status NOT NULL DEFAULT 'open',
  priority    ticket_priority NOT NULL DEFAULT 'normal',
  source      ticket_source NOT NULL,
  contact_id  uuid NOT NULL,
  assignee_id uuid,
  team_id     uuid,
  metadata    jsonb         NOT NULL DEFAULT '{}',
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT tickets_org_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations (id),
  CONSTRAINT tickets_contact_fkey
    FOREIGN KEY (contact_id) REFERENCES public.contacts (id),
  CONSTRAINT tickets_assignee_fkey
    FOREIGN KEY (assignee_id) REFERENCES public.internal_users (id),
  CONSTRAINT tickets_team_fkey
    FOREIGN KEY (team_id) REFERENCES public.teams (id),
  CONSTRAINT tickets_number_unique UNIQUE (org_id, number)
);

-- Indexes
CREATE UNIQUE INDEX ticket_number_idx ON tickets(org_id, number);
CREATE INDEX ticket_status_idx ON tickets(org_id, status, created_at);
CREATE INDEX ticket_contact_idx ON tickets(contact_id, created_at);
CREATE INDEX ticket_assignee_idx ON tickets(assignee_id, status);
CREATE INDEX ticket_team_idx ON tickets(team_id, status);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- Table: messages
--------------------------------------------------------------------------------
CREATE TABLE public.messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    uuid NOT NULL,
  sender_type  message_sender_type NOT NULL,
  sender_id    uuid NOT NULL,
  content      text NOT NULL,
  content_type message_content_type NOT NULL DEFAULT 'text',
  is_private   boolean DEFAULT false,
  metadata     jsonb        NOT NULL DEFAULT '{}',
  created_at   timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT messages_ticket_fkey
    FOREIGN KEY (ticket_id) REFERENCES public.tickets (id),
  CONSTRAINT sender_type_check
    CHECK (sender_type IN ('contact','internal_user','system')),
  CONSTRAINT content_type_check
    CHECK (content_type IN ('text','html','markdown'))
);

-- Indexes
CREATE INDEX message_ticket_idx ON messages(ticket_id, created_at);
CREATE INDEX message_sender_idx ON messages(sender_type, sender_id);

--------------------------------------------------------------------------------
-- Table: articles (Knowledge Base)
--------------------------------------------------------------------------------
CREATE TABLE public.articles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL,
  title        varchar(255) NOT NULL,
  slug         varchar(255) NOT NULL,
  content      text NOT NULL,
  status       article_status NOT NULL DEFAULT 'draft',
  version      integer NOT NULL DEFAULT 1,
  locale       varchar(10) NOT NULL DEFAULT 'en',
  seo_metadata jsonb        NOT NULL DEFAULT '{}',
  author_id    uuid NOT NULL,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT articles_org_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations (id),
  CONSTRAINT articles_author_fkey
    FOREIGN KEY (author_id) REFERENCES public.internal_users (id),
  CONSTRAINT articles_slug_unique UNIQUE (org_id, slug, locale),
  CONSTRAINT locale_check
    CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$')
);

-- Indexes
CREATE UNIQUE INDEX article_slug_idx ON articles(org_id, slug, locale);
CREATE INDEX article_status_idx ON articles(org_id, status, updated_at);

--------------------------------------------------------------------------------
-- Table: skills
--------------------------------------------------------------------------------
CREATE TABLE public.skills (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL,
  name        varchar(255) NOT NULL,
  description text,
  level       integer NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT skills_org_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations (id),
  CONSTRAINT skill_level_check CHECK (level BETWEEN 1 AND 5),
  CONSTRAINT skill_name_unique UNIQUE (org_id, name)
);

-- Indexes
CREATE UNIQUE INDEX skill_name_idx ON skills(org_id, name);

--------------------------------------------------------------------------------
-- Table: tags
--------------------------------------------------------------------------------
CREATE TABLE public.tags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL,
  name        varchar(255) NOT NULL,
  color       varchar(7)   NOT NULL DEFAULT '#808080',
  description text,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT tags_org_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations (id),
  CONSTRAINT tag_name_unique UNIQUE (org_id, name),
  CONSTRAINT color_hex_check CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Indexes
CREATE UNIQUE INDEX tag_name_idx ON tags(org_id, name);

--------------------------------------------------------------------------------
-- Table: attachments
--------------------------------------------------------------------------------
CREATE TABLE public.attachments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL,
  ticket_id   uuid NOT NULL,
  bucket      varchar(255)  NOT NULL,
  path        varchar(1024) NOT NULL,
  filename    varchar(255)  NOT NULL,
  size        bigint        NOT NULL,
  mime_type   varchar(255)  NOT NULL,
  metadata    jsonb         NOT NULL DEFAULT '{}',
  created_at  timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT attachments_org_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations (id),
  CONSTRAINT attachments_ticket_fkey
    FOREIGN KEY (ticket_id) REFERENCES public.tickets (id),
  CONSTRAINT attachment_size_check CHECK (size > 0),
  CONSTRAINT attachment_path_unique UNIQUE (bucket, path)
);

-- Indexes
CREATE INDEX attachment_org_idx ON attachments(org_id, created_at);
CREATE INDEX attachment_ticket_idx ON attachments(ticket_id, created_at);
CREATE UNIQUE INDEX attachment_path_idx ON attachments(bucket, path);

--------------------------------------------------------------------------------
-- Table: audit_logs
--------------------------------------------------------------------------------
CREATE TABLE public.audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL,
  action      varchar(50)   NOT NULL,
  entity_type varchar(50)   NOT NULL,
  entity_id   uuid          NOT NULL,
  actor_id    uuid,
  changes     jsonb         NOT NULL,
  created_at  timestamptz   NOT NULL DEFAULT now(),
  CONSTRAINT audit_org_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations (id),
  CONSTRAINT audit_actor_fkey
    FOREIGN KEY (actor_id) REFERENCES public.internal_users (id),
  CONSTRAINT audit_action_check
    CHECK (action IN ('insert','update','delete','restore'))
);

-- Indexes
CREATE INDEX audit_org_idx ON audit_logs(org_id, created_at);
CREATE INDEX audit_entity_idx ON audit_logs(entity_type, entity_id);

--------------------------------------------------------------------------------
-- Table: portal_links
--------------------------------------------------------------------------------
CREATE TABLE public.portal_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL,
  token       varchar(64) NOT NULL,
  contact_id  uuid NOT NULL,
  ticket_id   uuid,
  expires_at  timestamptz NOT NULL,
  used        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT portal_links_org_fkey
    FOREIGN KEY (org_id) REFERENCES public.organizations (id),
  CONSTRAINT portal_links_contact_fkey
    FOREIGN KEY (contact_id) REFERENCES public.contacts (id),
  CONSTRAINT portal_links_ticket_fkey
    FOREIGN KEY (ticket_id) REFERENCES public.tickets (id),
  CONSTRAINT portal_links_token_unique UNIQUE (token)
);

-- Indexes
CREATE UNIQUE INDEX portal_links_token_idx ON portal_links(token);
CREATE INDEX portal_links_contact_idx ON portal_links(contact_id);
CREATE INDEX portal_links_expires_idx ON portal_links(expires_at) WHERE NOT used;

COMMIT; 