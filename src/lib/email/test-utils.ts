import { faker } from '@faker-js/faker';
import type { PostmarkWebhookPayload } from './types';

export function generateTestEmailPayload(
  options: {
    fromEmail?: string;
    fromName?: string;
    toEmail?: string;
    toName?: string;
    subject?: string;
    inReplyTo?: string;
    references?: string[];
    includeAttachments?: boolean;
  } = {}
): PostmarkWebhookPayload {
  const messageId = `<${faker.string.uuid()}@${faker.internet.domainName()}>`;

  const payload: PostmarkWebhookPayload = {
    FromFull: {
      Email: options.fromEmail ?? faker.internet.email(),
      Name: options.fromName ?? faker.person.fullName(),
    },
    ToFull: [
      {
        Email: options.toEmail ?? faker.internet.email(),
        Name: options.toName ?? faker.person.fullName(),
      },
    ],
    Subject: options.subject ?? faker.lorem.sentence(),
    TextBody: faker.lorem.paragraphs(),
    HtmlBody: `<html><body><p>${faker.lorem.paragraphs()}</p></body></html>`,
    StrippedTextReply: faker.lorem.paragraph(),
    MessageID: messageId,
    InReplyTo: options.inReplyTo,
    References: options.references?.join(' '),
    Headers: [
      { Name: 'Message-ID', Value: messageId },
      { Name: 'Date', Value: new Date().toUTCString() },
      { Name: 'MIME-Version', Value: '1.0' },
    ],
  };

  if (options.includeAttachments) {
    payload.Attachments = [
      {
        Name: 'test.pdf',
        Content: faker.string.alphanumeric(100),
        ContentType: 'application/pdf',
        ContentLength: 1024,
      },
      {
        Name: 'image.png',
        Content: faker.string.alphanumeric(100),
        ContentType: 'image/png',
        ContentLength: 2048,
      },
    ];
  }

  return payload;
}

export function generateEmailThread(
  count: number = 3
): PostmarkWebhookPayload[] {
  const thread: PostmarkWebhookPayload[] = [];
  const fromEmail = faker.internet.email();
  const fromName = faker.person.fullName();
  const toEmail = faker.internet.email();
  const toName = faker.person.fullName();
  const subject = faker.lorem.sentence();

  // Initial email
  thread.push(
    generateTestEmailPayload({
      fromEmail,
      fromName,
      toEmail,
      toName,
      subject,
    })
  );

  // Replies
  const references: string[] = [thread[0].MessageID];
  for (let i = 1; i < count; i++) {
    const isCustomerReply = i % 2 === 0;
    thread.push(
      generateTestEmailPayload({
        fromEmail: isCustomerReply ? fromEmail : toEmail,
        fromName: isCustomerReply ? fromName : toName,
        toEmail: isCustomerReply ? toEmail : fromEmail,
        toName: isCustomerReply ? toName : fromName,
        subject: `Re: ${subject}`,
        inReplyTo: thread[i - 1].MessageID,
        references: [...references],
        includeAttachments: Math.random() > 0.7,
      })
    );
    references.push(thread[i].MessageID);
  }

  return thread;
}
