# CrabDesk Route Structure

## Authentication Routes
```/auth```
- `/auth/signin` - Sign in page
- `/auth/signup` - Sign up page for new customers
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - Password reset page
- `/auth/verify` - Email verification

## Dashboard Routes
```/dashboard```
- `/dashboard` - Main dashboard view (role-specific)
  - Agent view: Ticket queue, performance metrics
  - Admin view: System overview, team performance
  - Customer view: Active tickets, knowledge base

## Ticket Management Routes
```/tickets```
- `/tickets` - Ticket list/queue view
- `/tickets/new` - Create new ticket
- `/tickets/[id]` - Individual ticket view
  - `/tickets/[id]/edit` - Edit ticket details
  - `/tickets/[id]/workflow` - Manage ticket workflow
  - `/tickets/[id]/conversations` - Ticket conversation thread
  - `/tickets/[id]/history` - Ticket audit trail

## Team Management Routes
```/teams```
- `/teams` - Team list view
- `/teams/new` - Create new team
- `/teams/[id]` - Team details and management
  - `/teams/[id]/members` - Team member management
  - `/teams/[id]/settings` - Team settings
  - `/teams/[id]/performance` - Team performance metrics

## Knowledge Base Routes
```/kb```
- `/kb` - Knowledge base home
- `/kb/articles` - Article list view
- `/kb/articles/new` - Create new article
- `/kb/articles/[id]` - Article view
  - `/kb/articles/[id]/edit` - Edit article
  - `/kb/articles/[id]/history` - Article revision history
- `/kb/categories` - Category management
- `/kb/search` - Knowledge base search

## Organization Routes
```/org```
- `/org` - Organization overview
- `/org/settings` - Organization settings
- `/org/members` - Organization member management
- `/org/billing` - Billing and subscription

## User Routes
```/users```
- `/users/profile` - User profile management
- `/users/settings` - User preferences
- `/users/notifications` - Notification settings

## Analytics Routes
```/analytics```
- `/analytics` - Analytics overview
- `/analytics/tickets` - Ticket analytics
- `/analytics/teams` - Team performance
- `/analytics/satisfaction` - Customer satisfaction metrics
- `/analytics/reports` - Custom reports

## API Routes (Server-Side)
```/api```
- `/api/tickets/*` - Ticket management endpoints
- `/api/users/*` - User management endpoints
- `/api/teams/*` - Team management endpoints
- `/api/kb/*` - Knowledge base endpoints
- `/api/analytics/*` - Analytics data endpoints
- `/api/webhooks/*` - Webhook endpoints

## System Routes
```/system```
- `/system/status` - System status page
- `/system/maintenance` - Maintenance information
- `/system/changelog` - System updates and changes

## File Structure Conventions
```
src/
  app/
    (auth)/
      auth/
        [...routes]
    (dashboard)/
      dashboard/
        [...routes]
    (tickets)/
      tickets/
        [id]/
          [...routes]
    (teams)/
      teams/
        [id]/
          [...routes]
    (kb)/
      kb/
        [...routes]
    (org)/
      org/
        [...routes]
    (users)/
      users/
        [...routes]
    (analytics)/
      analytics/
        [...routes]
    api/
      [...routes]
    system/
      [...routes]
```

## Route Groups and Layouts

### Authentication Group
- Shared authentication layout
- Public access
- Redirect authenticated users

### Dashboard Group
- Protected routes
- Role-based access control
- Persistent navigation

### Ticket Management Group
- Protected routes
- Real-time updates
- Conversation threading

### Team Management Group
- Admin/Manager access only
- Team-specific layouts
- Performance monitoring

### Knowledge Base Group
- Mixed access (public/private)
- Search-optimized routes
- Category-based navigation

### Organization Group
- Organization admin access
- Settings management
- Member controls

### Analytics Group
- Protected routes
- Data visualization layouts
- Export capabilities

## Route Protection and Middleware

### Authentication Middleware
- Session validation
- Role-based access control
- Organization context

### API Route Protection
- API key validation
- Rate limiting
- CORS policies

### Real-time Middleware
- WebSocket connections
- Presence tracking
- Event broadcasting 