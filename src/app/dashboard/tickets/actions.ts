'use server';

import { getCurrentUser } from '@/lib/auth/session';
import { EmailProcessingService } from '@/lib/email/service';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ResponseGraderService } from '@/lib/tickets/grader-service';
import { revalidatePath } from 'next/cache';

/**
 * NOTE: In production, these actions would interact with a real email service API.
 * For development, we're using direct database access as a stand-in for the email service.
 * This allows us to simulate email functionality without setting up actual email integration.
 */

export async function getEmailThreads(ticketId: string) {
  const userData = await getCurrentUser();
  if (!userData) {
    throw new Error('Not authenticated');
  }

  // In production, we would check permissions against the email service
  // For now, we'll do a basic check that the user has access to the organization
  const supabase = createServiceClient();

  // Verify ticket belongs to user's organization
  const { data: ticket } = await supabase
    .from('tickets')
    .select('org_id')
    .eq('id', ticketId)
    .single();

  if (!ticket || ticket.org_id !== userData.organization.id) {
    throw new Error('Not authorized to access this ticket');
  }

  const emailService = new EmailProcessingService(userData.organization.id);
  const threads = await emailService.getThreadsForTicket(ticketId);
  return threads;
}

export async function sendEmailReply({
  threadId,
  textBody,
  inReplyTo,
}: {
  threadId: string;
  textBody: string;
  inReplyTo: string;
}) {
  const userData = await getCurrentUser();
  if (!userData) {
    throw new Error('Not authenticated');
  }

  const supabase = createServiceClient();

  // Verify thread belongs to user's organization
  const { data: thread } = await supabase
    .from('email_threads')
    .select('org_id, ticket_id, provider_message_ids')
    .eq('id', threadId)
    .single();

  if (!thread || thread.org_id !== userData.organization.id) {
    throw new Error('Not authorized to access this thread');
  }

  // Get the message we're replying to
  const { data: originalMessage } = await supabase
    .from('email_messages')
    .select('*')
    .eq('message_id', inReplyTo)
    .single();

  if (!originalMessage) {
    throw new Error('Original message not found');
  }

  // Get organization domain for support email
  const { data: organization } = await supabase
    .from('organizations')
    .select('domain')
    .eq('id', userData.organization.id)
    .single();

  if (!organization) {
    throw new Error('Organization not found');
  }

  const supportEmail = `support@${organization.domain}`;

  const emailService = new EmailProcessingService(userData.organization.id);

  const message = await emailService.writeEmailReply({
    threadId,
    fromEmail: supportEmail,
    fromName: userData.user.name,
    toEmails: [originalMessage.from_email],
    subject: originalMessage.subject,
    textBody,
    inReplyTo,
    referenceIds: thread.provider_message_ids,
  });

  revalidatePath(`/dashboard/tickets/${thread.ticket_id}`);
  return message;
}

export async function gradeEmailResponse(threadId: string, response: string) {
  const supabase = createServiceClient();
  const userData = await getCurrentUser();

  if (!userData) {
    throw new Error('Not authenticated');
  }

  const graderService = new ResponseGraderService(
    supabase,
    userData.organization.id
  );
  return graderService.gradeResponse(threadId, response);
}

export async function getDrafts(threadId: string) {
  const supabase = await createClient();
  const { data: drafts, error } = await supabase
    .from('response_drafts')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return drafts;
}

export async function approveDraft(draftId: string) {
  const supabase = await createClient();
  const userData = await getCurrentUser();
  if (!userData) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('response_drafts')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: userData.user.id,
    })
    .eq('id', draftId);

  if (error) throw error;
}

export async function modifyDraft(draftId: string, modifiedContent: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('response_drafts')
    .update({
      status: 'modified',
      modified_content: modifiedContent,
    })
    .eq('id', draftId);

  if (error) throw error;
}

export async function rejectDraft(draftId: string, feedback: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('response_drafts')
    .update({
      status: 'rejected',
      feedback,
    })
    .eq('id', draftId);

  if (error) throw error;
}
