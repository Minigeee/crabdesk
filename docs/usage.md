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
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';

export default async function PrivatePage() {
  const userData = await getCurrentUser();
  if (!userData) {
    redirect('/login');
  }

  return <p>Hello {userData.user.name}</p>;
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

### Using the Auth Hook
```tsx
'use client'
import { useAuth } from '@/components/providers/auth-provider'

export function ProfileButton() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <button>Sign In</button>
  }

  return <div>Welcome, {user.name}</div>
}
```

### Using Organization Context
```tsx
'use client'
import { useOrganization } from '@/components/providers/organization-provider'

export function OrgSwitcher() {
  const { organization, organizations, switchOrganization } = useOrganization();
  if (!organization) return null;
  
  return (
    <select 
      value={organization.id}
      onChange={(e) => switchOrganization(e.target.value)}
    >
      {organizations.map(org => (
        <option key={org.id} value={org.id}>{org.name}</option>
      ))}
    </select>
  );
}
```

### Permission Checking
```tsx
'use client'
import { useAuth } from '@/components/providers/auth-provider'
import { hasPermission, hasAllPermissions } from '@/lib/auth/permissions'

// Single permission check
function AdminSettings() {
  const { user } = useAuth()
  if (!hasPermission(user, 'manage:settings')) return null
  return <div>Settings Panel</div>
}

// Multiple permission check
function TicketManager() {
  const { user } = useAuth()
  const requiredPermissions = ['manage:tickets', 'manage:contacts']
  if (!hasAllPermissions(user, requiredPermissions)) return null
  return <div>Ticket Management</div>
}
```

### Server-Side Auth
```tsx
import { getCurrentUser, getUserWithOrganization } from '@/lib/auth/session'

// Get user data
export default async function ProfilePage() {
  const userData = await getCurrentUser()
  if (!userData) return null
  const { user, authUser } = userData
  return <div>Welcome {user.name}</div>
}

// Get organization context
export default async function OrgDashboard() {
  const userData = await getUserWithOrganization()
  if (!userData) return null
  const { user, organization } = userData
  return <div>Dashboard for {organization.name}</div>
}
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
import { getUserWithOrganization } from '@/lib/auth/session'

export async function GET(request: Request) {
  const userData = await getUserWithOrganization()
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
