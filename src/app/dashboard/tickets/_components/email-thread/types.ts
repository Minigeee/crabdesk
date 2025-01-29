import { Tables } from '@/lib/database.types';
import type { ResponseGrade } from '@/lib/tickets/grader-service';

export type EmailThread = Tables<'email_threads'> & {
  messages: Tables<'email_messages'>[];
  drafts?: Tables<'response_drafts'>[];
};

export type Draft = Tables<'response_drafts'> & {
  grade: ResponseGrade | null;
};

export type ReplyContext = {
  threadId: string;
  inReplyTo: string;
  originalMessage: Tables<'email_messages'>;
};

export type EmailTemplate = {
  id: string;
  title: string;
  description: string;
  body: string;
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
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
  },
]; 