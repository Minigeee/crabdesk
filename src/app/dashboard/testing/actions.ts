'use server';

import { getCurrentUser } from '@/lib/auth/session';
import type { Tables } from '@/lib/database.types';
import { generateTestEmailPayload } from '@/lib/email/test-utils';
import { createServiceClient } from '@/lib/supabase/service';

type EmailThread = Tables<'email_threads'> & {
  messages: Tables<'email_messages'>[];
};

export async function getEmailThreads() {
  try {
    // Ensure user is authenticated
    const userData = await getCurrentUser();
    if (!userData) {
      throw new Error('Unauthorized');
    }

    const supabase = createServiceClient();

    // Fetch threads with messages
    const { data: threads, error } = await supabase
      .from('email_threads')
      .select(
        `
        *,
        messages: email_messages (
          *
        )
      `
      )
      .eq('org_id', userData.organization.id)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching threads:', error);
      throw new Error('Failed to fetch threads');
    }

    return threads as EmailThread[];
  } catch (error) {
    console.error('Error in getEmailThreads:', error);
    throw error;
  }
}

export async function sendTestEmail(data: {
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  includeAttachments?: boolean;
}) {
  try {
    // Ensure user is authenticated
    const userData = await getCurrentUser();
    if (!userData) {
      throw new Error('Unauthorized');
    }

    // Generate test email payload
    const postmarkPayload = generateTestEmailPayload({
      fromEmail: data.fromEmail,
      fromName: data.fromName,
      toEmail: data.toEmail,
      toName: data.toName,
      subject: data.subject,
      inReplyTo: data.inReplyTo,
      includeAttachments: data.includeAttachments,
    });

    // Add the body content
    postmarkPayload.TextBody = data.body;
    postmarkPayload.HtmlBody = `<html><body><p>${data.body.replace(/\n/g, '<br/>')}</p></body></html>`;
    postmarkPayload.StrippedTextReply = data.body;

    console.log('postmarkPayload', postmarkPayload);

    // Send to webhook endpoint
    const response = await fetch('http://localhost:3000/api/webhooks/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add a special header to identify test requests
        'X-Test-Email': 'true',
      },
      body: JSON.stringify(postmarkPayload),
    });

    if (!response.ok) {
      throw new Error('Failed to process test email');
    }

    const result = await response.json();
    return {
      messageId: postmarkPayload.MessageID,
      ...result,
    };
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
}
