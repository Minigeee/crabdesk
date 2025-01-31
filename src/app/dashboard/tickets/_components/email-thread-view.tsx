'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/hooks';
import type { Tables } from '@/lib/database.types';
import type { ResponseGrade } from '@/lib/tickets/grader-service';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import {
  approveDraft,
  getDrafts,
  getEmailThreads,
  gradeEmailResponse,
  modifyDraft,
  rejectDraft,
  sendEmailReply,
} from '../actions';
import { DraftResponse } from './email-thread/draft-response';
import { EmailMessage } from './email-thread/email-message';
import { ReplyPanel } from './email-thread/reply-panel';
import type { Draft, EmailThread } from './email-thread/types';
import { shouldShowDraft } from './email-thread/utils';
import { useTicketView } from './ticket-view-provider';

export function EmailThreadView({ ticketId }: { ticketId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    emailReplyText,
    setEmailReplyText,
    isEmailReplyOpen,
    setIsEmailReplyOpen,
    replyContext,
    setReplyContext,
  } = useTicketView();
  const { organization } = useAuth();

  // Add ref for scroll area viewport
  const viewportRef = React.useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;

  // Add scroll to bottom effect
  const scrollToBottom = React.useCallback(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  // Add state for grade
  const [grade, setGrade] = React.useState<ResponseGrade | null>(null);

  // Add state for drafts
  const [selectedDraft, setSelectedDraft] =
    React.useState<Tables<'response_drafts'> | null>(null);

  // Add state for tracking which draft is being approved
  const [approvingDraftId, setApprovingDraftId] = React.useState<string | null>(
    null
  );

  // Fetch email threads with drafts
  const {
    data: threads = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['email-threads', ticketId],
    queryFn: async () => {
      const threads = await getEmailThreads(ticketId);
      // Fetch drafts for each thread
      const threadsWithDrafts = await Promise.all(
        threads.map(async (thread) => {
          const drafts = await getDrafts(thread.id);
          // Parse grade JSON for each draft
          const parsedDrafts = drafts.map((draft) => ({
            ...draft,
            grade: draft.grade ? (draft.grade as ResponseGrade) : null,
          }));
          return { ...thread, drafts: parsedDrafts };
        })
      );
      return threadsWithDrafts;
    },
  });

  // Add scroll to bottom effect after threads are loaded
  React.useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom, threads]);

  // Send reply mutation
  const { mutate: sendReply, isPending: isSending } = useMutation({
    mutationFn: async (textBody: string) => {
      if (!replyContext) throw new Error('No message selected to reply to');
      const response = await sendEmailReply({
        threadId: replyContext.threadId,
        textBody,
        inReplyTo: replyContext.inReplyTo,
      });

      // If this was from a draft, update its status
      if (selectedDraft) {
        await modifyDraft(selectedDraft.id, textBody);
      }

      return response;
    },
    onSuccess: () => {
      setEmailReplyText('');
      setIsEmailReplyOpen(false);
      setReplyContext(null);
      setSelectedDraft(null);
      queryClient.invalidateQueries({ queryKey: ['email-threads', ticketId] });
      toast({
        title: 'Reply Sent',
        description: 'Your reply has been sent successfully',
      });
    },
    onError: (error) => {
      console.error('Error sending reply:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to send reply',
        variant: 'destructive',
      });
    },
  });

  // Add grade mutation
  const { mutate: gradeReply, isPending: isGrading } = useMutation({
    mutationFn: async () => {
      if (!replyContext) throw new Error('No message selected to reply to');
      return gradeEmailResponse(replyContext.threadId, emailReplyText);
    },
    onSuccess: (data) => {
      setGrade(data);
      toast({
        title: 'Response Graded',
        description: data.summary,
      });
    },
    onError: (error) => {
      console.error('Error grading response:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to grade response',
        variant: 'destructive',
      });
    },
  });

  // Add mutations for draft actions
  const { mutate: approveDraftMutation } = useMutation({
    mutationFn: async ({
      draftId,
      content,
    }: {
      draftId: string;
      content: string;
    }) => {
      setApprovingDraftId(draftId);
      try {
        // Find the thread and draft
        const thread = threads.find((t) =>
          t.drafts?.some((d) => d.id === draftId)
        );
        const draft = thread?.drafts?.find((d) => d.id === draftId);
        if (!thread || !draft) throw new Error('Draft not found');

        // First approve the draft
        await approveDraft(draftId);

        // Then send the email with the updated content
        await sendEmailReply({
          threadId: thread.id,
          textBody: content, // Use the updated content with placeholders applied
          inReplyTo: thread.messages[thread.messages.length - 1].message_id,
        });
      } finally {
        setApprovingDraftId(null);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-threads', ticketId] });
      toast({
        title: 'Draft Approved and Sent',
        description: 'The draft has been approved and sent successfully',
      });
    },
    onError: (error) => {
      console.error('Error approving and sending draft:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to approve and send draft',
        variant: 'destructive',
      });
    },
  });

  const { mutate: rejectDraftMutation } = useMutation({
    mutationFn: async ({
      draftId,
      feedback,
    }: {
      draftId: string;
      feedback: string;
    }) => {
      await rejectDraft(draftId, feedback);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-threads', ticketId] });
      toast({
        title: 'Draft Rejected',
        description: 'The draft has been rejected successfully',
      });
    },
    onError: (error) => {
      console.error('Error rejecting draft:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to reject draft',
        variant: 'destructive',
      });
    },
  });

  const handleReplyToMessage = (
    thread: EmailThread,
    message: Tables<'email_messages'>
  ) => {
    setReplyContext({
      threadId: thread.id,
      inReplyTo: message.message_id,
      originalMessage: message,
    });
    setIsEmailReplyOpen(true);
  };

  const handleDraftAction = (
    thread: EmailThread,
    draft: Draft,
    action: 'edit' | 'approve' | 'reject'
  ) => {
    switch (action) {
      case 'approve':
        approveDraftMutation({ draftId: draft.id, content: draft.content });
        break;
      case 'reject':
        rejectDraftMutation({
          draftId: draft.id,
          feedback: draft.feedback || '',
        });
        break;
      case 'edit':
        // For edit action, open the reply window
        const lastMessage = thread.messages[thread.messages.length - 1];
        setReplyContext({
          threadId: thread.id,
          inReplyTo: lastMessage.message_id,
          originalMessage: lastMessage,
        });
        setEmailReplyText(draft.content);
        setSelectedDraft(draft);
        setIsEmailReplyOpen(true);
        break;
    }
  };

  const handleSendReply = () => {
    if (!emailReplyText.trim()) return;
    sendReply(emailReplyText);
  };

  const handleGradeResponse = () => {
    if (!emailReplyText.trim()) return;
    gradeReply();
  };

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <Loader2 className='h-4 w-4 animate-spin' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex h-full items-center justify-center text-destructive'>
        {error instanceof Error
          ? error.message
          : 'Failed to load email threads'}
      </div>
    );
  }

  if (!threads.length) {
    return (
      <div className='flex h-full items-center justify-center text-muted-foreground'>
        No email threads found for this ticket
      </div>
    );
  }

  return (
    <div className='flex h-full'>
      {/* Thread View */}
      <div
        className={cn(
          'flex flex-1 flex-col transition-[width] duration-200 ease-in-out',
          isEmailReplyOpen ? 'w-[60%]' : 'w-full'
        )}
      >
        <ScrollArea className='flex-1' viewportRef={viewportRef}>
          <div className='space-y-6 p-4 pb-16'>
            {threads.map((thread) => (
              <div key={thread.id} className='space-y-4'>
                {/* Render messages */}
                {thread.messages.map((message) => (
                  <EmailMessage
                    key={message.id}
                    thread={thread}
                    message={message}
                    onReply={handleReplyToMessage}
                  />
                ))}

                {/* Render auto-generated drafts */}
                {thread.drafts
                  ?.filter(shouldShowDraft)
                  .map((draft: Draft) => (
                    <DraftResponse
                      key={draft.id}
                      thread={thread}
                      draft={draft}
                      onDraftAction={handleDraftAction}
                      isApproving={approvingDraftId === draft.id}
                    />
                  ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Reply Panel */}
      <div
        className={cn(
          'h-full border-l bg-background transition-all duration-200 ease-in-out',
          isEmailReplyOpen ? 'w-[40%]' : 'w-0 border-l-0'
        )}
      >
        <ReplyPanel
          isOpen={isEmailReplyOpen}
          replyContext={replyContext}
          emailReplyText={emailReplyText}
          onEmailReplyTextChange={setEmailReplyText}
          onClose={() => {
            setIsEmailReplyOpen(false);
            setReplyContext(null);
          }}
          onSendReply={handleSendReply}
          onGradeResponse={handleGradeResponse}
          isSending={isSending}
          isGrading={isGrading}
          grade={grade}
          orgDomain={organization?.domain || ''}
        />
      </div>
    </div>
  );
}
