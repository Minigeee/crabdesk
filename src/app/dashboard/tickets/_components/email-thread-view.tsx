'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth/hooks';
import { Tables } from '@/lib/database.types';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronRight, Loader2, Mail, Reply, Star } from 'lucide-react';
import { getEmailThreads, sendEmailReply, gradeEmailResponse } from '../actions';
import { useTicketView } from './ticket-view-provider';
import type { ResponseGrade } from '@/lib/tickets/grader-service';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

const templates = [
  {
    id: 'technical-issue',
    title: 'Technical Issue Response',
    description: 'Response template for technical problems and API issues',
    body: "I understand you're experiencing technical difficulties with [specific feature/API]. I'm looking into this right now.\n\nTo help expedite the resolution:\n1. I've checked our system logs\n2. [Additional steps taken]\n\nIn the meantime, you can try [workaround if applicable].\n\nI'll keep you updated on our progress.\n\nBest regards,\n[Your name]",
  },
  {
    id: 'billing-inquiry',
    title: 'Billing Question',
    description: 'Handle billing, invoicing, and plan upgrade inquiries',
    body: "Thank you for your billing inquiry. I'd be happy to help clarify this for you.\n\n[Billing explanation/steps for upgrade]\n\nFor your reference:\n- Invoice details: [specifics]\n- Payment options: [list options]\n\nPlease let me know if you need any clarification.\n\nBest regards,\n[Your name]",
  },
  {
    id: 'feature-request',
    title: 'Feature Request Response',
    description: 'Acknowledge and respond to feature suggestions',
    body: "Thank you for taking the time to suggest this feature. We really value this kind of feedback from our users.\n\nI've documented your request for [feature] and shared it with our product team. Here's what you should know:\n- Current status: [status]\n- Similar features: [alternatives if any]\n\nWe'll keep you updated on any developments.\n\nBest regards,\n[Your name]",
  },
  {
    id: 'account-setup',
    title: 'Account Setup Help',
    description: 'Guide users through account setup and configuration',
    body: "Welcome! I'll help you get your account set up properly.\n\nHere are the key steps:\n1. [First step]\n2. [Second step]\n3. [Third step]\n\nPro tip: [Helpful suggestion]\n\nIf you need any clarification, don't hesitate to ask.\n\nBest regards,\n[Your name]",
  },
  {
    id: 'integration-support',
    title: 'Integration Support',
    description: 'Help with API integration and technical implementation',
    body: "I understand you're working on integrating with our [API/service]. Let me help you with that.\n\nRegarding your implementation:\n1. Documentation reference: [link]\n2. Best practices: [key points]\n3. Common pitfalls: [what to avoid]\n\nWould you like me to clarify any of these points?\n\nBest regards,\n[Your name]",
  }
];

type EmailThread = Tables<'email_threads'> & {
  messages: Tables<'email_messages'>[];
};

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

  // Fetch email threads
  const {
    data: threads = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['email-threads', ticketId],
    queryFn: () => getEmailThreads(ticketId),
  });

  // Add state for grade
  const [grade, setGrade] = React.useState<ResponseGrade | null>(null);

  // Send reply mutation
  const { mutate: sendReply, isPending: isSending } = useMutation({
    mutationFn: async (textBody: string) => {
      if (!replyContext) throw new Error('No message selected to reply to');
      return sendEmailReply({
        threadId: replyContext.threadId,
        textBody,
        inReplyTo: replyContext.inReplyTo,
      });
    },
    onSuccess: () => {
      setEmailReplyText('');
      setIsEmailReplyOpen(false);
      setReplyContext(null);
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

  const handleSendReply = () => {
    if (!emailReplyText.trim()) return;
    sendReply(emailReplyText);
  };

  const handleGradeResponse = () => {
    if (!emailReplyText.trim()) return;
    gradeReply();
  };

  // Helper function to get grade color
  const getGradeColor = (grade: number) => {
    switch (grade) {
      case 1: return 'text-destructive';
      case 2: return 'text-orange-500';
      case 3: return 'text-yellow-500';
      case 4: return 'text-green-500';
      case 5: return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  // Helper function to get grade label
  const getGradeLabel = (grade: number) => {
    switch (grade) {
      case 1: return 'Bad';
      case 2: return 'Poor';
      case 3: return 'Acceptable';
      case 4: return 'Good';
      case 5: return 'Great';
      default: return 'Unknown';
    }
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
        <ScrollArea className='flex-1'>
          <div className='space-y-6 p-4'>
            {threads.map((thread) =>
              thread.messages.map((message) => (
                <div key={message.id} className='w-full space-y-2'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <div className='font-medium'>
                        {message.from_name} ({message.from_email})
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        To: {message.to_emails.join(', ')}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='text-xs text-muted-foreground'>
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                        })}
                      </div>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleReplyToMessage(thread, message)}
                      >
                        <Reply className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                  <div className='border-l-2 pl-4'>
                    <div className='whitespace-pre-wrap rounded-md bg-muted p-3 text-sm'>
                      <div className='max-w-[65ch]'>{message.text_body}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
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
        {isEmailReplyOpen && replyContext && (
          <ScrollArea className='flex h-full flex-col'>
            <div className='flex h-14 items-center justify-between border-b px-4 py-2'>
              <h3 className='font-semibold'>New Reply</h3>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => {
                  setIsEmailReplyOpen(false);
                  setReplyContext(null);
                }}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>

            <div className='border-b bg-muted/50 px-4 py-3 text-sm'>
              <div className='space-y-2'>
                <div className='flex items-start gap-2'>
                  <span className='w-16 font-medium'>From:</span>
                  <div>{`Support Team <support@${organization?.domain}>`}</div>
                </div>
                <div className='flex items-start gap-2'>
                  <span className='w-16 font-medium'>To:</span>
                  <div>
                    {`${replyContext.originalMessage.from_name} <${replyContext.originalMessage.from_email}>`}
                  </div>
                </div>
                <div className='flex items-start gap-2'>
                  <span className='w-16 font-medium'>Subject:</span>
                  <div>{replyContext.originalMessage.subject}</div>
                </div>
                <div className='mt-2 rounded-md bg-muted p-3 text-xs text-muted-foreground'>
                  <div className='mb-1 font-medium'>In Reply To:</div>
                  <div className='line-clamp-3 opacity-70'>
                    {replyContext.originalMessage.text_body}
                  </div>
                </div>
              </div>
            </div>

            <div className='flex-1 space-y-4 p-4'>
              <div className='flex items-center justify-between'>
                <h4 className='text-sm font-medium'>Email Template</h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      className='w-[200px] justify-between'
                    >
                      Select template
                      <ChevronDown className='ml-2 h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className='w-[200px]'>
                    {templates.map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onSelect={() => setEmailReplyText(template.body)}
                        className='flex flex-col items-start py-3'
                      >
                        <div className='font-medium'>{template.title}</div>
                        <div className='text-xs text-muted-foreground'>
                          {template.description}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Textarea
                value={emailReplyText}
                onChange={(e) => setEmailReplyText(e.target.value)}
                placeholder='Type your reply...'
                className='min-h-[300px] flex-1 resize-none'
              />

              {grade && (
                <div className='rounded-md border bg-muted/50 p-3'>
                  <div className='mb-2 flex items-center gap-2'>
                    <Star className={cn('h-4 w-4', getGradeColor(grade.grade))} />
                    <span className='font-medium'>
                      Grade: {getGradeLabel(grade.grade)}
                    </span>
                  </div>
                  <p className='text-sm text-muted-foreground'>{grade.summary}</p>
                  {(grade.strengths.length > 0 || grade.improvements.length > 0) && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant='link' className='mt-2 h-auto p-0 text-xs'>
                          View Details
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className='w-80'>
                        {grade.strengths.length > 0 && (
                          <div className='prose mb-3'>
                            <div className='mb-1 font-medium'>Strengths:</div>
                            <ul className='text-sm text-muted-foreground'>
                              {grade.strengths.map((strength, i) => (
                                <li key={i}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {grade.improvements.length > 0 && (
                          <div className='prose'>
                            <div className='mb-1 font-medium'>
                              Areas for Improvement:
                            </div>
                            <ul className='text-sm text-muted-foreground'>
                              {grade.improvements.map((improvement, i) => (
                                <li key={i}>{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </HoverCardContent>
                    </HoverCard>
                  )}
                </div>
              )}

              <div className='flex justify-end gap-2'>
                <Button
                  variant='outline'
                  onClick={handleGradeResponse}
                  disabled={isGrading || !emailReplyText.trim()}
                >
                  {isGrading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Grading...
                    </>
                  ) : (
                    <>
                      <Star className='mr-2 h-4 w-4' />
                      Grade Response
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleSendReply}
                  disabled={isSending || !emailReplyText.trim()}
                >
                  {isSending ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className='mr-2 h-4 w-4' />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
