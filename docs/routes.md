# CrabDesk Route Structure

## Authentication Routes
- `/login` - Login page
- `/register` - Registration page for new organizations
- `/forgot-password` - Password recovery
- `/reset-password` - Password reset
- `/verify-email` - Email verification

## Public Routes
- `/` - Landing page
- `/pricing` - Pricing information
- `/docs` - Public documentation
- `/contact` - Contact form
- `/blog` - Company blog and updates

## Application Routes (`/app/*)

### Dashboard Routes
- `/app/dashboard` - Role-based dashboard (different views for admin/agent/customer)
  - Admin: System overview, team performance, organization metrics
  - Agent: Ticket queue, personal performance, team status
  - Customer: Active tickets, knowledge base suggestions

### Ticket Management
- `/app/tickets` - Ticket listing with filters and search
- `/app/tickets/new` - Create new ticket
- `/app/tickets/[id]` - Ticket details and conversation
- `/app/tickets/[id]/edit` - Edit ticket details
- `/app/tickets/[id]/history` - Ticket history and audit log
- `/app/tickets/drafts` - Saved ticket drafts

### Knowledge Base
- `/app/kb` - Knowledge base home
- `/app/kb/articles` - Article listing
- `/app/kb/articles/[id]` - Article view
- `/app/kb/articles/new` - Create new article (admin/agent only)
- `/app/kb/articles/[id]/edit` - Edit article (admin/agent only)
- `/app/kb/categories` - Category management (admin only)
- `/app/kb/search` - Advanced knowledge base search

### Team Management (Admin/Agent)
- `/app/teams` - Team listing
- `/app/teams/[id]` - Team details and members
- `/app/teams/[id]/schedule` - Team schedule management
- `/app/teams/[id]/performance` - Team performance metrics

### User Management
- `/app/users` - User listing (admin only)
- `/app/users/[id]` - User profile
- `/app/users/[id]/edit` - Edit user (admin only)
- `/app/profile` - Current user profile
- `/app/profile/settings` - User settings and preferences

### Organization Management (Admin)
- `/app/organization` - Organization overview
- `/app/organization/settings` - Organization settings
- `/app/organization/billing` - Billing and subscription
- `/app/organization/audit-log` - Security and activity logs
- `/app/organization/integrations` - Third-party integrations

### Reports and Analytics (Admin/Agent)
- `/app/reports` - Reports dashboard
- `/app/reports/tickets` - Ticket analytics
- `/app/reports/performance` - Performance metrics
- `/app/reports/satisfaction` - Customer satisfaction
- `/app/reports/custom` - Custom report builder
- `/app/reports/export` - Data export tools

### System Administration (Admin)
- `/app/admin/settings` - System settings
- `/app/admin/roles` - Role management
- `/app/admin/workflows` - Workflow configuration
- `/app/admin/templates` - Response templates
- `/app/admin/automations` - Automation rules
- `/app/admin/api` - API keys and documentation

## Access Control

### Admin Access
- Full access to all routes
- System configuration and management
- Organization-wide settings and reports

### Agent Access
- Limited to operational routes:
  - Dashboard
  - Ticket management
  - Knowledge base (read/write)
  - Team management (view only)
  - Reports (operational level)
  - Personal profile and settings

### Customer Access
- Limited to customer-facing routes:
  - Dashboard (customer view)
  - Ticket creation and management
  - Knowledge base (read only)
  - Personal profile and settings

## Route Metadata
Each route should include:
- Required authentication
- Role-based access control
- Breadcrumb information
- Default layout
- SEO metadata 