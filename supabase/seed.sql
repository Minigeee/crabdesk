-- seed.sql
-- Seed file for CrabDesk development environment
BEGIN;

--------------------------------------------------------------------------------
-- Auth Users (Supabase)
--------------------------------------------------------------------------------
-- Create auth users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES
-- Agent
(
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000002',  -- matches auth_user_id in users table
  'authenticated',
  'authenticated',
  'agent@example.com',
  crypt('password123', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"]}',
  '{"org_id":"11111111-1111-1111-1111-111111111111"}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
);

-- Create auth identities
INSERT INTO auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) (
  SELECT
    uuid_generate_v4(),
    uuid_generate_v4(),
    id,
    format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
    'email',
    current_timestamp,
    current_timestamp,
    current_timestamp
  FROM auth.users
  WHERE email = 'agent@example.com'
);

--------------------------------------------------------------------------------
-- Test Organization
--------------------------------------------------------------------------------
INSERT INTO public.organizations (id, name, domain, timezone, settings, email_settings, branding)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Acme Corp',
  'acme.com',
  'America/New_York',
  jsonb_build_object(
    'workHours', jsonb_build_object(
      'start', '09:00',
      'end', '17:00',
      'timezone', 'America/New_York'
    )
  ),
  jsonb_build_object(
    'inboundDomain', 'support.acme.com',
    'outboundDomain', 'notifications.acme.com',
    'defaultFromName', 'Acme Support',
    'defaultFromEmail', 'support@acme.com'
  ),
  jsonb_build_object(
    'logo', 'https://placekitten.com/200/50',
    'primaryColor', '#4f46e5',
    'secondaryColor', '#818cf8'
  )
);

--------------------------------------------------------------------------------
-- Users (Support Team)
--------------------------------------------------------------------------------
-- Admin
INSERT INTO public.users (
  id, org_id, auth_user_id, name, role, is_admin, preferences
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'Jane Admin',
  'admin',
  true,
  '{}'
);

-- Support Agent 1
INSERT INTO public.users (
  id, org_id, auth_user_id, name, role, is_admin, preferences
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000002',
  'John Agent',
  'agent',
  false,
  '{}'
);

-- Support Agent 2
INSERT INTO public.users (
  id, org_id, auth_user_id, name, role, is_admin, preferences
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000003',
  'Sarah Support',
  'agent',
  false,
  '{}'
);

--------------------------------------------------------------------------------
-- Teams
--------------------------------------------------------------------------------
INSERT INTO public.teams (
  id, org_id, name, description, email_alias, routing_rules
) VALUES (
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'Technical Support',
  'Primary technical support team',
  'tech@support.acme.com',
  jsonb_build_object(
    'conditions', jsonb_build_array(
      jsonb_build_object(
        'field', 'subject',
        'operator', 'contains',
        'value', 'technical'
      )
    ),
    'priority', 'normal'
  )
);

-- Team Members
INSERT INTO public.team_members (team_id, user_id, role) VALUES
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'leader'),
('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'member');

--------------------------------------------------------------------------------
-- Contacts (Customers)
--------------------------------------------------------------------------------
INSERT INTO public.contacts (
  id, org_id, email, name, metadata
) VALUES (
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  'customer@example.com',
  'Bob Customer',
  jsonb_build_object(
    'company', 'Customer Corp',
    'phone', '+1-555-0123'
  )
);

--------------------------------------------------------------------------------
-- Tickets and Email Threads
--------------------------------------------------------------------------------

-- Ticket from email
INSERT INTO public.tickets (
  id, org_id, subject, status, priority, source,
  contact_id, assignee_id, team_id,
  email_metadata
) VALUES (
  '99999999-9999-9999-9999-999999999999',
  '11111111-1111-1111-1111-111111111111',
  'Need help with login',
  'open'::ticket_status,
  'normal'::ticket_priority,
  'email'::ticket_source,
  '66666666-6666-6666-6666-666666666666',
  '33333333-3333-3333-3333-333333333333',
  '55555555-5555-5555-5555-555555555555',
  jsonb_build_object(
    'from', 'customer@example.com',
    'to', 'support@acme.com',
    'cc', jsonb_build_array(),
    'bcc', jsonb_build_array()
  )
);

-- Email Thread
INSERT INTO public.email_threads (
  id, org_id, ticket_id, provider_thread_id, provider_message_ids, subject,
  from_email, to_email, last_message_at
) VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '11111111-1111-1111-1111-111111111111',
  '99999999-9999-9999-9999-999999999999',
  'thread_123456',
  ARRAY['msg_1', 'msg_2', 'msg_3'],
  'Need help with login',
  'customer@example.com',
  'support@acme.com',
  current_timestamp
);

-- Messages for the ticket
INSERT INTO public.messages (
  ticket_id, sender_type, sender_id, content, content_type, is_private
) VALUES
-- Customer message
(
  '99999999-9999-9999-9999-999999999999',
  'contact'::message_sender_type,
  '66666666-6666-6666-6666-666666666666',
  'Hi, I cannot log into my account. It says my password is incorrect but I am sure it is right.',
  'text'::message_content_type,
  false
),
-- Internal note
(
  '99999999-9999-9999-9999-999999999999',
  'user'::message_sender_type,
  '33333333-3333-3333-3333-333333333333',
  'Checked auth logs - no failed attempts found. Might be using wrong email.',
  'text'::message_content_type,
  true
),
-- Agent response
(
  '99999999-9999-9999-9999-999999999999',
  'user'::message_sender_type,
  '33333333-3333-3333-3333-333333333333',
  'Hello Bob, I''d be happy to help. Could you confirm which email address you''re using to log in?',
  'text'::message_content_type,
  false
);

--------------------------------------------------------------------------------
-- Tags
--------------------------------------------------------------------------------
INSERT INTO public.tags (
  id, org_id, name, color, description
) VALUES
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  'bug',
  '#ef4444',
  'Software bugs and technical issues'
),
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '11111111-1111-1111-1111-111111111111',
  'feature-request',
  '#3b82f6',
  'New feature suggestions and requests'
);

COMMIT; 