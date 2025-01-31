import { z } from 'zod';
import type { PostmarkWebhookPayload, ProcessedEmailData } from './types';

const emailAddressSchema = z.object({
  Email: z.string().email(),
  Name: z.string().optional(),
});

const attachmentSchema = z.object({
  Name: z.string(),
  Content: z.string(),
  ContentType: z.string(),
  ContentLength: z.number().positive(),
});

const headerSchema = z.object({
  Name: z.string(),
  Value: z.string(),
});

export const postmarkWebhookSchema = z.object({
  FromFull: emailAddressSchema,
  ToFull: z.array(emailAddressSchema),
  CcFull: z.array(emailAddressSchema).optional(),
  BccFull: z.array(emailAddressSchema).optional(),
  Subject: z.string(),
  TextBody: z.string().optional(),
  HtmlBody: z.string().optional(),
  StrippedTextReply: z.string().optional(),
  MessageID: z.string(),
  InReplyTo: z.string().optional(),
  References: z.string().optional(),
  Headers: z.array(headerSchema),
  Attachments: z.array(attachmentSchema).optional(),
});

export function validatePostmarkPayload(
  payload: unknown
): PostmarkWebhookPayload {
  return postmarkWebhookSchema.parse(payload);
}

export function processEmailPayload(
  payload: PostmarkWebhookPayload
): ProcessedEmailData {
  const headers: Record<string, string> = {};
  for (const header of payload.Headers) {
    headers[header.Name.toLowerCase()] = header.Value;
  }

  const references = payload.References?.split(/\\s+/).filter(Boolean) ?? [];
  if (payload.InReplyTo && !references.includes(payload.InReplyTo)) {
    references.unshift(payload.InReplyTo);
  }

  return {
    from: {
      email: payload.FromFull.Email,
      name: payload.FromFull.Name,
    },
    to: payload.ToFull.map((to) => ({
      email: to.Email,
      name: to.Name,
    })),
    cc: payload.CcFull?.map((cc) => ({
      email: cc.Email,
      name: cc.Name,
    })),
    bcc: payload.BccFull?.map((bcc) => ({
      email: bcc.Email,
      name: bcc.Name,
    })),
    subject: payload.Subject,
    textBody: payload.TextBody,
    htmlBody: payload.HtmlBody,
    messageId: payload.MessageID,
    inReplyTo: payload.InReplyTo,
    referenceIds: references,
    headers,
    attachments: payload.Attachments?.map((att) => ({
      name: att.Name,
      content: att.Content,
      contentType: att.ContentType,
      size: att.ContentLength,
    })),
  };
}
