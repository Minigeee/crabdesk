# Data Model - Schema Ready

## Overview

CrabDesk is a CRM system designed for organizations to manage their customer interactions through email-based ticketing. The system allows organizations to connect their email systems, automatically creating tickets from incoming emails and tracking customer interactions through a unified interface.

## Core Concepts

- Each organization represents a company using CrabDesk for customer relationship management
- Users belong to organizations and handle tickets (one auth user can be part of multiple organizations)
- Contacts are automatically created and tracked by email address
- Tickets are created from email threads and managed by organization users
- Teams help organize users and manage ticket routing

## Custom Enum Types

### Ticket Related

- **ticket_status**: 'open', 'pending', 'resolved', 'closed'
- **ticket_priority**: 'low', 'normal', 'high', 'urgent'
- **ticket_source**: 'email', 'api'

### Message Related

- **message_sender_type**: 'contact', 'user', 'system'
- **message_content_type**: 'text', 'html', 'markdown'

### Audit Log Related

- **audit_log_action**: 'insert', 'update', 'delete', 'restore'

## Core Entities

### Organizations

**Purpose**: Represents companies using CrabDesk to manage their customer relationships and support operations.

**Description**: Organizations are the top-level entity in CrabDesk. Each organization connects their email system to CrabDesk and manages their customer interactions through the platform. They have their own set of users, contacts, teams, and configuration settings.

**Key Attributes**:

- id: uuid PRIMARY KEY
- name: varchar(255) NOT NULL
- domain: varchar(255) NOT NULL
- settings: jsonb DEFAULT '{}'
- timezone: varchar(50) NOT NULL DEFAULT 'UTC'
- email_settings: jsonb DEFAULT '{}'
- branding: jsonb DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()

**Relationships**: Has many users, contacts, teams, and tickets
**User Interaction**: Created/managed by system admins
**Constraints**:

- UNIQUE(domain)

**Indexes**:

- UNIQUE INDEX org_domain_idx ON organizations(domain)
- INDEX org_created_at_idx ON organizations(created_at)

**Security Policies**:

- READ: Users can read organizations they belong to
- INSERT: Only system admins can create organizations
- UPDATE: Organization admins can update their own organization
- DELETE: Only system admins can delete organizations

### Users

**Purpose**: Represents organization members who handle tickets and manage customer relationships.

**Description**: Users are organization members who handle tickets and interact with contacts. A single auth user can have multiple user profiles, one for each organization they belong to. This allows for organization-specific roles, preferences, and settings.

**Key Attributes**:

- id: uuid PRIMARY KEY
- org_id: uuid NOT NULL
- auth_user_id: uuid NOT NULL
- name: varchar(255) NOT NULL
- role: varchar(50) NOT NULL DEFAULT 'agent'
- is_admin: boolean NOT NULL DEFAULT false
- avatar_url: varchar(1024)
- preferences: jsonb DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()

**Relationships**:

- FOREIGN KEY (org_id) REFERENCES organizations(id)

**Constraints**:

- UNIQUE(org_id, auth_user_id)
- CHECK (role IN ('admin', 'agent', 'supervisor'))

**Indexes**:

- UNIQUE INDEX user_auth_idx ON users(org_id, auth_user_id)
- INDEX user_role_idx ON users(org_id, role)

**Security Policies**:

- READ: Users can read other users within their organization
- INSERT: Organization admins can create new users
- UPDATE: Users can update their own profile, admins can update any user in their org
- DELETE: Organization admins can delete users

### Contacts

**Purpose**: Represents customers who have interacted with the organization via email.

**Description**: Contacts are automatically created when new email threads are received. They are primarily identified by their email address and accumulate interaction history through tickets. Unlike the previous model, contacts don't have portal access as that feature is not implemented.

**Key Attributes**:

- id: uuid PRIMARY KEY
- org_id: uuid NOT NULL
- email: varchar(255) NOT NULL
- name: varchar(255)
- first_seen_at: timestamptz NOT NULL DEFAULT now()
- last_seen_at: timestamptz NOT NULL DEFAULT now()
- metadata: jsonb DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()

**Relationships**:

- FOREIGN KEY (org_id) REFERENCES organizations(id)

**Constraints**:

- UNIQUE(org_id, email)
- CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')

**Indexes**:

- UNIQUE INDEX contact_email_idx ON contacts(org_id, email)
- INDEX contact_seen_idx ON contacts(org_id, last_seen_at)

**Security Policies**:

- READ: Users can read contacts in their organization
- INSERT: System can create contacts from incoming emails
- UPDATE: Users can update contacts in their organization
- DELETE: Organization admins can delete contacts

### Teams

**Purpose**: Organizes users into functional groups for ticket routing and management.

**Description**: Teams help organize users within an organization for better ticket management. They can be used for different departments (sales, support) or specialties (technical, billing). Teams are crucial for ticket routing and workload distribution.

**Key Attributes**:

- id: uuid PRIMARY KEY
- org_id: uuid NOT NULL
- name: varchar(255) NOT NULL
- description: text
- email_alias: varchar(255)
- routing_rules: jsonb DEFAULT '{}'
- settings: jsonb DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()

**Relationships**:

- FOREIGN KEY (org_id) REFERENCES organizations(id)

**Constraints**:

- UNIQUE(org_id, name)
- UNIQUE(org_id, email_alias)

**Indexes**:

- UNIQUE INDEX team_name_idx ON teams(org_id, name)
- UNIQUE INDEX team_email_idx ON teams(org_id, email_alias)

**Security Policies**:

- READ: All users can read teams in their organization
- INSERT: Organization admins can create teams
- UPDATE: Team leaders and org admins can update team details
- DELETE: Organization admins can delete teams

### Team Members

**Purpose**: Links users to teams with specific roles.

**Description**: Manages team membership and roles. Users can belong to multiple teams, and their role within each team can affect their permissions and responsibilities for team-specific tickets.

**Key Attributes**:

- team_id: uuid NOT NULL
- user_id: uuid NOT NULL
- role: varchar(50) DEFAULT 'member'
- created_at: timestamptz NOT NULL DEFAULT now()

**Relationships**:

- FOREIGN KEY (team_id) REFERENCES teams(id)
- FOREIGN KEY (user_id) REFERENCES users(id)

**Constraints**:

- PRIMARY KEY (team_id, user_id)
- CHECK (role IN ('leader', 'member'))

**Security Policies**:

- READ: All users can read team memberships in their org
- INSERT: Team leaders and org admins can add members
- UPDATE: Team leaders and org admins can modify roles
- DELETE: Team leaders and org admins can remove members

### Tickets

**Purpose**: Tracks customer interactions through email threads.

**Description**: Tickets are created automatically from incoming emails and represent ongoing conversations with contacts. Each new email thread creates a new ticket, maintaining a clean separation between different conversation threads while preserving the relationship to the contact.

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
- metadata: jsonb NOT NULL DEFAULT '{}'
- email_metadata: jsonb NOT NULL DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()
- resolved_at: timestamptz

**Relationships**:

- FOREIGN KEY (org_id) REFERENCES organizations(id)
- FOREIGN KEY (contact_id) REFERENCES contacts(id)
- FOREIGN KEY (assignee_id) REFERENCES users(id)
- FOREIGN KEY (team_id) REFERENCES teams(id)

**Constraints**:

- UNIQUE(org_id, number)

**Indexes**:

- UNIQUE INDEX ticket_number_idx ON tickets(org_id, number)
- INDEX ticket_status_idx ON tickets(org_id, status, created_at)
- INDEX ticket_contact_idx ON tickets(contact_id, created_at)
- INDEX ticket_assignee_idx ON tickets(assignee_id, status)
- INDEX ticket_team_idx ON tickets(team_id, status)

**Security Policies**:

- READ: Users can read tickets in their org, assigned to them, or their team
- INSERT: System creates tickets from incoming emails
- UPDATE: Assignee, team members, and admins can update tickets
- DELETE: Organization admins can delete tickets

### Email Threads

**Purpose**: Tracks email conversations linked to tickets.

**Description**: Maintains the relationship between email threads and tickets, storing only the necessary metadata to link with the email service provider's storage. This allows for efficient email thread tracking without storing the actual email content in the database.

**Key Attributes**:

- id: uuid PRIMARY KEY
- org_id: uuid NOT NULL
- ticket_id: uuid NOT NULL
- provider_thread_id: varchar(255) NOT NULL
- provider_message_ids: text[] NOT NULL
- from_email: varchar(255) NOT NULL
- to_email: varchar(255) NOT NULL
- subject: varchar(255) NOT NULL
- last_message_at: timestamptz NOT NULL
- in_reply_to: varchar(255)
- message_id: varchar(255)
- references: text[]
- headers: jsonb DEFAULT '{}'
- raw_payload: jsonb DEFAULT '{}'
- metadata: jsonb DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()

**Relationships**:

- FOREIGN KEY (org_id) REFERENCES organizations(id)
- FOREIGN KEY (ticket_id) REFERENCES tickets(id)

**Constraints**:

- UNIQUE(org_id, provider_thread_id)

**Indexes**:

- UNIQUE INDEX email_thread_provider_idx ON email_threads(org_id, provider_thread_id)
- INDEX email_thread_ticket_idx ON email_threads(ticket_id)
- INDEX email_thread_updated_idx ON email_threads(org_id, last_message_at)
- INDEX idx_email_threads_message_id ON email_threads(message_id)
- INDEX idx_email_threads_in_reply_to ON email_threads(in_reply_to)

**Security Policies**:

- READ: Users can read email threads in their organization
- INSERT: System creates email thread records
- UPDATE: System updates email thread metadata
- DELETE: Organization admins can delete email threads

### Messages

**Purpose**: Enables real-time messaging and internal communication within tickets.

**Description**: Supports team collaboration through real-time messages and internal notes. Messages are always associated with a ticket and can be either internal team discussions or public responses to contacts. The actual email communication is handled separately through the email_threads system.

**Key Attributes**:

- id: uuid PRIMARY KEY
- ticket_id: uuid NOT NULL
- sender_type: message_sender_type NOT NULL
- sender_id: uuid NOT NULL
- content: text NOT NULL
- is_private: boolean DEFAULT false
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()

**Relationships**:

- FOREIGN KEY (ticket_id) REFERENCES tickets(id)

**Indexes**:

- INDEX message_ticket_idx ON messages(ticket_id, created_at)
- INDEX message_sender_idx ON messages(sender_type, sender_id)
- INDEX message_private_idx ON messages(ticket_id, is_private)

**Security Policies**:

- READ: Users can read messages in their organization
- INSERT: Users can create messages for accessible tickets
- UPDATE: Message creators can update their messages within a time window
- DELETE: Not allowed (audit requirements)

## Supporting Entities

### Skills

**Purpose**: Defines user capabilities for intelligent ticket routing.

**Description**: Skills represent different capabilities that users may have, such as product knowledge, language proficiency, or technical expertise. These are used for intelligent ticket routing and team organization.

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

**Security Policies**:

- READ: All users can read skills
- INSERT: Organization admins can create skills
- UPDATE: Organization admins can update skills
- DELETE: Organization admins can delete unused skills

### Tags

**Purpose**: Flexible categorization system for tickets.

**Description**: Tags provide a flexible way to categorize tickets for reporting, routing, and organization. They can be applied manually by users or automatically through rules based on ticket content or metadata.

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

**Security Policies**:

- READ: All users can read tags
- INSERT: Users can create tags
- UPDATE: Users can update tags
- DELETE: Organization admins can delete unused tags

### Attachments

**Purpose**: Stores file metadata for email attachments.

**Description**: Manages files attached to emails and messages. Files are stored in Supabase storage, while this table maintains the metadata and relationships to tickets and messages.

**Key Attributes**:

- id: uuid PRIMARY KEY
- org_id: uuid NOT NULL
- ticket_id: uuid NOT NULL
- message_id: uuid NOT NULL
- bucket: varchar(255) NOT NULL
- path: varchar(1024) NOT NULL
- filename: varchar(255) NOT NULL
- size: bigint NOT NULL
- mime_type: varchar(255) NOT NULL
- metadata: jsonb DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()

**Relationships**:

- FOREIGN KEY (org_id) REFERENCES organizations(id)
- FOREIGN KEY (ticket_id) REFERENCES tickets(id)
- FOREIGN KEY (message_id) REFERENCES messages(id)

**Constraints**:

- CHECK (size > 0)

**Indexes**:

- INDEX attachment_org_idx ON attachments(org_id, created_at)
- INDEX attachment_ticket_idx ON attachments(ticket_id, created_at)
- UNIQUE INDEX attachment_path_idx ON attachments(bucket, path)

**Security Policies**:

- READ: Users can read attachments in their organization
- INSERT: System creates attachment records from emails
- UPDATE: No updates allowed after creation
- DELETE: Organization admins can delete attachments

### Audit Logs

**Purpose**: Tracks system changes for compliance and debugging.

**Description**: Maintains a comprehensive audit trail of all significant changes in the system. This is crucial for security, compliance, and debugging purposes. Each log entry captures the what, who, and when of changes.

**Key Attributes**:

- id: uuid PRIMARY KEY
- org_id: uuid NOT NULL
- action: audit_log_action NOT NULL
- entity_type: varchar(50) NOT NULL
- entity_id: uuid NOT NULL
- actor_id: uuid
- changes: jsonb NOT NULL
- created_at: timestamptz NOT NULL DEFAULT now()

**Relationships**:

- FOREIGN KEY (org_id) REFERENCES organizations(id)
- FOREIGN KEY (actor_id) REFERENCES users(id)

**Indexes**:

- INDEX audit_org_idx ON audit_logs(org_id, created_at)
- INDEX audit_entity_idx ON audit_logs(entity_type, entity_id)

**Security Policies**:

- READ: Users can read audit logs in their organization
- INSERT: System automatically creates audit logs
- UPDATE: No updates allowed
- DELETE: No deletion allowed

### Email Messages

**Purpose**: Stores the complete content and metadata of individual email messages.

**Description**: Maintains a comprehensive record of all email communications, storing both content and metadata for each message within an email thread. This enables complete email history tracking, proper threading, and rich content display while maintaining provider independence.

**Key Attributes**:

- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- thread_id: uuid NOT NULL
- message_id: varchar(255) NOT NULL
- in_reply_to: varchar(255)
- reference_ids: text[]
- from_email: varchar(255) NOT NULL
- from_name: varchar(255)
- to_emails: text[] NOT NULL
- cc_emails: text[]
- bcc_emails: text[]
- subject: varchar(255) NOT NULL
- text_body: text
- html_body: text
- headers: jsonb NOT NULL DEFAULT '{}'
- metadata: jsonb NOT NULL DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()
- content_embedding: vector

**Relationships**:

- FOREIGN KEY (thread_id) REFERENCES email_threads(id)

**Constraints**:

- UNIQUE(thread_id, message_id)

**Indexes**:

- UNIQUE INDEX email_message_id_idx ON email_messages(thread_id, message_id)
- INDEX email_message_created_idx ON email_messages(thread_id, created_at)

**Security Policies**:

- READ: Users can read email messages in their organization
- INSERT: System creates message records from incoming emails
- UPDATE: No updates allowed after creation
- DELETE: Organization admins can delete email messages

### Notes

**Purpose**: Enables adding plain text notes to various entities (contacts, tickets, etc.).

**Description**: A flexible notes system that allows users to attach plain text notes to different entities within the system. Each note tracks its author and target entity, making it easy to maintain a history of manual annotations across the system.

**Key Attributes**:

- id: uuid PRIMARY KEY
- org_id: uuid NOT NULL
- entity_type: varchar(50) NOT NULL
- entity_id: uuid NOT NULL
- content: text NOT NULL
- author_id: uuid
- managed: boolean NOT NULL DEFAULT false
- metadata: jsonb NOT NULL DEFAULT '{}'
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()
- content_embedding: vector

**Relationships**:

- FOREIGN KEY (org_id) REFERENCES organizations(id)
- FOREIGN KEY (author_id) REFERENCES users(id)

**Constraints**:

- CHECK (entity_type IN ('contact', 'ticket'))

**Indexes**:

- INDEX notes_entity_idx ON notes(org_id, entity_type, entity_id)
- INDEX notes_author_idx ON notes(author_id, created_at)

**Security Policies**:

- READ: Users can read notes in their organization
- INSERT: Users can create notes for entities they can access
- UPDATE: Note authors can update their notes within a time window
- DELETE: Note authors and org admins can delete notes

## Notes

- All UUIDs should be generated using gen_random_uuid()
- All timestamps should use timestamptz for timezone awareness
- JSON fields use jsonb for better performance and indexing
- Consider implementing row level security (RLS) policies
- Implement triggers for updated_at timestamps
- Consider partitioning for audit_logs and messages tables
- Implement soft deletes via deleted_at timestamp where appropriate

## RLS Implementation Notes

1. All tables should enable RLS with `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Most policies will use `current_org_id()` for organization isolation
3. Additional checks will use auth.uid() for user-specific policies
4. Complex policies (like team-based access) will use custom security functions
5. All policies should be thoroughly tested with different user roles
6. Consider performance impact of complex policies
7. Maintain audit logs for security-relevant operations
