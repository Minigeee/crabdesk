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
import { useCreateTicket } from '@/lib/tickets/use-tickets';
import { useState } from 'react';
import { useOrganization } from '../providers/organization-provider';
import { TicketForm, type TicketFormData } from './ticket-form';
import type { FileAttachment } from '@/lib/tickets/ticket-service';

interface CreateTicketDialogProps {
  trigger?: React.ReactNode;
}

export function CreateTicketDialog({ trigger }: CreateTicketDialogProps) {
  const [open, setOpen] = useState(false);
  const createTicket = useCreateTicket();
  const { toast } = useToast();
  const { organization } = useOrganization();

  const handleSubmit = async (data: TicketFormData, attachments: FileAttachment[]) => {
    if (!organization) return;
    try {
      const insertData = {
        ...data,
        org_id: organization.id,
        source: 'portal' as 'portal', // Since this is from the dashboard
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
        />
      </DialogContent>
    </Dialog>
  );
}
