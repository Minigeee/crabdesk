-- Enable RLS on all tables
alter table organizations enable row level security;
alter table teams enable row level security;
alter table users enable row level security;
alter table tickets enable row level security;
alter table conversations enable row level security;
alter table articles enable row level security;
alter table categories enable row level security;
alter table article_categories enable row level security;
alter table team_members enable row level security;
alter table metrics enable row level security;

-- Organizations policies
create policy "Public organizations are viewable by everyone"
  on organizations for select
  using (true);

create policy "Organizations can be created by authenticated users"
  on organizations for insert
  with check (auth.role() = 'authenticated');

create policy "Organizations can be updated by admins"
  on organizations for update
  using (
    exists (
      select 1 from users
      where users.organization_id = organizations.id
      and users.id = auth.uid()
      and users.role = 'admin'
    )
  );

-- Users policies
create policy "Users can view their own profile"
  on users for select
  using (auth.uid() = id);

create policy "Users can view profiles in their organization"
  on users for select
  using (
    organization_id in (
      select organization_id from users where id = auth.uid()
    )
  );

create policy "Users can update their own profile"
  on users for update
  using (auth.uid() = id);

-- Teams policies
create policy "Teams are viewable by organization members"
  on teams for select
  using (
    organization_id in (
      select organization_id from users where id = auth.uid()
    )
  );

create policy "Teams can be created by admins"
  on teams for insert
  with check (
    exists (
      select 1 from users
      where users.organization_id = organization_id
      and users.id = auth.uid()
      and users.role = 'admin'
    )
  );

-- Tickets policies
create policy "Tickets are viewable by organization members"
  on tickets for select
  using (
    organization_id in (
      select organization_id from users where id = auth.uid()
    )
  );

create policy "Customers can create tickets"
  on tickets for insert
  with check (
    auth.uid() = customer_id
  );

create policy "Agents can update assigned tickets"
  on tickets for update
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and (
        users.role = 'agent'
        or users.role = 'admin'
      )
      and (
        tickets.assigned_to = users.id
        or tickets.team_id = users.team_id
      )
    )
  );

-- Conversations policies
create policy "Conversations are viewable by ticket participants"
  on conversations for select
  using (
    exists (
      select 1 from tickets
      where tickets.id = ticket_id
      and (
        tickets.customer_id = auth.uid()
        or tickets.assigned_to = auth.uid()
        or tickets.team_id in (
          select team_id from users where id = auth.uid()
        )
      )
    )
  );

create policy "Users can create conversations in their tickets"
  on conversations for insert
  with check (
    exists (
      select 1 from tickets
      where tickets.id = ticket_id
      and (
        tickets.customer_id = auth.uid()
        or tickets.assigned_to = auth.uid()
        or tickets.team_id in (
          select team_id from users where id = auth.uid()
        )
      )
    )
  );

-- Articles policies
create policy "Published articles are viewable by everyone"
  on articles for select
  using (status = 'published');

create policy "Draft articles are viewable by authors and admins"
  on articles for select
  using (
    author_id = auth.uid()
    or exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

-- Categories policies
create policy "Categories are viewable by everyone"
  on categories for select
  using (true);

create policy "Categories can be managed by admins"
  on categories for all
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.role = 'admin'
    )
  );

-- Metrics policies
create policy "Metrics are viewable by agents and admins"
  on metrics for select
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and (
        users.role = 'agent'
        or users.role = 'admin'
      )
    )
  ); 