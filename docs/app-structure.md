# App Structure

## Introduction

CrabDesk is a CRM system designed to help organizations manage their customer relationships through email-based ticketing. The system follows these core workflows:

1. Email Integration
   - Organizations connect their email system to CrabDesk
   - Incoming emails automatically create new tickets
   - Each unique email thread becomes a separate ticket
   - Customer contacts are automatically created and tracked by email

2. User Management
   - Users belong to organizations and handle tickets
   - A single auth user can be part of multiple organizations
   - Each organization has its own set of users with specific roles
   - Users can be organized into teams for better ticket routing

3. Ticket Workflow
   - Tickets are created from incoming emails
   - Assigned to teams or individual users
   - Users can collaborate on tickets
   - Responses are sent back through email

4. Contact Management
   - Contacts are automatically created from email senders
   - Contact profiles accumulate interaction history
   - All contact information is organization-specific

## Core Layout Components

### Root Layout (`/app/layout.tsx`)

- **Purpose**: Provides global app configuration and providers
- **Components**:
  - `AuthProvider`: Manages authentication state
  - `ThemeProvider`: Manages color scheme
  - `ToastProvider`: Global notifications
- **Data Dependencies**: None
- **User Flow**: Wraps all routes, handles auth redirects

### Dashboard Layout (`/app/dashboard/layout.tsx`)

- **Purpose**: Main authenticated app layout
- **Components**:
  - `MainNav`: Primary navigation
  - `UserNav`: Profile, settings, logout
  - `CommandMenu`: Global command palette
  - `OrganizationSwitcher`: For users in multiple orgs
- **Data Dependencies**:
  - Current user
  - Organization details
- **Layout**:
  - Fixed sidebar with nav
  - Top header with actions
  - Main content area

## Main Views

### Dashboard (`/app/dashboard/page.tsx`)

- **Purpose**: Role-based overview and quick actions
- **Components**:
  - `TicketMetrics`: Key ticket statistics
  - `RecentActivity`: Latest updates
  - `QuickActions`: Common tasks
- **Data Dependencies**:
  - Recent tickets
  - User's assignments
  - Team metrics
- **Interactions**:
  - Click to view full tickets
  - Quick status updates
  - Direct to relevant sections

### Ticket Queue (`/app/dashboard/tickets/page.tsx`)

- **Purpose**: Main ticket management interface
- **Components**:
  - `TicketFilters`: Status, priority, assignment filters
  - `TicketTable`: Main ticket list
  - `BulkActions`: Multi-ticket operations
- **Data Dependencies**:
  - Filtered tickets
  - Team assignments
  - Contact basic info
- **Interactions**:
  - Sort columns
  - Filter results
  - Select for bulk actions
  - Click to open ticket

### Active Ticket (`/app/dashboard/tickets/[id]/page.tsx`)

- **Purpose**: Single ticket management
- **Components**:
  - `MessageThread`: Conversation history
  - `TicketActions`: Status, assignment changes
  - `ContactSidebar`: Customer information
  - `InternalNotes`: Private team notes
- **Data Dependencies**:
  - Full ticket details
  - Message history
  - Contact details
  - Team member list
- **Interactions**:
  - Real-time messaging
  - Status updates
  - Assignment changes
  - Add internal notes

### Contact Management (`/app/dashboard/contacts/page.tsx`)

- **Purpose**: Customer contact management
- **Components**:
  - `ContactTable`: List of contacts
  - `ContactFilters`: Search and filter options
  - `ContactMetrics`: Activity overview
- **Data Dependencies**:
  - Contact list
  - Recent interactions
  - Ticket history
- **Interactions**:
  - Search contacts
  - View contact details
  - Update contact info

### Contact Details (`/app/dashboard/contacts/[id]/page.tsx`)

- **Purpose**: Detailed contact view
- **Components**:
  - `ContactProfile`: Basic information
  - `TicketHistory`: Past interactions
  - `ContactNotes`: Internal notes
  - `ContactActions`: Quick actions
- **Data Dependencies**:
  - Full contact details
  - Historical tickets
  - Contact preferences
- **Interactions**:
  - Edit contact info
  - View ticket history
  - Add notes
  - Create new ticket

### Team Management (`/app/dashboard/teams/page.tsx`)

- **Purpose**: Team organization and metrics
- **Components**:
  - `TeamList`: Overview of teams
  - `TeamMetrics`: Performance data
  - `MemberManagement`: Team composition
- **Data Dependencies**:
  - Team details
  - Member list
  - Performance stats
- **Interactions**:
  - Manage team members
  - View team metrics
  - Update team settings

## Shared Components

### Data Display

- `DataTable`: Reusable table with sorting/filtering
- `StatusBadge`: Visual status indicators
- `TimeAgo`: Relative time display
- `UserAvatar`: User profile pictures
- `Pagination`: Page navigation

### Forms and Inputs

- `ComboBox`: Enhanced select with search
- `TagInput`: Multiple tag selection
- `RichTextEditor`: Enhanced text input
- `SearchInput`: Global search component

### Dialogs and Modals

- `ConfirmDialog`: Action confirmation
- `FormDialog`: Reusable form modal
- `SlideOver`: Side panel for details

### Loading States

- `LoadingSpinner`: Loading indicator
- `SkeletonLoader`: Content placeholder
- `LoadingButton`: Action button states

## Core Workflows

### Email Processing (`/src/lib/email`)

- **Purpose**: Convert incoming emails to tickets and maintain email threads
- **Key Workflows**:
  1. Email to Ticket Creation:
     - Extract email metadata (from, subject, body, attachments)
     - Identify if part of existing ticket thread
     - Create new ticket or append to existing thread
     - Handle attachments via Supabase storage
  2. Ticket to Email Response:
     - Maintain email thread IDs and references
     - Format responses with correct threading headers
     - Include ticket reference in subject

### Ticket Assignment (`/src/lib/tickets`)

- **Purpose**: Efficiently distribute tickets to available agents
- **Key Workflows**:
  1. Load Balancing:
     - Track agent current ticket load
     - Consider agent working hours and availability
     - Factor in ticket priority and SLAs
  2. Skill-based Routing:
     - Match ticket tags/category with agent skills
     - Consider agent performance in similar tickets
     - Factor in language requirements

### Auto-categorization (`/src/lib/tickets`)

- **Purpose**: Automatically categorize and tag incoming tickets
- **Key Workflows**:
  1. Initial Classification:
     - Analyze ticket subject and content
     - Match against common patterns
     - Apply relevant tags and priority
  2. Learning from Actions:
     - Track manual tag changes by agents
     - Update classification patterns
     - Improve accuracy over time

## Initial Build Focus

For the MVP, we will focus on:

1. Core authentication and organization management
2. Email integration and ticket creation
3. Basic ticket management and responses
4. Essential contact tracking
5. Simple team organization

Later iterations will add:

- Advanced filtering and search
- Automation features
- Analytics and reporting
- SLA management
- API access
