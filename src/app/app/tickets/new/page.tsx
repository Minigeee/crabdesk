import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getUser } from '@/lib/auth/utils';
import { TeamService } from '@/lib/services/team.service';
import { UserService } from '@/lib/services/user.service';
import { type Database } from '@/lib/supabase/database.types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TicketForm } from '../components/ticket-form';

type Team = Pick<Database['public']['Tables']['teams']['Row'], 'id' | 'name'>;
type Agent = Pick<
  Database['public']['Tables']['users']['Row'],
  'id' | 'full_name'
>;
type Customer = Pick<Database['public']['Tables']['users']['Row'], 'id' | 'full_name' | 'email'>;

export default async function NewTicketPage() {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }

  // For agents/admins, we'll need to fetch teams, agents, and customers
  let teams: Team[] = [];
  let agents: Agent[] = [];
  let customers: Customer[] = [];

  if (user.role === 'agent' || user.role === 'admin') {
    const [teamService, userService] = await Promise.all([
      TeamService.create(),
      UserService.create(),
    ]);

    // Fetch teams, agents, and customers in parallel
    const [teamData, agentData, customerData] = await Promise.all([
      teamService.list(user.organization_id ?? undefined),
      userService.listAgents(user.organization_id ?? undefined),
      userService.listCustomers(user.organization_id ?? undefined),
    ]);

    teams = teamData;
    agents = agentData;
    customers = customerData;
  }

  return (
    <div className='flex min-h-full flex-col'>
      {/* Header */}
      <header className='border-b bg-background/90 sticky top-0 z-10 backdrop-blur-sm'>
        <div className='flex h-14 items-center gap-4 px-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/app/tickets'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div className='flex flex-1 items-center'>
            <h1 className='text-lg font-semibold'>New Ticket</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className='flex flex-1 flex-col'>
        <Card className='mx-auto my-8 w-fit'>
          <CardHeader>
            <CardTitle className='text-xl font-bold tracking-tight'>
              Create New Ticket
            </CardTitle>
            <CardDescription>
              Submit a new support ticket. Please provide as much detail as
              possible to help us assist you better.
            </CardDescription>
          </CardHeader>
          <CardContent className='max-w-2xl'>
            {/* Form */}
            <TicketForm 
              userRole={user.role}
              teams={teams}
              agents={agents}
              customers={customers}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
