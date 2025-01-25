import { type Tables, type Json } from '../database.types';

// Provider-agnostic email interfaces
export interface EmailAddress {
  email: string;
  name?: string | null;
}

export interface EmailContent {
  messageId: string;
  inReplyTo?: string | null;
  referenceIds?: string[];
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  textBody?: string | null;
  htmlBody?: string | null;
  headers: Record<string, string>;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  name: string;
  content: string; // Base64 encoded
  contentType: string;
  size: number;
}

// Provider-specific interfaces
export interface PostmarkWebhookPayload {
  FromFull: {
    Email: string;
    Name?: string;
  };
  ToFull: Array<{
    Email: string;
    Name?: string;
  }>;
  CcFull?: Array<{
    Email: string;
    Name?: string;
  }>;
  BccFull?: Array<{
    Email: string;
    Name?: string;
  }>;
  Subject: string;
  TextBody?: string;
  HtmlBody?: string;
  StrippedTextReply?: string;
  MessageID: string;
  InReplyTo?: string;
  References?: string;
  Headers: Array<{
    Name: string;
    Value: string;
  }>;
  Attachments?: Array<{
    Name: string;
    Content: string;
    ContentType: string;
    ContentLength: number;
  }>;
}

export interface ProcessedEmailData extends EmailContent {}

export interface EmailThread extends Tables<'email_threads'> {
  ticket?: Tables<'tickets'>;
  messages?: Tables<'email_messages'>[];
}

export interface EmailMessage extends Tables<'email_messages'> {}

export interface EmailProcessingResult {
  thread: EmailThread;
  ticket: Tables<'tickets'>;
  message: EmailMessage;
  attachments?: Tables<'attachments'>[];
  contact: Tables<'contacts'>;
}

// Email provider interface
export interface EmailProvider {
  fetchMessage(messageId: string): Promise<EmailContent>;
  fetchThread(threadId: string): Promise<EmailContent[]>;
  sendMessage(content: EmailContent): Promise<void>;
} 