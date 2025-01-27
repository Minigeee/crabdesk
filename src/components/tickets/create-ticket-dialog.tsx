import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/hooks';
import type { FileAttachment } from '@/lib/tickets/ticket-service';
import { useCreateTicket } from '@/lib/tickets/use-tickets';
import { useState } from 'react';
import { TicketForm, type TicketFormData } from './ticket-form';

interface CreateTicketDialogProps {
  trigger?: React.ReactNode;
  initialContactId?: string;
}

export function CreateTicketDialog({ trigger, initialContactId }: CreateTicketDialogProps) {
  const [open, setOpen] = useState(false);
  const createTicket = useCreateTicket();
  const { toast } = useToast();
  const { organization } = useAuth();

  const handleSubmit = async (
    data: TicketFormData,
    attachments: FileAttachment[]
  ) => {
    if (!organization) return;
    try {
      const insertData = {
        ...data,
        org_id: organization.id,
        source: 'api' as const, // Since this is from the dashboard
        assignee_id: data.assignee_id || undefined,
        metadata: {
          description: data.description,
        },
      };
      delete insertData.description;

      await createTicket.mutateAsync({
        ticket: insertData,
        attachments,
      });

      toast({
        title: 'Ticket created',
        description: 'The ticket has been created successfully.',
      });

      setOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to create ticket. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Create Ticket</Button>}
      </DialogTrigger>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>
            Create a new support ticket. Fill in the required information below.
          </DialogDescription>
        </DialogHeader>
        <TicketForm
          onSubmit={handleSubmit}
          isSubmitting={createTicket.isPending}
          defaultValues={initialContactId ? { contact_id: initialContactId } : undefined}
        />
      </DialogContent>
    </Dialog>
  );
}
