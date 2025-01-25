-- 0002_security_policies.sql
-- Supabase Migration File for CrabDesk Data Model Security Policies
--
-- This file creates new, more granular row-level security (RLS) policies
-- based on the updated security requirements specified in data-model.md.
-- It adds separate policies for READ, INSERT, UPDATE, and DELETE where
-- each table's "Security Policies" section was defined. This does not
-- remove or rename any existing policies—adjust or remove duplicates as
-- needed after review.

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

-- Get the org_roles map from JWT app_metadata
CREATE OR REPLACE FUNCTION public.get_org_roles()
  RETURNS jsonb
  LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' -> 'org_roles', '{}'::jsonb)
$$;

-- Check if user has access to an org with any role
CREATE OR REPLACE FUNCTION public.has_org_access(org_id uuid)
  RETURNS boolean
  LANGUAGE sql STABLE
AS $$
  SELECT public.get_org_roles() ? org_id::text
$$;

-- Get user's role for a specific org
CREATE OR REPLACE FUNCTION public.get_org_role(org_id uuid)
  RETURNS user_role
  LANGUAGE sql STABLE
AS $$
  SELECT (public.get_org_roles() ->> org_id::text)::user_role
$$;

-- Check if user is a system admin
CREATE OR REPLACE FUNCTION public.is_system_admin()
  RETURNS boolean
  LANGUAGE sql STABLE
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'is_system_admin')::boolean
$$;

-- Check if user is an internal user (admin or regular) for an org
CREATE OR REPLACE FUNCTION public.is_internal_user(org_id uuid)
  RETURNS boolean
  LANGUAGE sql STABLE
AS $$
  SELECT public.get_org_role(org_id) IN ('internal_user', 'internal_admin')
$$;

-- Check if user is an internal admin for an org
CREATE OR REPLACE FUNCTION public.is_internal_admin(org_id uuid)
  RETURNS boolean
  LANGUAGE sql STABLE
AS $$
  SELECT public.get_org_role(org_id) = 'internal_admin'
$$;

-- Check if user is a portal user for an org
CREATE OR REPLACE FUNCTION public.is_portal_user(org_id uuid)
  RETURNS boolean
  LANGUAGE sql STABLE
AS $$
  -- TODO : SELECT public.get_org_role(org_id) = 'portal_user'
  SELECT true
$$;

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

-- Helper Function to get auth_user_id from a contact through portal_user
CREATE OR REPLACE FUNCTION public.get_contact_auth_user_id(_contact_id uuid)
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
AS $$
  SELECT pu.auth_user_id
  FROM contacts c
  JOIN portal_users pu ON c.portal_user_id = pu.id
  WHERE c.id = _contact_id
  LIMIT 1
$$;

-------------------------------------------------------------------------------
-- Helper Functions to Check Admin Roles
-- (Placeholders; adjust claim keys to match your JWT payload)
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_system_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
AS $$
  -- Expects your JWT to have { "role": "system_admin" } set for system admins.
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'system_admin'
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
AS $$
  -- Expects your JWT to have { "is_admin": true, "org_id": "<UUID>" } set for org admins.
  SELECT (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
$$;

-------------------------------------------------------------------------------
-- 1) organizations
-- Security Policies:
--   READ: Users can read organizations they have access to
--   INSERT: Only system admins can create organizations
--   UPDATE: Organization admins can update their own organization
--   DELETE: Only system admins can delete organizations
-------------------------------------------------------------------------------
-- READ
CREATE POLICY organizations_read
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_access(id)
  );

-- INSERT
CREATE POLICY organizations_insert
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_system_admin()
  );

-- UPDATE
CREATE POLICY organizations_update
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    public.is_internal_admin(id)
  )
  WITH CHECK (
    public.is_internal_admin(id)
  );

-- DELETE
CREATE POLICY organizations_delete
  ON public.organizations
  FOR DELETE
  TO authenticated
  USING (
    public.is_system_admin()
  );

-------------------------------------------------------------------------------
-- 2) internal_users
-- Security Policies:
--   READ: Users can read internal_users within their organization
--   INSERT: Organization admins can create new internal users
--   UPDATE: Users can update their own profile, admins can update any user in their org
--   DELETE: Organization admins can delete users
-------------------------------------------------------------------------------
-- READ
CREATE POLICY internal_users_read
  ON public.internal_users
  FOR SELECT
  TO authenticated
  USING (
    public.is_internal_user(org_id)
  );

-- INSERT
CREATE POLICY internal_users_insert
  ON public.internal_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_internal_admin(org_id)
  );

-- UPDATE
CREATE POLICY internal_users_update
  ON public.internal_users
  FOR UPDATE
  TO authenticated
  USING (
    public.is_internal_user(org_id) AND
    ((SELECT auth.uid()) = auth_user_id OR public.is_internal_admin(org_id))
  )
  WITH CHECK (
    public.is_internal_user(org_id) AND
    ((SELECT auth.uid()) = auth_user_id OR public.is_internal_admin(org_id))
  );

-- DELETE
CREATE POLICY internal_users_delete
  ON public.internal_users
  FOR DELETE
  TO authenticated
  USING (
    public.is_internal_admin(org_id)
  );

-------------------------------------------------------------------------------
-- 3) contacts
-- Security Policies:
--   READ: Internal users can read contacts in their organization and portal users can read their own contacts
--   INSERT: Internal users can create contacts in their organization
--   UPDATE: Internal users can update contacts in their organization
--   DELETE: Organization admins can delete contacts
-------------------------------------------------------------------------------
-- READ
CREATE POLICY contacts_read
  ON public.contacts
  FOR SELECT
  TO authenticated
  USING (
    public.is_internal_user(org_id) OR
    (public.is_portal_user(org_id) AND public.get_contact_auth_user_id(id) = (SELECT auth.uid()))
  );

-- INSERT
CREATE POLICY contacts_insert
  ON public.contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_internal_user(org_id)
  );

-- UPDATE
CREATE POLICY contacts_update
  ON public.contacts
  FOR UPDATE
  TO authenticated
  USING (
    public.is_internal_user(org_id)
  )
  WITH CHECK (
    public.is_internal_user(org_id)
  );

-- DELETE
CREATE POLICY contacts_delete
  ON public.contacts
  FOR DELETE
  TO authenticated
  USING (
    public.is_internal_admin(org_id)
  );

-------------------------------------------------------------------------------
-- 4) portal_users
-- Security Policies:
--   READ: Internal users can read all portal users in their org
--   INSERT: Internal users can create portal users
--   UPDATE: Internal users can update portal users, users can update their own
--   DELETE: Organization admins can delete portal users
-------------------------------------------------------------------------------
-- READ
CREATE POLICY portal_users_read
  ON public.portal_users
  FOR SELECT
  TO authenticated
  USING (
    public.is_internal_user(org_id) OR
    (public.is_portal_user(org_id) AND (SELECT auth.uid()) = auth_user_id)
  );

-- INSERT
CREATE POLICY portal_users_insert
  ON public.portal_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_internal_user(org_id)
  );

-- UPDATE
CREATE POLICY portal_users_update
  ON public.portal_users
  FOR UPDATE
  TO authenticated
  USING (
    public.is_internal_user(org_id) OR
    (public.is_portal_user(org_id) AND (SELECT auth.uid()) = auth_user_id)
  )
  WITH CHECK (
    public.is_internal_user(org_id) OR
    (public.is_portal_user(org_id) AND (SELECT auth.uid()) = auth_user_id)
  );

-- DELETE
CREATE POLICY portal_users_delete
  ON public.portal_users
  FOR DELETE
  TO authenticated
  USING (
    public.is_internal_admin(org_id)
  );

-------------------------------------------------------------------------------
-- 5) teams
-- Security Policies:
--   READ: All internal users can read teams in their organization
--   INSERT: Organization admins can create teams
--   UPDATE: Team leaders + org admins can update team details
--   DELETE: Organization admins can delete teams
-------------------------------------------------------------------------------
-- READ
CREATE POLICY teams_read
  ON public.teams
  FOR SELECT
  TO authenticated
  USING (
    public.is_internal_user(org_id)
  );

-- INSERT
CREATE POLICY teams_insert
  ON public.teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_internal_admin(org_id)
  );

-- UPDATE
CREATE POLICY teams_update
  ON public.teams
  FOR UPDATE
  TO authenticated
  USING (
    public.is_internal_admin(org_id)
  )
  WITH CHECK (
    public.is_internal_admin(org_id)
  );

-- DELETE
CREATE POLICY teams_delete
  ON public.teams
  FOR DELETE
  TO authenticated
  USING (
    public.is_internal_admin(org_id)
  );

-------------------------------------------------------------------------------
-- 6) team_members
-- Security Policies:
--   READ: All internal users can read team memberships in their org
--   INSERT: Team leaders & org admins can add members
--   UPDATE: Team leaders & org admins can modify roles
--   DELETE: Team leaders & org admins can remove members
-------------------------------------------------------------------------------
-- READ
CREATE POLICY team_members_read
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (
    public.is_internal_user(public.fetch_team_org_id(team_id))
  );

-- INSERT
CREATE POLICY team_members_insert
  ON public.team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_internal_admin(public.fetch_team_org_id(team_id))
  );

-- UPDATE
CREATE POLICY team_members_update
  ON public.team_members
  FOR UPDATE
  TO authenticated
  USING (
    public.is_internal_admin(public.fetch_team_org_id(team_id))
  )
  WITH CHECK (
    public.is_internal_admin(public.fetch_team_org_id(team_id))
  );

-- DELETE
CREATE POLICY team_members_delete
  ON public.team_members
  FOR DELETE
  TO authenticated
  USING (
    public.is_internal_admin(public.fetch_team_org_id(team_id))
  );

-------------------------------------------------------------------------------
-- 7) tickets
-- Security Policies:
--   READ: Internal users can read tickets in their org, portal users their own
--   INSERT: Internal users and portal users can create tickets, portal users can only create tickets for their own contacts
--   UPDATE: Internal users can update tickets
--   DELETE: Organization admins can delete tickets
-------------------------------------------------------------------------------
-- READ
CREATE POLICY tickets_read
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    public.is_internal_user(org_id) OR
    (public.is_portal_user(org_id) AND public.get_contact_auth_user_id(contact_id) = (SELECT auth.uid()))
  );

-- INSERT
CREATE POLICY tickets_insert
  ON public.tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (public.is_internal_user(org_id)) OR
    (public.is_portal_user(org_id) AND public.get_contact_auth_user_id(contact_id) = (SELECT auth.uid()))
  );

-- UPDATE
CREATE POLICY tickets_update
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (
    public.is_internal_user(org_id)
  )
  WITH CHECK (
    public.is_internal_user(org_id)
  );

-- DELETE
CREATE POLICY tickets_delete
  ON public.tickets
  FOR DELETE
  TO authenticated
  USING (
    public.is_internal_admin(org_id)
  );

-------------------------------------------------------------------------------
-- 8) messages
-- Security Policies:
--   READ: Internal users can read all messages, portal users only their ticket messages
--   INSERT: Any authenticated user can create messages on accessible tickets
--   UPDATE: Message creators can update their messages within a time window
--   DELETE: Not allowed (audit requirements)
-------------------------------------------------------------------------------
-- READ
CREATE POLICY messages_read
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    public.is_internal_user(public.fetch_ticket_org_id(ticket_id)) OR
    (public.is_portal_user(public.fetch_ticket_org_id(ticket_id)) AND ticket_id IN (
      SELECT t.id FROM tickets t
      WHERE public.get_contact_auth_user_id(t.contact_id) = (SELECT auth.uid())
    ))
  );

-- INSERT
CREATE POLICY messages_insert
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_internal_user(public.fetch_ticket_org_id(ticket_id)) OR
    (public.is_portal_user(public.fetch_ticket_org_id(ticket_id)) AND ticket_id IN (
      SELECT t.id FROM tickets t
      WHERE public.get_contact_auth_user_id(t.contact_id) = (SELECT auth.uid())
    ))
  );

-- UPDATE
CREATE POLICY messages_update
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (
    public.is_internal_user(public.fetch_ticket_org_id(ticket_id)) AND
    created_at > now() - interval '5 minutes'
  )
  WITH CHECK (
    public.is_internal_user(public.fetch_ticket_org_id(ticket_id)) AND
    created_at > now() - interval '5 minutes'
  );

-- DELETE
CREATE POLICY messages_delete
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (FALSE);

-------------------------------------------------------------------------------
-- 9) articles
-- Security Policies:
--   READ: Published articles visible to all users in org, drafts to internal users
--   INSERT: Internal users can create articles
--   UPDATE: Authors & admins can update articles
--   DELETE: Organization admins can delete articles
-------------------------------------------------------------------------------
-- READ
CREATE POLICY articles_read
  ON public.articles
  FOR SELECT
  TO authenticated
  USING (
    (status = 'published' AND public.has_org_access(org_id)) OR
    public.is_internal_user(org_id)
  );

-- INSERT
CREATE POLICY articles_insert
  ON public.articles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_internal_user(org_id)
  );

-- UPDATE
CREATE POLICY articles_update
  ON public.articles
  FOR UPDATE
  TO authenticated
  USING (
    public.is_internal_user(org_id) AND
    (author_id = (SELECT auth.uid()) OR public.is_internal_admin(org_id))
  )
  WITH CHECK (
    public.is_internal_user(org_id) AND
    (author_id = (SELECT auth.uid()) OR public.is_internal_admin(org_id))
  );

-- DELETE
CREATE POLICY articles_delete
  ON public.articles
  FOR DELETE
  TO authenticated
  USING (
    public.is_internal_admin(org_id)
  );

-------------------------------------------------------------------------------
-- 10) skills
-- Security Policies:
--   READ: All internal users can read skills
--   INSERT: Organization admins can create skills
--   UPDATE: Organization admins can update skills
--   DELETE: Organization admins can delete unused skills
-------------------------------------------------------------------------------
-- READ
CREATE POLICY skills_read
  ON public.skills
  FOR SELECT
  TO authenticated
  USING (
    public.is_internal_user(org_id)
  );

-- INSERT
CREATE POLICY skills_insert
  ON public.skills
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_internal_admin(org_id)
  );

-- UPDATE
CREATE POLICY skills_update
  ON public.skills
  FOR UPDATE
  TO authenticated
  USING (
    public.is_internal_admin(org_id)
  )
  WITH CHECK (
    public.is_internal_admin(org_id)
  );

-- DELETE
CREATE POLICY skills_delete
  ON public.skills
  FOR DELETE
  TO authenticated
  USING (
    public.is_internal_admin(org_id)
  );

-------------------------------------------------------------------------------
-- 11) tags
-- Security Policies:
--   READ: All users can read tags
--   INSERT: Internal users can create tags
--   UPDATE: Internal users can update tags
--   DELETE: Organization admins can delete unused tags
-------------------------------------------------------------------------------
-- READ
CREATE POLICY tags_read
  ON public.tags
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_access(org_id)
  );

-- INSERT
CREATE POLICY tags_insert
  ON public.tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_internal_user(org_id)
  );

-- UPDATE
CREATE POLICY tags_update
  ON public.tags
  FOR UPDATE
  TO authenticated
  USING (
    public.is_internal_user(org_id)
  )
  WITH CHECK (
    public.is_internal_user(org_id)
  );

-- DELETE
CREATE POLICY tags_delete
  ON public.tags
  FOR DELETE
  TO authenticated
  USING (
    public.is_internal_admin(org_id)
  );

-------------------------------------------------------------------------------
-- 12) attachments
-- Security Policies:
--   READ: Users can read attachments on tickets they can access
--   INSERT: Users can upload attachments to tickets they can access
--   UPDATE: No updates allowed after upload
--   DELETE: Organization admins can delete attachments
-------------------------------------------------------------------------------
-- READ
CREATE POLICY attachments_read
  ON public.attachments
  FOR SELECT
  TO authenticated
  USING (
    public.is_internal_user(org_id) OR
    (public.is_portal_user(org_id) AND ticket_id IN (
      SELECT t.id FROM tickets t
      WHERE public.get_contact_auth_user_id(t.contact_id) = (SELECT auth.uid())
    ))
  );

-- INSERT
CREATE POLICY attachments_insert
  ON public.attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_internal_user(org_id) OR
    (public.is_portal_user(org_id) AND ticket_id IN (
      SELECT t.id FROM tickets t
      WHERE public.get_contact_auth_user_id(t.contact_id) = (SELECT auth.uid())
    ))
  );

-- UPDATE
CREATE POLICY attachments_update
  ON public.attachments
  FOR UPDATE
  TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

-- DELETE
CREATE POLICY attachments_delete
  ON public.attachments
  FOR DELETE
  TO authenticated
  USING (
    public.is_internal_admin(org_id)
  );

-------------------------------------------------------------------------------
-- 13) audit_logs
-- Security Policies:
--   READ: Organization members can read audit logs
--   INSERT: System automatically creates audit logs
--   UPDATE: No updates allowed
--   DELETE: No deletion allowed
-------------------------------------------------------------------------------
-- READ
CREATE POLICY audit_logs_read
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    public.is_internal_user(org_id)
  );

-- INSERT
CREATE POLICY audit_logs_insert
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_internal_user(org_id)
  );

-- UPDATE
CREATE POLICY audit_logs_update
  ON public.audit_logs
  FOR UPDATE
  TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

-- DELETE
CREATE POLICY audit_logs_delete
  ON public.audit_logs
  FOR DELETE
  TO authenticated
  USING (FALSE);

-------------------------------------------------------------------------------
-- 14) portal_links
-- Security Policies:
--   READ: Internal users can read portal links in their org
--   INSERT: Internal users can create portal links
--   UPDATE: Internal users can update portal links (for marking as used)
--   DELETE: Internal users can create portal links
-------------------------------------------------------------------------------
-- READ
CREATE POLICY portal_links_read
  ON public.portal_links
  FOR SELECT
  TO authenticated
  USING (
    public.is_internal_user(org_id)
  );

-- INSERT
CREATE POLICY portal_links_insert
  ON public.portal_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_internal_user(org_id)
  );

-- UPDATE
CREATE POLICY portal_links_update
  ON public.portal_links
  FOR UPDATE
  TO authenticated
  USING (
    public.is_internal_user(org_id)
  )
  WITH CHECK (
    public.is_internal_user(org_id)
  );

-- DELETE
CREATE POLICY portal_links_delete
  ON public.portal_links
  FOR DELETE
  TO authenticated
  USING (
    public.is_internal_user(org_id)
  );

COMMIT; 