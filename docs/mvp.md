# CrabDesk MVP Roadmap

## Project Overview
- Tech Stack: Supabase, Next.js, TailwindCSS, Shadcn/UI
- Deployment: Amplify

## Phase 1: Foundation (Week 1-2)
### Setup & Infrastructure
- [X] Initialize Next.js 15 project with TypeScript
- [X] Set up TailwindCSS and Shadcn/UI
- [X] Configure Supabase project and database
- [X] Implement authentication system using Supabase Auth
- [ ] Set up CI/CD pipeline with Amplify (skipped for now)

### Authentication Routes
- [X] Implement `/login` with Supabase Auth
- [X] Create `/register` for organization signup
- [X] Build `/forgot-password` flow
- [X] Add `/reset-password` functionality
- [X] Set up `/verify-email` process

### Database Schema
- [X] Create initial schema for core tables:
  - tickets
  - users
  - organizations
  - conversations
  - teams
- [X] Set up database triggers and RLS policies
- [X] Create initial seed data for testing

## Phase 2: Core Ticket Management (Week 3-4)
### Ticket Routes Implementation
- [X] `/app/tickets` - List view with filters
  - Implement role-based views (agents see all tickets, customers see only their tickets)
  - Add filters for status, priority, assignee, and date range
  - Include quick actions (assign, change status) in list view
  - Show key metadata: status, priority, response time, SLA status

- [X] `/app/tickets/[id]` - Ticket detail view
  - Display full conversation thread with proper formatting
  - Show ticket metadata in sidebar (assignee, status, priority)
  - Include internal notes section visible only to agents
  - Real-time updates for new messages and status changes

- [X] `/app/tickets/new` - Ticket creation
  - Smart form with required fields based on user role
  - For customers: Simple form with title, description, priority
  - For agents: Additional fields for assignment, tags, internal notes
  - File attachment support with drag-and-drop (skip for now)
  - Template selection for common issues

- [X] `/app/tickets/[id]/edit` - Ticket editing
  - Allow agents to modify all ticket properties
  - Customers can only update title and description
  - Maintain edit history for auditing
  - Trigger notifications for significant changes

- [ ] `/app/tickets/[id]/history` - Ticket history
  - Chronological log of all ticket changes
  - Track status changes, assignments, and edits
  - Show who made each change and when
  - Filter history by change type

### Ticket Features
- [X] Implement ticket CRUD operations
  - Create tickets via UI and API
  - Update with proper validation and permissions
  - Soft delete to maintain history
  - Bulk operations for efficiency

- [X] Create conversation threading system
  - Support for HTML and markdown formatting
  - Thread messages with proper hierarchy
  - Handle email replies correctly
  - Support internal notes

- [X] Set up real-time updates using Supabase realtime
  - Instant updates for new messages
  - Live status and assignment changes
  - Typing indicators for active conversations
  - Presence indicators for viewing users

- [ ] Implement file upload system for attachments
  - Support common file types (images, docs, PDFs)
  - Size limits and security scanning
  - Preview for images and PDFs
  - Organized storage with proper naming

- [ ] Add ticket assignment functionality
  - Manual assignment by agents
  - Auto-assignment based on rules
  - Load balancing across team
  - Assignment notifications

- [ ] Create basic priority and status management
  - Define clear status workflow
  - Set priority levels with SLA targets
  - Allow status changes with comments
  - Trigger appropriate notifications

### Dashboard Routes
- [ ] `/app/dashboard` - Basic agent dashboard
  - Ticket queue display
    * Show assigned and unassigned tickets
    * Quick filters for urgent and overdue
    * Team workload overview
  - Basic performance metrics
    * Response time averages
    * Resolution rates
    * SLA compliance
  - Recent activity feed
    * New tickets and updates
    * Team member actions
    * System notifications

## Phase 3: User Management & Access Control (Week 5)
### User Routes
- [ ] `/app/profile` - User profile management
  - Personal information and preferences
  - Notification settings
  - Language and timezone
  - Activity history and statistics

- [ ] `/app/profile/settings` - User preferences
  - Email notification preferences
  - UI customization options
  - Default views and filters
  - Working hours and availability

- [ ] `/app/users` - Admin user listing (admin only)
  - User management with roles
  - Bulk actions for users
  - Filter by role, team, status
  - Performance metrics view

- [ ] `/app/users/[id]` - User detail view
  - Complete user information
  - Access control settings
  - Activity logs
  - Performance statistics

### Team Routes
- [ ] `/app/teams` - Team listing
  - Overview of all teams
  - Team metrics and performance
  - Member count and workload
  - Quick access to team settings

- [ ] `/app/teams/[id]` - Team details
  - Member management
  - Team performance metrics
  - Ticket queue overview
  - Team settings and rules

- [ ] `/app/teams/[id]/schedule` - Basic scheduling
  - Working hours setup
  - Vacation planning
  - Shift management
  - Coverage analysis

- [ ] Implement role-based access control
  - Define role permissions
  - Custom role creation
  - Permission inheritance
  - Access audit logs

- [ ] Set up team assignment rules
  - Round-robin assignment
  - Skills-based routing
  - Load balancing
  - Business hours handling

### Organization Routes
- [ ] `/app/organization` - Basic org management
  - Organization profile
  - Subscription status
  - Usage statistics
  - Member overview

- [ ] `/app/organization/settings` - Org settings
  - Branding customization
  - Default preferences
  - Security settings
  - Integration management

- [ ] `/app/organization/members` - Member management
  - Invite new members
  - Role assignment
  - Access control
  - Activity monitoring

## Phase 4: Essential Features (Week 6-7)
### Communication System
- [ ] Email notification integration
  - Configurable email templates
  - Smart notification batching
  - HTML and plain text support
  - Reply-to handling for conversations

- [ ] `/app/admin/templates` - Basic response templates
  - Template categories and tags
  - Variable substitution support
  - Markdown and HTML editing
  - Template usage analytics

- [ ] In-app notification center
  - Real-time notifications
  - Notification preferences
  - Mark as read/unread
  - Notification grouping

- [ ] Email-to-ticket processing
  - Automatic ticket creation from emails
  - Smart threading and conversation matching
  - Attachment handling
  - Spam filtering

- [ ] Basic SLA tracking implementation
  - Response time tracking
  - Resolution time monitoring
  - SLA breach notifications
  - Performance reporting

### Analytics Routes
- [ ] `/app/reports` - Basic reporting dashboard
  - Key performance indicators
  - Team and agent metrics
  - Ticket volume trends
  - Custom date ranges

- [ ] `/app/reports/tickets` - Ticket metrics
  - Resolution time analysis
  - Volume by category/priority
  - Customer satisfaction scores
  - Response time tracking

- [ ] `/app/reports/performance` - Agent performance
  - Individual metrics
  - Team comparisons
  - Workload distribution
  - Quality metrics

- [ ] Implement basic data export functionality
  - CSV and Excel exports
  - Scheduled reports
  - Custom field selection
  - Filtered data exports

### Knowledge Base Foundation
- [ ] `/app/kb` - Basic knowledge base home
  - Featured articles
  - Popular topics
  - Search functionality
  - Category navigation

- [ ] `/app/kb/articles` - Article listing
  - Category filters
  - Search and sort
  - Article status indicators
  - Quick edit access

- [ ] `/app/kb/articles/[id]` - Article view
  - Rich text content
  - Related articles
  - Feedback collection
  - Version history

- [ ] Basic article creation and editing
  - Markdown/rich text editor
  - Image and file embedding
  - Article templates
  - Preview functionality

## Phase 5: Polish & Launch Prep (Week 8)
### UI/UX Refinement
- [ ] Implement responsive layouts for all routes
  - Mobile-first approach
  - Tablet optimization
  - Desktop enhancements
  - Touch-friendly interactions

- [ ] Add loading states and error boundaries
  - Skeleton loaders
  - Error recovery options
  - Offline indicators
  - Progress feedback

- [ ] Enhance navigation with breadcrumbs
  - Context-aware navigation
  - History tracking
  - Quick navigation shortcuts
  - Section indicators

- [ ] Improve form validation and feedback
  - Real-time validation
  - Error messaging
  - Success confirmations
  - Field-level help

- [ ] Implement global search functionality
  - Cross-entity search
  - Quick results preview
  - Recent searches
  - Advanced filters

### Public Routes
- [ ] `/` - Basic landing page
  - Value proposition
  - Key features
  - Call-to-action
  - Customer testimonials

- [ ] `/docs` - Initial documentation
  - Getting started guide
  - API documentation
  - Best practices
  - Troubleshooting

- [ ] `/contact` - Contact form
  - Sales inquiries
  - Support requests
  - Partnership opportunities
  - Location information

- [ ] Error pages (404, 500)
  - User-friendly messaging
  - Navigation options
  - Error reporting
  - Support contact

### Launch Preparation
- [ ] Security audit of all routes
  - Authentication checks
  - Authorization rules
  - Data validation
  - XSS prevention

- [ ] Performance optimization
  - Code splitting
  - Asset optimization
  - Caching strategy
  - Database indexing

- [ ] Route-based analytics setup
  - Page view tracking
  - User journey analysis
  - Error monitoring
  - Performance metrics

- [ ] Monitoring and alerting setup
  - Error tracking
  - Performance monitoring
  - Usage alerts
  - Security notifications

- [ ] Deployment checklist and documentation
  - Deployment process
  - Rollback procedures
  - Monitoring setup
  - Maintenance guidelines

## MVP Success Criteria
### Functional Requirements
- Complete authentication flow works
- Core ticket management routes functional
- Basic user and team management operational
- Essential reporting routes available
- Public routes provide necessary information

### Performance Metrics
- Page load times under 3 seconds
- Real-time updates within 2 seconds
- 99.9% uptime for core functions
- Support for up to 100 concurrent users

### User Experience
- Consistent navigation across all routes
- Clear role-based access control
- Responsive design on all routes
- Efficient ticket management workflow

## Post-MVP Features (Backlog)
### Enhanced Routes
- `/app/admin/workflows` - Custom workflow builder
- `/app/admin/automations` - Automation rules
- `/app/kb/categories` - Knowledge base categories
- `/app/reports/custom` - Custom report builder
- `/app/admin/api` - API key management

### Advanced Features
- AI-powered ticket classification
- Advanced analytics and reporting
- Knowledge base integration
- Custom workflow builder
- API access for integrations
- Advanced SLA management
- Automated ticket routing
- Custom fields and forms
- Bulk actions and macros
- Advanced search capabilities 