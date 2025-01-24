# Usage Examples

A collection of usage examples for various components in this project.

**Note:** When adding new examples, keep them concise but complete.

## Database Types

Import types from `@/lib/database.types`:
```typescript
import type { Tables, TablesInsert, TablesUpdate, Enums } from '@/lib/database.types';

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
  const { data: tickets } = await client
    .from('tickets')
    .select('*');

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

CrabDesk supports two types of users: internal users (staff) and portal users (customers). The auth system provides separate utilities for handling both types while sharing common functionality.

## Server-Side Authentication

### Internal Users

```typescript
import { getCurrentInternalUser, requireInternalUser, requireOrganizationAccess } from '@/lib/auth/internal/session';

// Get current user (if any)
export default async function Page() {
  const userData = await getCurrentInternalUser();
  if (userData) {
    const { user, organization } = userData;
    // Use user and organization data
  }
}

// Require authentication
export default async function ProtectedPage() {
  const { user, organization } = await requireInternalUser();
  // User is guaranteed to be authenticated
}

// Require organization access
export default async function OrgPage({ params }: { params: { orgId: string } }) {
  const { user, organization } = await requireOrganizationAccess(params.orgId);
  // User is guaranteed to have access to this organization
}
```

### Portal Users

```typescript
import { getCurrentPortalUser, requirePortalUser, requirePortalAccess } from '@/lib/auth/portal/session';

// Get current user (if any)
export default async function Page() {
  const userData = await getCurrentPortalUser();
  if (userData) {
    const { user, contact } = userData;
    // Use user and contact data
  }
}

// Require authentication
export default async function ProtectedPage() {
  const { user, contact } = await requirePortalUser();
  // User is guaranteed to be authenticated
}

// Require portal access
export default async function OrgPage({ params }: { params: { orgId: string } }) {
  const { user, contact } = await requirePortalAccess(params.orgId);
  // User is guaranteed to have access to this organization
}
```

## Client-Side Authentication

### Internal Users

```typescript
import { useInternalAuth } from '@/lib/auth/internal/hooks';

export function InternalComponent() {
  const { 
    user,              // The internal user data
    organization,      // Current organization
    organizations,     // List of accessible organizations
    switchOrganization, // Function to switch organizations
    isLoading,         // Loading state
    error             // Error state
  } = useInternalAuth();

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
    </div>
  );
}
```

### Portal Users

```typescript
import { usePortalAuth } from '@/lib/auth/portal/hooks';

export function PortalComponent() {
  const {
    user,       // The portal user data
    contact,    // Associated contact data
    isLoading,  // Loading state
    error       // Error state
  } = usePortalAuth();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <h1>Welcome {contact?.name}</h1>
      <p>Email: {contact?.email}</p>
    </div>
  );
}
```

## Common Auth Functions

The auth system provides some common functions that work for both user types:

```typescript
import { getAuthUser, signOut } from '@/lib/auth/common/supabase';

// Get raw Supabase auth user
const authUser = await getAuthUser();

// Sign out (works for both internal and portal users)
await signOut();
```

## Type Safety

The auth system is fully typed with TypeScript:

```typescript
import type { InternalAuthContext, PortalAuthContext } from '@/lib/auth/common/types';

// Internal user types
type InternalUser = Tables<'internal_users'>;
type Organization = Tables<'organizations'>;

// Portal user types
type PortalUser = Tables<'portal_users'>;
type Contact = Tables<'contacts'>;
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
  })

  if (isLoading) return <div>Loading...</div>
  return <DataTable data={data.data} count={data.count} />
}

// Single ticket view with real-time updates
function TicketDetails({ id }: { id: string }) {
  const { data: ticket } = useTicket(id, true)
  const { updateStatus, updateAssignee } = useTicketActions(id)

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
  )
}

// Create new ticket
function NewTicketForm() {
  const createTicket = useCreateTicket()
  
  const onSubmit = async (data: TicketInsert) => {
    await createTicket.mutateAsync(data)
    // Handle success
  }

  return <Form onSubmit={onSubmit} />
}
```

### Direct Service Usage (Server-Side)
```tsx
import { TicketService } from '@/lib/tickets/ticket-service'
import { createClient } from '@/lib/supabase/server'
import { getCurrentInternalUser } from '@/lib/auth/internal/session'

export async function GET(request: Request) {
  const userData = await getCurrentInternalUser()
  if (!userData) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = await createClient()
  const ticketService = new TicketService(supabase, userData.organization.id)

  const { data, count } = await ticketService.getTickets({
    filters: { status: ['open'] },
    includeRelations: true,
  })

  return Response.json({ data, count })
}
```

## Shared Components

### Status and Priority Badges
```tsx
import { StatusBadge } from '@/components/tickets/status-badge'
import { PriorityBadge } from '@/components/tickets/priority-badge'

// Status badge with automatic styling
function TicketHeader({ status, priority }: { status: Enums<'ticket_status'>, priority: Enums<'ticket_priority'> }) {
  return (
    <div className="flex gap-2">
      <StatusBadge status={status} />
      <PriorityBadge priority={priority} />
    </div>
  )
}
```
