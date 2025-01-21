-- Seed Organizations
insert into organizations (id, name, domain) values
  ('11111111-1111-1111-1111-111111111111', 'Acme Corp', 'acme.com'),
  ('22222222-2222-2222-2222-222222222222', 'TechStart Inc', 'techstart.io');

-- Seed Teams
insert into teams (id, name, description, organization_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Customer Support', 'Front-line support team', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Technical Support', 'Advanced technical support', '11111111-1111-1111-1111-111111111111'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Support Team', 'Main support team', '22222222-2222-2222-2222-222222222222');

-- Seed Users
insert into users (id, email, full_name, role, organization_id, team_id) values
  -- Acme Corp Users
  ('00000000-0000-0000-0000-000000000001', 'admin@acme.com', 'John Admin', 'admin', '11111111-1111-1111-1111-111111111111', null),
  ('00000000-0000-0000-0000-000000000002', 'agent1@acme.com', 'Sarah Agent', 'agent', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('00000000-0000-0000-0000-000000000003', 'agent2@acme.com', 'Mike Support', 'agent', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('00000000-0000-0000-0000-000000000004', 'customer1@example.com', 'Alice Customer', 'customer', '11111111-1111-1111-1111-111111111111', null),
  ('00000000-0000-0000-0000-000000000005', 'customer2@example.com', 'Bob User', 'customer', '11111111-1111-1111-1111-111111111111', null),
  
  -- TechStart Users
  ('00000000-0000-0000-0000-000000000006', 'admin@techstart.io', 'Emma Admin', 'admin', '22222222-2222-2222-2222-222222222222', null),
  ('00000000-0000-0000-0000-000000000007', 'support@techstart.io', 'Tom Agent', 'agent', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  ('00000000-0000-0000-0000-000000000008', 'client@company.com', 'Charlie Client', 'customer', '22222222-2222-2222-2222-222222222222', null);

-- Seed Tickets
insert into tickets (title, description, status, priority, customer_id, assigned_to, team_id, organization_id) values
  -- Acme Corp Tickets
  ('Cannot login to dashboard', 'I am unable to access my dashboard since this morning', 'open', 'high',
   '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  
  ('Feature request: Dark mode', 'Would love to have a dark mode option', 'in_progress', 'low',
   '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111'),
  
  -- TechStart Tickets
  ('API Integration Issue', 'Getting 500 error when calling the /users endpoint', 'open', 'urgent',
   '00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000007', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222');

-- Seed Conversations
insert into conversations (ticket_id, user_id, message, is_internal) values
  -- Conversations for first ticket
  ((select id from tickets where title = 'Cannot login to dashboard'), '00000000-0000-0000-0000-000000000004',
   'I keep getting "Invalid credentials" error when trying to log in.', false),
  
  ((select id from tickets where title = 'Cannot login to dashboard'), '00000000-0000-0000-0000-000000000002',
   'Have you tried clearing your browser cache?', false),
  
  ((select id from tickets where title = 'Cannot login to dashboard'), '00000000-0000-0000-0000-000000000002',
   'Customer might need password reset - checking security logs', true),
  
  -- Conversations for API ticket
  ((select id from tickets where title = 'API Integration Issue'), '00000000-0000-0000-0000-000000000008',
   'The error started occurring after the latest deployment.', false),
  
  ((select id from tickets where title = 'API Integration Issue'), '00000000-0000-0000-0000-000000000007',
   'Investigating the logs now. Will update shortly.', false);

-- Seed Categories
insert into categories (name, description) values
  ('Getting Started', 'Basic guides and tutorials'),
  ('Troubleshooting', 'Common issues and solutions'),
  ('API Documentation', 'API reference and examples');

-- Seed Articles
insert into articles (title, content, author_id, status) values
  ('Welcome to Our Platform', 'This guide will help you get started...', '00000000-0000-0000-0000-000000000001', 'published'),
  ('Common Login Issues', 'Here are the most frequent login problems and solutions...', '00000000-0000-0000-0000-000000000002', 'published'),
  ('API Best Practices', 'Learn how to effectively use our API...', '00000000-0000-0000-0000-000000000003', 'draft');

-- Link articles to categories
insert into article_categories (article_id, category_id)
select a.id, c.id
from articles a, categories c
where a.title = 'Welcome to Our Platform' and c.name = 'Getting Started'; 