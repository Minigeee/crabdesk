import { getUser } from '@/lib/auth/utils';
import { TeamService } from '@/lib/services/team.service';
import { TicketService } from '@/lib/services/ticket.service';
import { UserService } from '@/lib/services/user.service';
import { notFound } from 'next/navigation';
import { TicketEditForm } from '../components/ticket-edit-form';

export default async function EditTicketPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser();

  const [ticket, teams, agents] = await Promise.all([
    TicketService.create().then((service) => service.getById(params.id)),
    TeamService.create().then((service) =>
      service.list(user.organization_id ?? undefined),
    ),
    UserService.create().then((service) =>
      service.listAgents(user.organization_id ?? undefined),
    ),
  ]);

  if (!user || !ticket) {
    notFound();
  }

  // Check if user has permission to edit this ticket
  const isCustomer = user.role === 'customer';
  if (isCustomer && ticket.customer_id !== user.id) {
    notFound();
  }

  return (
    <div className='p-6 max-w-2xl'>
      <h1 className='text-2xl font-bold tracking-tight mb-6'>Edit Ticket</h1>

      <TicketEditForm
        ticket={ticket}
        userRole={user.role}
        teams={teams}
        agents={agents}
      />
    </div>
  );
}
