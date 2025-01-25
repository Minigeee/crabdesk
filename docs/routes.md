# Route Structure

## Public Routes

- `/` - Landing page
- `/auth/login` - Login page
- `/auth/signup` - Signup page
- `/auth/forgot-password` - Password reset
- `/help` - Public help center
  - `/help/articles/[slug]` - Public article view
  - `/help/categories/[slug]` - Category listing
  - `/help/search` - Search results

## App Routes

All authenticated routes are under `/app` with shared layout

### Support Agent Workspace

- `/app/dashboard` - Agent dashboard
- `/app/tickets` - Ticket queue
  - `/app/tickets/new` - Create ticket
  - `/app/tickets/[id]` - View ticket
    - `/app/tickets/[id]/edit` - Edit ticket
    - `/app/tickets/[id]/history` - Ticket history
  - `/app/tickets/saved` - Saved ticket views
  - `/app/tickets/assigned` - Assigned tickets
  - `/app/tickets/unassigned` - Unassigned queue

### Knowledge Base Management

- `/app/kb` - Knowledge base dashboard
  - `/app/kb/articles` - Article listing
    - `/app/kb/articles/new` - Create article
    - `/app/kb/articles/[id]` - Edit article
    - `/app/kb/articles/[id]/history` - Article history
  - `/app/kb/categories` - Category management
  - `/app/kb/drafts` - Draft articles
  - `/app/kb/analytics` - Content analytics

### Customer Portal (for logged-in customers)

- `/app/portal` - Customer portal home
  - `/app/portal/tickets` - Customer's tickets
    - `/app/portal/tickets/new` - Submit ticket
    - `/app/portal/tickets/[id]` - View ticket
  - `/app/portal/organizations` - Organization management
    - `/app/portal/organizations/[id]` - Organization details
    - `/app/portal/organizations/[id]/members` - Member management

### Management Interface

- `/app/manage` - Management dashboard
  - `/app/manage/team` - Team overview
    - `/app/manage/team/members` - Team member management
    - `/app/manage/team/roles` - Role management
    - `/app/manage/team/schedules` - Schedule management
  - `/app/manage/analytics` - Analytics center
    - `/app/manage/analytics/reports` - Report builder
    - `/app/manage/analytics/dashboards` - Dashboard builder
    - `/app/manage/analytics/saved` - Saved reports
  - `/app/manage/automation` - Automation rules
    - `/app/manage/automation/workflows` - Workflow builder
    - `/app/manage/automation/macros` - Macro management

### Settings Routes

- `/app/settings` - Personal settings

  - `/app/settings/profile` - Profile settings
  - `/app/settings/preferences` - Workspace preferences
  - `/app/settings/notifications` - Notification settings
  - `/app/settings/tooling` - Personal tools

- `/app/admin` - Organization settings (admin only)
  - `/app/admin/organization` - Organization profile
  - `/app/admin/security` - Security settings
  - `/app/admin/integrations` - Integration management
  - `/app/admin/billing` - Billing & subscription
  - `/app/admin/audit` - Audit logs

## API Routes

- `/api/v1` - API root
  - `/api/v1/tickets/*` - Ticket operations
  - `/api/v1/kb/*` - Knowledge base operations
  - `/api/v1/users/*` - User operations
  - `/api/v1/organizations/*` - Organization operations
  - `/api/v1/analytics/*` - Analytics operations

## Layout Structure

```tsx
// Root layout (app/layout.tsx)
-RootLayout -
  AuthProvider -
  ThemeProvider -
  ToastProvider -
  // App layout (app/app/layout.tsx)
  AppLayout -
  AuthGuard -
  SideNav -
  Header -
  NotificationCenter -
  // Portal layout (app/app/portal/layout.tsx)
  PortalLayout -
  CustomerGuard -
  CustomerNav -
  // Management layout (app/app/manage/layout.tsx)
  ManagementLayout -
  AdminGuard -
  AdminNav -
  // Settings layout (app/app/settings/layout.tsx)
  SettingsLayout -
  SettingsNav -
  // Admin layout (app/app/admin/layout.tsx)
  AdminLayout -
  AdminGuard -
  AdminNav;
```

## Route Guards and Access Control

- Public routes: No authentication required
- `/app/*`: Requires authentication
- `/app/manage/*`: Requires manager role
- `/app/admin/*`: Requires admin role
- `/app/kb/articles/new`: Requires kb_editor role
- `/app/portal/*`: Requires customer role

## Shared Components

Each layout can access:

- Global navigation
- Search functionality
- Notification system
- User menu
- Help widget
