# Usage Examples

A collection of usage examples for various components in this project.

**Note:** When adding new examples, keep them concise but complete.

## Database Types

Import types from `@/lib/database.types`:

```typescript
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from '@/lib/database.types';

// Row type (full database record)
type Ticket = Tables<'tickets'>;

// Insert type (for creating new records)
type NewTicket = TablesInsert<'tickets'>;

// Update type (for modifying existing records)
type TicketUpdate = TablesUpdate<'tickets'>;

// Enum type (for status, priority, etc)
type TicketStatus = Enums<'ticket_status'>; // 'open' | 'closed' | etc

// Common patterns
type TicketWithRelations = Tables<'tickets'> & {
  contact: Tables<'contacts'>;
  messages: Tables<'messages'>[];
};

// Form data (all fields optional)
type TicketForm = Partial<TablesInsert<'tickets'>>;
```

## Supabase Clients

### Server Components

```tsx
import { createClient } from '@/lib/supabase/server';

export default async function PrivatePage() {
  const client = await createClient();
  const { data: tickets } = await client.from('tickets').select('*');

  // ...
}
```

### Client Components

```tsx
import { createClient } from '@/lib/supabase/client';

// Client is a singleton, no need to await
const supabase = createClient();

// Example usage in a component
const { data } = await supabase.from('tickets').select();
```

## Authentication

CrabDesk uses a single user model with role-based access control. Users belong to organizations and have specific roles (admin or agent) that determine their permissions.

### Server-Side Authentication

```typescript
import {
  getCurrentUser,
  requireUser,
  requireOrganizationAccess,
  signOut,
  switchOrganization,
} from '@/lib/auth/session';

// Get current user (if any)
export default async function Page() {
  const userData = await getCurrentUser();
  if (userData) {
    const { user, organization } = userData;
    // Use user and organization data
  }
}

// Require authentication
export default async function ProtectedPage() {
  const { user, organization } = await requireUser();
  // User is guaranteed to be authenticated
}

// Require organization access
export default async function OrgPage({
  params,
}: {
  params: { orgId: string };
}) {
  const { user, organization } = await requireOrganizationAccess(params.orgId);
  // User is guaranteed to have access to this organization
}

// Sign out
export async function handleSignOut() {
  await signOut();
  // Redirects to login
}

// Switch organization
export async function handleSwitch(orgId: string) {
  await switchOrganization(orgId);
  // Redirects to home with new org context
}
```

### Client-Side Authentication

```typescript
import { useAuth } from '@/lib/auth/hooks';

export function AuthenticatedComponent() {
  const {
    user,              // The user data
    organization,      // Current organization
    organizations,     // List of accessible organizations
    switchOrganization, // Function to switch organizations
    signOut,           // Function to sign out
    isLoading,         // Loading state
    error             // Error state
  } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <h1>Welcome {user.name}</h1>
      <h2>Organization: {organization?.name}</h2>

      {/* Switch Organization */}
      <select
        value={organization?.id}
        onChange={(e) => switchOrganization(e.target.value)}
      >
        {organizations.map(org => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>

      {/* Sign Out */}
      <button onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  );
}
```

### Permissions

The auth system provides utilities for checking user permissions:

```typescript
import {
  hasPermission,
  hasOrganizationAccess,
  hasTeamAccess,
  getUserPermissions,
  type Permission,
} from '@/lib/auth/permissions';

// Check specific permission
if (hasPermission(user, 'manage:tickets')) {
  // User can manage tickets
}

// Check organization access
if (hasOrganizationAccess(user, orgId)) {
  // User has access to this organization
}

// Check team access (async)
if (await hasTeamAccess(user, teamId, supabase)) {
  // User has access to this team
}

// Get all user permissions
const permissions = getUserPermissions(user);
```

Available permissions:

- `manage:users` - Can manage users and their roles
- `manage:teams` - Can create and manage teams
- `manage:tickets` - Can manage tickets and their assignments
- `manage:contacts` - Can manage contact information
- `manage:settings` - Can manage organization settings
- `manage:email` - Can manage email settings and templates
- `view:analytics` - Can view analytics and reports

## Type Safety

The auth system is fully typed with TypeScript:

```typescript
import type { Tables } from '@/lib/database.types';

// User types
type User = Tables<'users'>;
type Organization = Tables<'organizations'>;

// Auth context type
type UserData = {
  user: User;
  organization: Organization;
  organizations: Organization[];
};
```

## Ticket System

### Using Ticket Hooks

```tsx
// Fetch and display ticket list with filters
function TicketList() {
  const { data, isLoading } = useTickets({
    filters: { status: ['open', 'pending'] },
    orderBy: [{ column: 'created_at', ascending: false }],
    includeRelations: true,
    limit: 10,
  });

  if (isLoading) return <div>Loading...</div>;
  return <DataTable data={data.data} count={data.count} />;
}

// Single ticket view with real-time updates
function TicketDetails({ id }: { id: string }) {
  const { data: ticket } = useTicket(id, true);
  const { updateStatus, updateAssignee } = useTicketActions(id);

  return (
    <div>
      <StatusSelect
        value={ticket?.status}
        onChange={(status) => updateStatus(status)}
      />
      <AssigneeSelect
        value={ticket?.assignee_id}
        onChange={(id) => updateAssignee(id)}
      />
    </div>
  );
}

// Create new ticket
function NewTicketForm() {
  const createTicket = useCreateTicket();

  const onSubmit = async (data: TicketInsert) => {
    await createTicket.mutateAsync(data);
    // Handle success
  };

  return <Form onSubmit={onSubmit} />;
}
```

### Direct Service Usage (Server-Side)

```tsx
import { TicketService } from '@/lib/tickets/ticket-service';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request: Request) {
  const userData = await getCurrentUser();
  if (!userData) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = await createClient();
  const ticketService = new TicketService(supabase, userData.organization.id);

  const { data, count } = await ticketService.getTickets({
    filters: { status: ['open'] },
    includeRelations: true,
  });

  return Response.json({ data, count });
}
```

## Shared Components

### Status and Priority Badges

```tsx
import { StatusBadge } from '@/components/tickets/status-badge';
import { PriorityBadge } from '@/components/tickets/priority-badge';

// Status badge with automatic styling
function TicketHeader({
  status,
  priority,
}: {
  status: Enums<'ticket_status'>;
  priority: Enums<'ticket_priority'>;
}) {
  return (
    <div className='flex gap-2'>
      <StatusBadge status={status} />
      <PriorityBadge priority={priority} />
    </div>
  );
}
```

## Portal Links

### Generating Portal Access Links

```typescript
// Example usage in a route handler
export async function POST(request: Request) {
  const { contactId, ticketId } = await request.json();
  const portalService = new PortalService();

  try {
    const link = await portalService.generatePortalLink(contactId, ticketId);
    return Response.json({ link });
  } catch (error) {
    return Response.json({ error: 'Failed to generate link' }, { status: 500 });
  }
}
```

## Email Processing

### Using Email Service

```typescript
import { EmailProcessingService } from '@/lib/email/service';
import { createClient } from '@/lib/supabase/server';

// Process incoming email
async function handleIncomingEmail(orgId: string, emailData: ProcessedEmailData) {
  const supabase = await createClient();
  const emailService = new EmailProcessingService(supabase, orgId);
  
  try {
    const result = await emailService.processEmail(emailData);
    // result contains created/updated thread, ticket, message, and contact
    return result;
  } catch (error) {
    console.error('Failed to process email:', error);
    throw error;
  }
}
```

### Testing Email Processing

```typescript
import { generateTestEmailPayload, generateEmailThread } from '@/lib/email/test-utils';

// Generate single test email
const testEmail = generateTestEmailPayload({
  fromEmail: 'customer@example.com',
  toEmail: 'support@company.com',
  subject: 'Need help',
});

// Generate email thread (simulates conversation)
const thread = generateEmailThread(3); // Creates 3 messages in thread
const [initial, firstReply, secondReply] = thread;

// Test webhook endpoint
const response = await fetch('/api/webhooks/email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Postmark-Signature': 'test-signature',
  },
  body: JSON.stringify(testEmail),
});

const result = await response.json();
```
