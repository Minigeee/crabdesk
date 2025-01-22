# Supabase Development Workflow

## Initial Setup

```bash
# Install Supabase CLI
npm install supabase --save-dev

# Initialize Supabase in your project
npx supabase init

# Start local Supabase
npx supabase start
```

## Directory Structure

```
project/
├── supabase/
│   ├── migrations/           # Database migrations
│   │   ├── 20240101_initial.sql
│   │   └── 20240102_add_users.sql
│   ├── seed.sql             # Seed data for development
│   └── config.toml          # Supabase configuration
├── src/
│   └── lib/
│       └── database.types.ts # Generated types
```

## Development Workflow

### 1. Making Database Changes

```bash
# Create a new migration
npx supabase migration new add_users_table

# Edit the newly created file in supabase/migrations/[timestamp]_add_users_table.sql
# Add your SQL changes there

# Apply migrations to local database
npx supabase db reset

# Generate updated TypeScript types
npx supabase gen types typescript --local > src/lib/database.types.ts

# Once tested, push to remote development database
npx supabase db push
```

### 2. Local Development Loop

```bash
# Start Supabase services
npx supabase start

# Access local services:
- Studio UI: http://localhost:54323
- Database: postgresql://postgres:postgres@localhost:54322/postgres
- API: http://localhost:54321
- Email testing: http://localhost:54324

# Stop services when done
npx supabase stop
```

### 3. Database Commands

```bash
# View status of local services
npx supabase status

# Reset local database (applies migrations from scratch)
npx supabase db reset

# Push local migrations to remote
npx supabase db push

# Pull remote schema
npx supabase db pull

# View differences between local and remote
npx supabase db diff
```

### 4. Type Generation

```bash
# Generate types from local database
npx supabase gen types typescript --local > src/lib/database.types.ts

# Generate types from remote database
npx supabase gen types typescript --project-id your-project-ref > src/lib/database.types.ts
```

## Environment Management

### Local Development
- Uses Docker-based local Supabase (`supabase start`)
- Database URL: `postgresql://postgres:postgres@localhost:54322/postgres`
- API URL: `http://localhost:54321`
- Anonymous Key: Available in Studio UI
- Service Role Key: Available in Studio UI

### Development Environment
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-dev-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-dev-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-dev-service-role-key"
```

### Production Environment
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-prod-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-prod-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-prod-service-role-key"
```

## Migration Best Practices

1. **One Change Per Migration**
   - Each migration should do one logical change
   - Makes it easier to review and rollback if needed

2. **Naming Conventions**
   ```
   [timestamp]_verb_noun.sql
   20240101123456_create_users_table.sql
   20240102234567_add_email_column.sql
   ```

3. **Reversible Migrations**
   - When possible, make migrations reversible
   - Include `up` and `down` sections if needed
   ```sql
   -- up migration
   alter table users add column email text;
   
   -- down migration
   alter table users drop column email;
   ```

4. **Never Modify Existing Migrations**
   - Once a migration is pushed, treat it as immutable
   - Create new migrations for changes
   - Ensures consistency across environments

5. **Test Locally First**
   - Always test migrations on local database
   - Use `supabase db reset` to verify clean install
   - Check for any type generation issues

## Branching Strategy

```
main (production)
└── development
    └── feature/add-users
    └── feature/auth-setup
```

- Feature branches work with local Supabase
- Development branch uses dev Supabase project
- Main branch uses production Supabase project

## Common Issues and Solutions

### 1. Type Generation Errors
```bash
# Regenerate types if they're out of sync
npx supabase gen types typescript --local > src/lib/database.types.ts

# If still having issues, reset local DB
npx supabase db reset
```

### 2. Migration Conflicts
```bash
# Pull latest migrations
npx supabase db pull

# View differences
npx supabase db diff

# Resolve conflicts by creating new migrations
npx supabase migration new fix_conflict
```

### 3. Local Services Issues
```bash
# Stop all services
npx supabase stop

# Remove local data
npx supabase stop --no-backup

# Start fresh
npx supabase start
```

## Recommended NPM Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset",
    "db:push": "supabase db push",
    "db:types": "supabase gen types typescript --local > src/lib/database.types.ts",
    "db:new": "supabase migration new"
  }
}
```

Then use them like:
```bash
npm run db:start
npm run db:types
npm run db:new add_users_table
``` 