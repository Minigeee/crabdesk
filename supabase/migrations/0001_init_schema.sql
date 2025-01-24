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

--------------------------------------------------------------------------------
-- Helper Function: current_org_id()
-- Returns the "org_id" from the user's JWT app_metadata.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_org_id()
  RETURNS uuid
  LANGUAGE sql STABLE
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
$$;

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

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow org members to see only their organization row
CREATE POLICY org_select_policy
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (id = public.current_org_id());

-- Policy: Allow org admins to update their organization
-- (Adjust the role check to match your JWT claims or internal_users table as needed)
CREATE POLICY org_update_policy
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (id = public.current_org_id())
  WITH CHECK (id = public.current_org_id());

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

ALTER TABLE public.internal_users ENABLE ROW LEVEL SECURITY;

-- Policy: Only return internal_users from the same org
CREATE POLICY internal_users_select
  ON public.internal_users
  FOR SELECT
  TO authenticated
  USING (org_id = public.current_org_id());

-- Policy: Insert / update only if it matches the same org
CREATE POLICY internal_users_mod
  ON public.internal_users
  FOR ALL
  TO authenticated
  USING (org_id = public.current_org_id())
  WITH CHECK (org_id = public.current_org_id());

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

ALTER TABLE public.portal_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY portal_users_select
  ON public.portal_users
  FOR SELECT
  TO authenticated
  USING (org_id = public.current_org_id());

CREATE POLICY portal_users_mod
  ON public.portal_users
  FOR ALL
  TO authenticated
  USING (org_id = public.current_org_id())
  WITH CHECK (org_id = public.current_org_id());

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

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contacts_select
  ON public.contacts
  FOR SELECT
  TO authenticated
  USING (org_id = public.current_org_id());

CREATE POLICY contacts_mod
  ON public.contacts
  FOR ALL
  TO authenticated
  USING (org_id = public.current_org_id())
  WITH CHECK (org_id = public.current_org_id());

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

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Helper Function to avoid recursion in RLS policies
CREATE OR REPLACE FUNCTION public.fetch_team_org_id(_team_id uuid)
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
AS $$
  SELECT org_id FROM public.teams
   WHERE id = _team_id
   LIMIT 1
$$;

CREATE POLICY teams_select
  ON public.teams
  FOR SELECT
  TO authenticated
  USING (org_id = public.current_org_id());

CREATE POLICY teams_mod
  ON public.teams
  FOR ALL
  TO authenticated
  USING (org_id = public.current_org_id())
  WITH CHECK (org_id = public.current_org_id());

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

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- We must fetch the org_id from the related team to compare to the current user's org.
CREATE POLICY team_members_select
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (
    public.fetch_team_org_id(team_id) = public.current_org_id()
  );

CREATE POLICY team_members_mod
  ON public.team_members
  FOR ALL
  TO authenticated
  USING (
    public.fetch_team_org_id(team_id) = public.current_org_id()
  )
  WITH CHECK (
    public.fetch_team_org_id(team_id) = public.current_org_id()
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

-- Helper Function to avoid recursion in RLS policies
CREATE OR REPLACE FUNCTION public.fetch_ticket_org_id(_ticket_id uuid)
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
AS $$
  SELECT org_id FROM public.tickets
   WHERE id = _ticket_id
   LIMIT 1
$$;

CREATE POLICY tickets_select
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (org_id = public.current_org_id());

CREATE POLICY tickets_mod
  ON public.tickets
  FOR ALL
  TO authenticated
  USING (org_id = public.current_org_id())
  WITH CHECK (org_id = public.current_org_id());

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

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY messages_select
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    public.fetch_ticket_org_id(ticket_id) = public.current_org_id()
  );

CREATE POLICY messages_mod
  ON public.messages
  FOR ALL
  TO authenticated
  USING (
    public.fetch_ticket_org_id(ticket_id) = public.current_org_id()
  )
  WITH CHECK (
    public.fetch_ticket_org_id(ticket_id) = public.current_org_id()
  );

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

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY articles_select
  ON public.articles
  FOR SELECT
  TO authenticated
  USING (org_id = public.current_org_id());

CREATE POLICY articles_mod
  ON public.articles
  FOR ALL
  TO authenticated
  USING (org_id = public.current_org_id())
  WITH CHECK (org_id = public.current_org_id());

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

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY skills_select
  ON public.skills
  FOR SELECT
  TO authenticated
  USING (org_id = public.current_org_id());

CREATE POLICY skills_mod
  ON public.skills
  FOR ALL
  TO authenticated
  USING (org_id = public.current_org_id())
  WITH CHECK (org_id = public.current_org_id());

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

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY tags_select
  ON public.tags
  FOR SELECT
  TO authenticated
  USING (org_id = public.current_org_id());

CREATE POLICY tags_mod
  ON public.tags
  FOR ALL
  TO authenticated
  USING (org_id = public.current_org_id())
  WITH CHECK (org_id = public.current_org_id());

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

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY attachments_select
  ON public.attachments
  FOR SELECT
  TO authenticated
  USING (org_id = public.current_org_id());

CREATE POLICY attachments_mod
  ON public.attachments
  FOR ALL
  TO authenticated
  USING (org_id = public.current_org_id())
  WITH CHECK (org_id = public.current_org_id());

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

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_select
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (org_id = public.current_org_id());

-- Typically only admins can insert (or an automated system).
CREATE POLICY audit_logs_insert
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.current_org_id());

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

ALTER TABLE public.portal_links ENABLE ROW LEVEL SECURITY;

COMMIT; 