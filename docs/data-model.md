# Data Model - Schema Ready

## Core Entities

### Organizations
**Purpose**: Represents companies using CrabDesk to provide support to their customers.
**Key Attributes**:
- id: uuid PRIMARY KEY
- name: varchar(255) NOT NULL
- domain: varchar(255) NOT NULL
- settings: jsonb DEFAULT '{}'
- timezone: varchar(50) NOT NULL DEFAULT 'UTC'
- branding: jsonb DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()
**Relationships**: Has many internal users, contacts, teams, tickets, and knowledge base articles
**User Interaction**: Created/managed by system admins
**Constraints**: 
- UNIQUE(domain)
**Indexes**: 
- UNIQUE INDEX org_domain_idx ON organizations(domain)
- INDEX org_created_at_idx ON organizations(created_at)

### Auth Users
**Purpose**: Represents authenticated users in the system (Supabase auth)
**Notes**: This is handled by Supabase auth (auth.users table), referenced by auth_user_id in our tables

### Internal Users
**Purpose**: Represents support agents, admins, and other staff members
**Key Attributes**:
- id: uuid PRIMARY KEY
- org_id: uuid NOT NULL
- auth_user_id: uuid NOT NULL
- name: varchar(255) NOT NULL
- is_admin: boolean NOT NULL DEFAULT false
- avatar_url: varchar(1024)
- preferences: jsonb DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()
**Relationships**: 
- FOREIGN KEY (org_id) REFERENCES organizations(id)
- FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) (don't add this constraint)
**User Interaction**: Managed by org admins
**Constraints**: 
- UNIQUE(org_id, auth_user_id)
**Indexes**: 
- INDEX internal_user_org_idx ON internal_users(org_id)
- UNIQUE INDEX internal_user_auth_idx ON internal_users(org_id, auth_user_id)
- INDEX internal_user_admin_idx ON internal_users(org_id, is_admin)

### Contacts
**Purpose**: Represents any customer who has contacted support
**Key Attributes**:
- id: uuid PRIMARY KEY
- org_id: uuid NOT NULL
- email: varchar(255) NOT NULL
- name: varchar(255)
- portal_user_id: uuid
- first_seen_at: timestamptz NOT NULL DEFAULT now()
- last_seen_at: timestamptz NOT NULL DEFAULT now()
- metadata: jsonb DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()
**Relationships**: 
- FOREIGN KEY (org_id) REFERENCES organizations(id)
- FOREIGN KEY (portal_user_id) REFERENCES portal_users(id)
**User Interaction**: Created automatically from support requests
**Constraints**: 
- UNIQUE(org_id, email)
- CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
**Indexes**: 
- UNIQUE INDEX contact_email_idx ON contacts(org_id, email)
- INDEX contact_portal_idx ON contacts(portal_user_id) WHERE portal_user_id IS NOT NULL
- INDEX contact_seen_idx ON contacts(org_id, last_seen_at)

### Portal Users
**Purpose**: Organization-specific customer portal access
**Key Attributes**:
- id: uuid PRIMARY KEY
- org_id: uuid NOT NULL
- auth_user_id: uuid NOT NULL
- preferences: jsonb DEFAULT '{}'
- notification_settings: jsonb DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()
**Relationships**: 
- FOREIGN KEY (org_id) REFERENCES organizations(id)
- FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
**Constraints**: 
- UNIQUE(org_id, auth_user_id)
**Indexes**: 
- UNIQUE INDEX portal_user_auth_idx ON portal_users(org_id, auth_user_id)

### Teams
**Purpose**: Organizes support agents into functional groups
**Key Attributes**:
- id: uuid PRIMARY KEY
- org_id: uuid NOT NULL
- name: varchar(255) NOT NULL
- description: text
- schedule: jsonb DEFAULT '{}'
- settings: jsonb DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()
**Relationships**: 
- FOREIGN KEY (org_id) REFERENCES organizations(id)
**Constraints**: 
- UNIQUE(org_id, name)
**Indexes**: 
- UNIQUE INDEX team_name_idx ON teams(org_id, name)

### Team Members
**Purpose**: Links internal users to teams
**Key Attributes**:
- team_id: uuid NOT NULL
- user_id: uuid NOT NULL
- role: varchar(50) DEFAULT 'member'
- created_at: timestamptz NOT NULL DEFAULT now()
**Relationships**: 
- FOREIGN KEY (team_id) REFERENCES teams(id)
- FOREIGN KEY (user_id) REFERENCES internal_users(id)
**Constraints**: 
- PRIMARY KEY (team_id, user_id)
- CHECK (role IN ('leader', 'member'))

### Tickets
**Purpose**: Tracks customer support requests
**Key Attributes**:
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- org_id: uuid NOT NULL
- number: bigint NOT NULL GENERATED ALWAYS AS IDENTITY
- subject: varchar(255) NOT NULL
- status: ticket_status NOT NULL DEFAULT 'open'
- priority: ticket_priority NOT NULL DEFAULT 'normal'
- source: ticket_source NOT NULL
- contact_id: uuid NOT NULL
- assignee_id: uuid
- team_id: uuid
- metadata: jsonb DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()
- resolved_at: timestamptz
**Relationships**: 
- FOREIGN KEY (org_id) REFERENCES organizations(id)
- FOREIGN KEY (contact_id) REFERENCES contacts(id)
- FOREIGN KEY (assignee_id) REFERENCES internal_users(id)
- FOREIGN KEY (team_id) REFERENCES teams(id)
**Constraints**: 
- UNIQUE(org_id, number)
- CHECK (status IN ('open', 'pending', 'resolved', 'closed'))
- CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
- CHECK (source IN ('email', 'chat', 'portal', 'api'))
**Indexes**: 
- UNIQUE INDEX ticket_number_idx ON tickets(org_id, number)
- INDEX ticket_status_idx ON tickets(org_id, status, created_at)
- INDEX ticket_contact_idx ON tickets(contact_id, created_at)
- INDEX ticket_assignee_idx ON tickets(assignee_id, status)
- INDEX ticket_team_idx ON tickets(team_id, status)

### Messages
**Purpose**: Records all communication within tickets
**Key Attributes**:
- id: uuid PRIMARY KEY
- ticket_id: uuid NOT NULL
- sender_type: varchar(20) NOT NULL
- sender_id: uuid NOT NULL
- content: text NOT NULL
- content_type: varchar(50) DEFAULT 'text'
- is_private: boolean DEFAULT false
- metadata: jsonb DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()
**Relationships**: 
- FOREIGN KEY (ticket_id) REFERENCES tickets(id)
**Constraints**: 
- CHECK (sender_type IN ('contact', 'internal_user', 'system'))
- CHECK (content_type IN ('text', 'html', 'markdown'))
**Indexes**: 
- INDEX message_ticket_idx ON messages(ticket_id, created_at)
- INDEX message_sender_idx ON messages(sender_type, sender_id)

### Knowledge Base Articles
**Purpose**: Self-service help documentation
**Key Attributes**:
- id: uuid PRIMARY KEY
- org_id: uuid NOT NULL
- title: varchar(255) NOT NULL
- slug: varchar(255) NOT NULL
- content: text NOT NULL
- status: article_status NOT NULL DEFAULT 'draft'
- version: integer NOT NULL DEFAULT 1
- locale: varchar(10) NOT NULL DEFAULT 'en'
- seo_metadata: jsonb DEFAULT '{}'
- author_id: uuid NOT NULL
- published_at: timestamptz
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()
**Relationships**: 
- FOREIGN KEY (org_id) REFERENCES organizations(id)
- FOREIGN KEY (author_id) REFERENCES internal_users(id)
**Constraints**: 
- UNIQUE(org_id, slug, locale)
- CHECK (status IN ('draft', 'published', 'archived'))
- CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$')
**Indexes**: 
- UNIQUE INDEX article_slug_idx ON articles(org_id, slug, locale)
- INDEX article_status_idx ON articles(org_id, status, updated_at)

## Supporting Entities

### Skills
**Purpose**: Defines agent and team capabilities
**Key Attributes**:
- id: uuid PRIMARY KEY
- org_id: uuid NOT NULL
- name: varchar(255) NOT NULL
- description: text
- level: integer DEFAULT 1
- created_at: timestamptz NOT NULL DEFAULT now()
**Relationships**: 
- FOREIGN KEY (org_id) REFERENCES organizations(id)
**Constraints**: 
- UNIQUE(org_id, name)
- CHECK (level BETWEEN 1 AND 5)
**Indexes**: 
- UNIQUE INDEX skill_name_idx ON skills(org_id, name)

### Tags
**Purpose**: Categorization system
**Key Attributes**:
- id: uuid PRIMARY KEY
- org_id: uuid NOT NULL
- name: varchar(255) NOT NULL
- color: varchar(7) DEFAULT '#808080'
- description: text
- created_at: timestamptz NOT NULL DEFAULT now()
**Relationships**: 
- FOREIGN KEY (org_id) REFERENCES organizations(id)
**Constraints**: 
- UNIQUE(org_id, name)
- CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
**Indexes**: 
- UNIQUE INDEX tag_name_idx ON tags(org_id, name)

### Attachments
**Purpose**: Stores file metadata
**Key Attributes**:
- id: uuid PRIMARY KEY
- org_id: uuid NOT NULL
- bucket: varchar(255) NOT NULL
- path: varchar(1024) NOT NULL
- filename: varchar(255) NOT NULL
- size: bigint NOT NULL
- mime_type: varchar(255) NOT NULL
- metadata: jsonb DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()
**Relationships**: 
- FOREIGN KEY (org_id) REFERENCES organizations(id)
**Constraints**: 
- CHECK (size > 0)
**Indexes**: 
- INDEX attachment_org_idx ON attachments(org_id, created_at)
- UNIQUE INDEX attachment_path_idx ON attachments(bucket, path)

### Audit Logs
**Purpose**: Tracks system changes
**Key Attributes**:
- id: uuid PRIMARY KEY
- org_id: uuid NOT NULL
- action: varchar(50) NOT NULL
- entity_type: varchar(50) NOT NULL
- entity_id: uuid NOT NULL
- actor_id: uuid NOT NULL
- changes: jsonb NOT NULL
- created_at: timestamptz NOT NULL DEFAULT now()
**Relationships**: 
- FOREIGN KEY (org_id) REFERENCES organizations(id)
- FOREIGN KEY (actor_id) REFERENCES internal_users(id)
**Constraints**: 
- CHECK (action IN ('create', 'update', 'delete', 'restore'))
**Indexes**: 
- INDEX audit_org_idx ON audit_logs(org_id, created_at)
- INDEX audit_entity_idx ON audit_logs(entity_type, entity_id)

## Notes
- All UUIDs should be generated using gen_random_uuid()
- All timestamps should use timestamptz for timezone awareness
- JSON fields use jsonb for better performance and indexing
- Consider implementing row level security (RLS) policies
- Implement triggers for updated_at timestamps
- Consider partitioning for audit_logs and messages tables
- Implement soft deletes via deleted_at timestamp where appropriate 