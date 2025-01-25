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
  '00000000-0000-0000-0000-000000000002',  -- matches auth_user_id in internal_users
  'authenticated',
  'authenticated',
  'agent@example.com',
  crypt('password123', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"],"org_id":"11111111-1111-1111-1111-111111111111","org_roles":{"11111111-1111-1111-1111-111111111111":"internal_user"}}',
  '{}',
  current_timestamp,
  current_timestamp,
  '',
  '',
  '',
  ''
),
-- Customer
(
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000004',  -- matches auth_user_id in contacts
  'authenticated',
  'authenticated',
  'customer@example.com',
  crypt('password123', gen_salt('bf')),
  current_timestamp,
  current_timestamp,
  current_timestamp,
  '{"provider":"email","providers":["email"],"org_id":"11111111-1111-1111-1111-111111111111","org_roles":{"11111111-1111-1111-1111-111111111111":"portal_user"}}',
  '{}',
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
  WHERE email IN ('agent@example.com', 'customer@example.com')
);

--------------------------------------------------------------------------------
-- Test Organization
--------------------------------------------------------------------------------
INSERT INTO public.organizations (id, name, domain, timezone, settings, branding)
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
    'logo', 'https://placekitten.com/200/50',
    'primaryColor', '#4f46e5',
    'secondaryColor', '#818cf8'
  )
);

--------------------------------------------------------------------------------
-- Internal Users (Support Team)
--------------------------------------------------------------------------------
-- Admin
INSERT INTO public.internal_users (
  id, org_id, auth_user_id, name, is_admin, preferences
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001', -- This would be a real Supabase auth.users id
  'Jane Admin',
  true,
  '{}'
);

-- Support Agent 1
INSERT INTO public.internal_users (
  id, org_id, auth_user_id, name, is_admin, preferences
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000002',
  'John Agent',
  false,
  '{}'
);

-- Support Agent 2
INSERT INTO public.internal_users (
  id, org_id, auth_user_id, name, is_admin, preferences
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000003',
  'Sarah Support',
  false,
  '{}'
);

--------------------------------------------------------------------------------
-- Teams
--------------------------------------------------------------------------------
INSERT INTO public.teams (
  id, org_id, name, description, schedule
) VALUES (
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'Technical Support',
  'Primary technical support team',
  jsonb_build_object(
    'timezone', 'America/New_York',
    'shifts', jsonb_build_array(
      jsonb_build_object('start', '09:00', 'end', '17:00')
    )
  )
);

-- Team Members
INSERT INTO public.team_members (team_id, user_id, role) VALUES
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'leader'),
('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'member');

--------------------------------------------------------------------------------
-- Portal Users
--------------------------------------------------------------------------------
INSERT INTO public.portal_users (
  id, org_id, auth_user_id, preferences
) VALUES (
  '88888888-8888-8888-8888-888888888888',
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000004',
  jsonb_build_object(
    'notifications', jsonb_build_object(
      'email', true,
      'web', true
    )
  )
);

--------------------------------------------------------------------------------
-- Contacts (Customers)
--------------------------------------------------------------------------------
-- Regular contact (no portal account)
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

-- Contact with portal access
INSERT INTO public.contacts (
  id, org_id, email, name, portal_user_id, metadata
) VALUES (
  '77777777-7777-7777-7777-777777777777',
  '11111111-1111-1111-1111-111111111111',
  'alice@example.com',
  'Alice Portal',
  '88888888-8888-8888-8888-888888888888',
  jsonb_build_object(
    'company', 'Portal Inc',
    'phone', '+1-555-0124'
  )
);

--------------------------------------------------------------------------------
-- Tickets
--------------------------------------------------------------------------------
-- Ticket from regular contact
INSERT INTO public.tickets (
  id, org_id, subject, status, priority, source,
  contact_id, assignee_id, team_id, metadata
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
  '{}'
);

-- Messages for first ticket
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
  'internal_user'::message_sender_type,
  '33333333-3333-3333-3333-333333333333',
  'Checked auth logs - no failed attempts found. Might be using wrong email.',
  'text'::message_content_type,
  true
),
-- Agent response
(
  '99999999-9999-9999-9999-999999999999',
  'internal_user'::message_sender_type,
  '33333333-3333-3333-3333-333333333333',
  'Hello Bob, I''d be happy to help. Could you confirm which email address you''re using to log in?',
  'text'::message_content_type,
  false
);

-- Ticket from portal user
INSERT INTO public.tickets (
  id, org_id, subject, status, priority, source,
  contact_id, assignee_id, team_id, metadata
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Feature request: Dark mode',
  'pending'::ticket_status,
  'low'::ticket_priority,
  'portal'::ticket_source,
  '77777777-7777-7777-7777-777777777777',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  jsonb_build_object(
    'browser', 'Chrome 120',
    'os', 'Windows 11'
  )
);

-- Messages for second ticket
INSERT INTO public.messages (
  ticket_id, sender_type, sender_id, content, content_type, is_private
) VALUES
-- Portal user message
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'contact'::message_sender_type,
  '77777777-7777-7777-7777-777777777777',
  'Would it be possible to add a dark mode to the dashboard? It would be easier on the eyes when working late.',
  'text'::message_content_type,
  false
),
-- Internal note
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'internal_user'::message_sender_type,
  '44444444-4444-4444-4444-444444444444',
  'This is already on our roadmap for Q2. Will update the customer.',
  'text'::message_content_type,
  true
),
-- Agent response
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'internal_user'::message_sender_type,
  '44444444-4444-4444-4444-444444444444',
  'Hi Alice, thanks for the suggestion! We''re actually already working on a dark mode feature. We expect to release it in the next few months. I''ll update this ticket when we have more specific timing.',
  'text'::message_content_type,
  false
);

--------------------------------------------------------------------------------
-- Knowledge Base Articles
--------------------------------------------------------------------------------
INSERT INTO public.articles (
  id, org_id, title, slug, content, status,
  author_id, published_at
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  'Getting Started Guide',
  'getting-started',
  '# Getting Started\n\nWelcome to our platform! This guide will help you get up and running quickly...',
  'published'::article_status,
  '22222222-2222-2222-2222-222222222222',
  now()
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