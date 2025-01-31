'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/hooks';
import { useNotes, type EntityType } from '@/lib/notes/use-notes';
import { formatDistanceToNow } from 'date-fns';
import { BotIcon, Loader2, Plus, Trash, UserIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import Markdown from 'react-markdown';

interface NotesListProps {
  entityType: EntityType;
  entityId: string;
  title?: string;
}

export function NotesList({
  entityType,
  entityId,
  title = 'Notes',
}: NotesListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newNote, setNewNote] = useState('');
  const { notes, isLoading, addNote, deleteNote } = useNotes(
    entityType,
    entityId
  );

  const handleSubmit = useCallback(() => {
    if (!newNote.trim()) return;
    addNote.mutate(newNote, {
      onSuccess: () => {
        setNewNote('');
        toast({
          title: 'Note added',
          description: 'Your note has been added successfully.',
        });
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to add note. Please try again.',
          variant: 'destructive',
        });
      },
    });
  }, [newNote, addNote, toast]);

  const handleDelete = useCallback(
    (noteId: string) => {
      deleteNote.mutate(noteId, {
        onSuccess: () => {
          toast({
            title: 'Note deleted',
            description: 'The note has been deleted successfully.',
          });
        },
        onError: () => {
          toast({
            title: 'Error',
            description: 'Failed to delete note. Please try again.',
            variant: 'destructive',
          });
        },
      });
    },
    [deleteNote, toast]
  );

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Add note form */}
        <div className='space-y-2'>
          <Textarea
            placeholder='Add a note...'
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <Button
            onClick={handleSubmit}
            disabled={addNote.isPending || !newNote.trim()}
            className='w-full'
          >
            {addNote.isPending ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Plus className='mr-2 h-4 w-4' />
            )}
            Add Note
          </Button>
        </div>

        {/* Notes list */}
        {isLoading ? (
          <div className='flex items-center justify-center py-4'>
            <Loader2 className='h-6 w-6 animate-spin' />
          </div>
        ) : notes.length === 0 ? (
          <div className='py-4 text-center text-sm text-muted-foreground'>
            No notes yet
          </div>
        ) : (
          <div className='space-y-4'>
            {notes.map((note) => (
              <div
                key={note.id}
                className='flex space-x-3 rounded-lg border p-4'
              >
                <Avatar className='h-8 w-8'>
                  <AvatarFallback>
                    {note.managed ? (
                      <BotIcon className='h-4 w-4' />
                    ) : (
                      (note.author?.name?.[0]?.toUpperCase() ?? (
                        <UserIcon className='h-4 w-4' />
                      ))
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1 space-y-1'>
                  <div className='flex items-center justify-between'>
                    <div className='text-sm font-medium'>
                      {note.managed
                        ? 'System'
                        : note.author?.name || 'Unknown User'}
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='text-xs text-muted-foreground'>
                        {formatDistanceToNow(new Date(note.created_at), {
                          addSuffix: true,
                        })}
                      </div>
                      {note.author_id === user?.id && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDelete(note.id)}
                          className='h-6 w-6 p-0'
                          disabled={deleteNote.isPending}
                        >
                          <Trash className='h-4 w-4 text-muted-foreground hover:text-destructive' />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Markdown className='prose text-sm'>{note.content}</Markdown>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
