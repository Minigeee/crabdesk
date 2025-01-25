# App Structure

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

## Customer Portal Components

### Portal Layout (`/app/portal/layout.tsx`)

- **Purpose**: Customer-facing interface
- **Components**:
  - `PortalNav`: Simplified navigation
  - `PortalHeader`: Branding and user menu
- **Data Dependencies**:
  - Portal user details
  - Organization branding
- **Layout**:
  - Minimal navigation
  - Focus on self-service

### Ticket Management (`/app/portal/tickets/page.tsx`)

- **Purpose**: Customer ticket interface
- **Components**:
  - `TicketList`: Customer's tickets
  - `NewTicketForm`: Create ticket
  - `TicketDetails`: View conversation
- **Data Dependencies**:
  - User's tickets
  - Support responses
- **Interactions**:
  - Create new tickets
  - View ticket status
  - Reply to support

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

1. Core authentication and layout
2. Basic ticket management
3. Essential contact handling
4. Simple team organization
5. Fundamental portal features

Later iterations will add:

- Advanced filtering and search
- Automation features
- Analytics and reporting
- Knowledge base integration
- API access management
