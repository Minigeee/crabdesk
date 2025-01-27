-- 0002_security_policies.sql
-- Supabase Migration File for CrabDesk Security Policies

BEGIN;

-------------------------------------------------------------------------------
-- Drop existing policies
-------------------------------------------------------------------------------
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Enable RLS on all tables
DO $$ 
DECLARE
    table_name text;
BEGIN
    FOR table_name IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    )
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    END LOOP;
END $$;

--------------------------------------------------------------------------------
-- Helper Functions for Auth
--------------------------------------------------------------------------------

-- Check if user has access to an org
CREATE OR REPLACE FUNCTION public.has_org_access(_org_id uuid)
  RETURNS boolean
  LANGUAGE sql STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND org_id = _org_id
  );
$$;

-- Check if user is an admin for an org
CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id uuid)
  RETURNS boolean
  LANGUAGE sql STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND org_id = _org_id
    AND is_admin = true
  );
$$;

-- Helper Function to avoid recursion in RLS policies
CREATE OR REPLACE FUNCTION public.fetch_team_org_id(_team_id uuid)
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT org_id FROM public.teams
   WHERE id = _team_id
   LIMIT 1
$$;

-- Helper Function to avoid recursion in RLS policies
CREATE OR REPLACE FUNCTION public.fetch_ticket_org_id(_ticket_id uuid)
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT org_id FROM public.tickets
   WHERE id = _ticket_id
   LIMIT 1
$$;

-------------------------------------------------------------------------------
-- Organizations
-------------------------------------------------------------------------------
CREATE POLICY organizations_read
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_access(id)
  );

CREATE POLICY organizations_insert
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (false); -- Only through admin API

CREATE POLICY organizations_update
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    public.is_org_admin(id)
  )
  WITH CHECK (
    public.is_org_admin(id)
  );

CREATE POLICY organizations_delete
  ON public.organizations
  FOR DELETE
  TO authenticated
  USING (false); -- Only through admin API

-------------------------------------------------------------------------------
-- Users
-------------------------------------------------------------------------------
CREATE POLICY users_read
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_access(org_id)
  );

CREATE POLICY users_insert
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_admin(org_id)
  );

CREATE POLICY users_update
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    auth_user_id = auth.uid() OR public.is_org_admin(org_id)
  )
  WITH CHECK (
    auth_user_id = auth.uid() OR public.is_org_admin(org_id)
  );

CREATE POLICY users_delete
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_admin(org_id)
  );

-------------------------------------------------------------------------------
-- Contacts
-------------------------------------------------------------------------------
CREATE POLICY contacts_read
  ON public.contacts
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_access(org_id)
  );

CREATE POLICY contacts_insert
  ON public.contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_access(org_id)
  );

CREATE POLICY contacts_update
  ON public.contacts
  FOR UPDATE
  TO authenticated
  USING (
    public.has_org_access(org_id)
  )
  WITH CHECK (
    public.has_org_access(org_id)
  );

CREATE POLICY contacts_delete
  ON public.contacts
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_admin(org_id)
  );

-------------------------------------------------------------------------------
-- Teams
-------------------------------------------------------------------------------
CREATE POLICY teams_read
  ON public.teams
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_access(org_id)
  );

CREATE POLICY teams_insert
  ON public.teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_admin(org_id)
  );

CREATE POLICY teams_update
  ON public.teams
  FOR UPDATE
  TO authenticated
  USING (
    public.is_org_admin(org_id)
  )
  WITH CHECK (
    public.is_org_admin(org_id)
  );

CREATE POLICY teams_delete
  ON public.teams
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_admin(org_id)
  );

-------------------------------------------------------------------------------
-- Team Members
-------------------------------------------------------------------------------
CREATE POLICY team_members_read
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_access(public.fetch_team_org_id(team_id))
  );

CREATE POLICY team_members_insert
  ON public.team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_admin(public.fetch_team_org_id(team_id))
  );

CREATE POLICY team_members_update
  ON public.team_members
  FOR UPDATE
  TO authenticated
  USING (
    public.is_org_admin(public.fetch_team_org_id(team_id))
  )
  WITH CHECK (
    public.is_org_admin(public.fetch_team_org_id(team_id))
  );

CREATE POLICY team_members_delete
  ON public.team_members
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_admin(public.fetch_team_org_id(team_id))
  );

-------------------------------------------------------------------------------
-- Tickets
-------------------------------------------------------------------------------
CREATE POLICY tickets_read
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_access(org_id)
  );

CREATE POLICY tickets_insert
  ON public.tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_access(org_id)
  );

CREATE POLICY tickets_update
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (
    public.has_org_access(org_id)
  )
  WITH CHECK (
    public.has_org_access(org_id)
  );

CREATE POLICY tickets_delete
  ON public.tickets
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_admin(org_id)
  );

-------------------------------------------------------------------------------
-- Email Threads
-------------------------------------------------------------------------------
CREATE POLICY email_threads_read
  ON public.email_threads
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_access(org_id)
  );

CREATE POLICY email_threads_insert
  ON public.email_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_access(org_id)
  );

CREATE POLICY email_threads_update
  ON public.email_threads
  FOR UPDATE
  TO authenticated
  USING (
    public.has_org_access(org_id)
  )
  WITH CHECK (
    public.has_org_access(org_id)
  );

CREATE POLICY email_threads_delete
  ON public.email_threads
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_admin(org_id)
  );

-------------------------------------------------------------------------------
-- Messages
-------------------------------------------------------------------------------
CREATE POLICY messages_read
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_access(public.fetch_ticket_org_id(ticket_id))
  );

CREATE POLICY messages_insert
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_access(public.fetch_ticket_org_id(ticket_id))
  );

CREATE POLICY messages_update
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    public.has_org_access(public.fetch_ticket_org_id(ticket_id)) AND
    sender_id = auth.uid() AND
    created_at > now() - interval '5 minutes'
  )
  WITH CHECK (
    public.has_org_access(public.fetch_ticket_org_id(ticket_id)) AND
    sender_id = auth.uid() AND
    created_at > now() - interval '5 minutes'
  );

CREATE POLICY messages_delete
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (false);

-------------------------------------------------------------------------------
-- Skills
-------------------------------------------------------------------------------
CREATE POLICY skills_read
  ON public.skills
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_access(org_id)
  );

CREATE POLICY skills_insert
  ON public.skills
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_admin(org_id)
  );

CREATE POLICY skills_update
  ON public.skills
  FOR UPDATE
  TO authenticated
  USING (
    public.is_org_admin(org_id)
  )
  WITH CHECK (
    public.is_org_admin(org_id)
  );

CREATE POLICY skills_delete
  ON public.skills
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_admin(org_id)
  );

-------------------------------------------------------------------------------
-- Tags
-------------------------------------------------------------------------------
CREATE POLICY tags_read
  ON public.tags
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_access(org_id)
  );

CREATE POLICY tags_insert
  ON public.tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_access(org_id)
  );

CREATE POLICY tags_update
  ON public.tags
  FOR UPDATE
  TO authenticated
  USING (
    public.has_org_access(org_id)
  )
  WITH CHECK (
    public.has_org_access(org_id)
  );

CREATE POLICY tags_delete
  ON public.tags
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_admin(org_id)
  );

-------------------------------------------------------------------------------
-- Attachments
-------------------------------------------------------------------------------
CREATE POLICY attachments_read
  ON public.attachments
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_access(org_id)
  );

CREATE POLICY attachments_insert
  ON public.attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_access(org_id)
  );

CREATE POLICY attachments_update
  ON public.attachments
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY attachments_delete
  ON public.attachments
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_admin(org_id)
  );

-------------------------------------------------------------------------------
-- Notes
-------------------------------------------------------------------------------
CREATE POLICY notes_read
  ON public.notes
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_access(org_id)
  );

CREATE POLICY notes_insert
  ON public.notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_access(org_id)
  );

CREATE POLICY notes_update
  ON public.notes
  FOR UPDATE
  TO authenticated
  USING (
    public.has_org_access(org_id) AND
    author_id = auth.uid() AND
    created_at > now() - interval '5 minutes'
  )
  WITH CHECK (
    public.has_org_access(org_id) AND
    author_id = auth.uid() AND
    created_at > now() - interval '5 minutes'
  );

CREATE POLICY notes_delete
  ON public.notes
  FOR DELETE
  TO authenticated
  USING (
    public.has_org_access(org_id)
  );

-------------------------------------------------------------------------------
-- Audit Logs
-------------------------------------------------------------------------------
CREATE POLICY audit_logs_read
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_access(org_id)
  );

CREATE POLICY audit_logs_insert
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_access(org_id)
  );

CREATE POLICY audit_logs_update
  ON public.audit_logs
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY audit_logs_delete
  ON public.audit_logs
  FOR DELETE
  TO authenticated
  USING (false);

COMMIT; 