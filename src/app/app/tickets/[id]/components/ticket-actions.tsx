'use client';

import {
  AlertDialog,
  AlertDialogContent,
  StrictAlertDialog,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { type TicketWithDetails } from '@/lib/types/ticket';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteTicket } from '../actions';

interface TicketActionsProps {
  ticket: TicketWithDetails;
}

export function TicketActions({ ticket }: TicketActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const result = await deleteTicket(ticket.id);
        if (!result.success) {
          throw new Error(result.error);
        }
        toast({
          title: 'Success',
          description: 'Ticket deleted successfully',
        });
        router.push('/app/tickets');
        router.refresh();
      } catch (error) {
        toast({
          title: 'Error',
          description:
            error instanceof Error ? error.message : 'Failed to delete ticket',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <>
      <div className='flex items-center gap-2'>
        <Button variant='outline' size='sm' asChild>
          <Link href={`/app/tickets/${ticket.id}/edit`}>
            <Pencil className='mr-2 h-4 w-4' />
            Edit Ticket
          </Link>
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setShowDeleteDialog(true)}
          disabled={isPending}
          className='text-destructive hover:text-destructive'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Delete
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <StrictAlertDialog
            title='Delete Ticket'
            content={
              <div className='space-y-2'>
                <p>
                  This action cannot be undone. This will permanently delete the
                  ticket and all its associated data.
                </p>
                <p className='font-semibold'>{ticket.title}</p>
              </div>
            }
            type='delete'
            onAction={handleDelete}
            onOpenChange={setShowDeleteDialog}
            actionLabel='Delete Ticket'
            actionVariant='destructive'
          />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
