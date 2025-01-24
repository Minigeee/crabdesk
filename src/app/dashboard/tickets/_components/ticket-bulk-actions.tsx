'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTicketActions } from '@/lib/tickets/use-tickets';
import assert from 'assert';
import { useState } from 'react';
import { useTicketQueue } from './ticket-queue-provider';

type BulkAction =
  | {
      label: string;
      description: string;
      action: () => Promise<void>;
      requireConfirmation?: boolean;
      destructive?: boolean;
      separator?: false;
    }
  | {
      separator: true;
    };

export function TicketBulkActions() {
  const { selectedTickets, setSelectedTickets } = useTicketQueue();
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);
  const { updateStatus, updatePriority, updateAssignee } = useTicketActions();

  const hasSelection = selectedTickets.length > 0;

  const bulkActions: BulkAction[] = [
    // Status updates
    {
      label: 'Mark as Resolved',
      description: `Mark ${selectedTickets.length} tickets as resolved`,
      action: async () => {
        await updateStatus('resolved', selectedTickets);
        setSelectedTickets([]);
      },
    },
    {
      label: 'Mark as Pending',
      description: `Mark ${selectedTickets.length} tickets as pending`,
      action: async () => {
        await updateStatus('pending', selectedTickets);
        setSelectedTickets([]);
      },
    },
    {
      label: 'Mark as Closed',
      description: `Mark ${selectedTickets.length} tickets as closed`,
      action: async () => {
        await updateStatus('closed', selectedTickets);
        setSelectedTickets([]);
      },
      requireConfirmation: true,
    },
    { separator: true },

    // Priority updates
    {
      label: 'Set to High Priority',
      description: `Set ${selectedTickets.length} tickets to high priority`,
      action: async () => {
        await updatePriority('high', selectedTickets);
        setSelectedTickets([]);
      },
    },
    {
      label: 'Set to Normal Priority',
      description: `Set ${selectedTickets.length} tickets to normal priority`,
      action: async () => {
        await updatePriority('normal', selectedTickets);
        setSelectedTickets([]);
      },
    },
    { separator: true },

    // Assignment
    {
      label: 'Unassign Tickets',
      description: `Remove assignment from ${selectedTickets.length} tickets`,
      action: async () => {
        await updateAssignee(null, selectedTickets);
        setSelectedTickets([]);
      },
      requireConfirmation: true,
    },
  ];

  const handleActionClick = (action: BulkAction) => {
    if (action.separator) return;
    if (action.requireConfirmation) {
      setConfirmAction(action);
    } else {
      action.action();
    }
  };

  if (!hasSelection) {
    return null;
  }

  assert(!confirmAction?.separator);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline'>
            Bulk Actions ({selectedTickets.length})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[200px]'>
          {bulkActions.map((action, index) =>
            action.separator ? (
              <DropdownMenuSeparator key={index} />
            ) : (
              <DropdownMenuItem
                key={action.label}
                onClick={() => handleActionClick(action)}
                className={action.destructive ? 'text-destructive' : undefined}
              >
                {action.label}
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={() => setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.description}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmAction?.action();
                setConfirmAction(null);
              }}
              className={
                confirmAction?.destructive ? 'bg-destructive' : undefined
              }
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
