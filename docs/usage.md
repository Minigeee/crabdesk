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

export default async function PrivatePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect('/login');
  }

  return <p>Hello {data.user.email}</p>;
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

  return <div>Welcome, {user.email}</div>
}
```

### Using Organization Context
```tsx
'use client'
import { useOrganization } from '@/components/providers/organization-provider'

export function OrgSwitcher() {
  const { organization, organizations, switchOrganization } = useOrganization();
  
  return (
    <select 
      value={organization?.id}
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

### Server-Side Session
```tsx
import { getCurrentUser, getSessionWithOrganization } from '@/lib/auth/session'

// Get user and session data
export default async function ProfilePage() {
  const data = await getCurrentUser()
  if (!data) return null
  const { user, session } = data
  return <div>Welcome {user.name}</div>
}

// Get organization context
export default async function OrgDashboard() {
  const data = await getSessionWithOrganization()
  if (!data) return null
  const { organization, user } = data
  return <div>Dashboard for {organization.name}</div>
}
```
