import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronRight, Loader2, Star } from 'lucide-react';
import * as React from 'react';
import { type Draft, type EmailThread } from './types';
import { getGradeColor, getGradeLabel } from './utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { PlaceholderEditor } from './placeholder-editor';
import { useAuth } from '@/lib/auth/hooks';

interface DraftResponseProps {
  thread: EmailThread;
  draft: Draft;
  onDraftAction: (thread: EmailThread, draft: Draft, action: 'edit' | 'approve' | 'reject') => void;
  isApproving: boolean;
}

export function DraftResponse({ thread, draft, onDraftAction, isApproving }: DraftResponseProps) {
  const [isExpanded, setIsExpanded] = React.useState(draft.status === 'pending');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false);
  const [rejectFeedback, setRejectFeedback] = React.useState('');
  const [draftContent, setDraftContent] = React.useState(draft.content);
  const { user } = useAuth();

  const handleReject = () => {
    onDraftAction(thread, { ...draft, feedback: rejectFeedback }, 'reject');
    setIsRejectDialogOpen(false);
    setRejectFeedback('');
  };

  const handleAction = (action: 'edit' | 'approve' | 'reject') => {
    // Apply any pending placeholder values before sending
    let finalContent = draftContent;
    if (PlaceholderEditor.refs.apply?.current) {
      finalContent = PlaceholderEditor.refs.apply.current.apply();
    }
    onDraftAction(thread, { ...draft, content: finalContent }, action);
  };

  return (
    <div
      className={cn(
        'w-full space-y-2 rounded-md border p-4 transition-colors duration-200',
        // Light mode - warmer sand color for pending, keep primary for rejected
        draft.status === 'pending' && 'border-[hsl(60,20%,75%)] bg-[hsl(60,20%,95%)] dark:border-[hsl(60,25%,45%)]/30 dark:bg-[hsl(60,25%,45%)]/10',
        draft.status === 'rejected' && 'border-primary/30 bg-primary/5 dark:border-primary/20 dark:bg-primary/10'

      )}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            className={cn(
              "hover:bg-secondary/10 dark:hover:bg-secondary/20",
              draft.status === 'pending' && "hover:bg-[hsl(60,20%,75%)]/20 dark:hover:bg-[hsl(60,25%,45%)]/20"
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >

            {isExpanded ? (
              <ChevronDown className='h-4 w-4' />
            ) : (
              <ChevronRight className='h-4 w-4' />
            )}
          </Button>
          <div>
            <div className='text-sm font-medium'>Auto-Generated Response</div>
            <div className='text-xs text-muted-foreground'>
              {formatDistanceToNow(new Date(draft.created_at), {
                addSuffix: true,
              })}
            </div>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleAction('edit')}
          >
            Edit & Send
          </Button>
          {draft.status === 'pending' && (
            <>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setIsRejectDialogOpen(true)}
              >
                Reject
              </Button>
              <Button
                variant='secondary'
                size='sm'
                onClick={() => handleAction('approve')}
                disabled={isApproving}
              >
                {isApproving ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Approving...
                  </>
                ) : (
                  'Approve & Send'
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          <div className={cn(
            'border-l-2 pl-4',
            draft.status === 'pending' 
              ? 'border-[hsl(35,30%,75%)] dark:border-[hsl(35,30%,45%)]/50' 
              : 'border-secondary/30 dark:border-secondary/20'
          )}>
            <div className='whitespace-pre-wrap rounded-md bg-background/80 p-3 text-sm shadow-sm'>
              <div className='max-w-[65ch]'>{draftContent}</div>
            </div>
          </div>

          <PlaceholderEditor
            content={draftContent}
            onContentChange={setDraftContent}
            userName={user?.name || ''}
            className='mt-4'
          />

          {draft.grade && (
            <div className='mt-2'>
              <div className='mb-2 flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <Star
                    className={cn(
                      'h-4 w-4',
                      getGradeColor(draft.grade.quality_score)
                    )}
                  />
                  <span className='text-sm font-medium'>
                    Quality: {getGradeLabel(draft.grade.quality_score)}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Star
                    className={cn(
                      'h-4 w-4',
                      getGradeColor(draft.grade.accuracy_score)
                    )}
                  />
                  <span className='text-sm font-medium'>
                    Accuracy: {getGradeLabel(draft.grade.accuracy_score)}
                  </span>
                </div>
              </div>
              {draft.grade.summary && (
                <div className='text-sm text-muted-foreground'>
                  <strong>Summary:</strong> {draft.grade.summary}
                </div>
              )}
              {draft.grade.concerns.length > 0 && (
                <div className='text-sm text-muted-foreground'>
                  <strong>Concerns:</strong> {draft.grade.concerns.join(', ')}
                </div>
              )}
            </div>
          )}

          {draft.status === 'rejected' && draft.feedback && (
            <div className='mt-2 rounded-md bg-primary/5 dark:bg-primary/10 border border-primary/20 p-3 text-sm'>
              <div className='font-medium text-primary dark:text-primary/90'>Rejection Feedback:</div>
              <div className='mt-1 text-primary/80 dark:text-primary/70'>{draft.feedback}</div>
            </div>
          )}
        </>
      )}

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Draft Response</DialogTitle>
            <DialogDescription>
              Please provide feedback on why this draft response is being rejected.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectFeedback}
            onChange={(e) => setRejectFeedback(e.target.value)}
            placeholder='Enter feedback for rejection...'
            className='min-h-[100px]'
          />
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleReject}
              disabled={!rejectFeedback.trim()}
            >
              Reject Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 