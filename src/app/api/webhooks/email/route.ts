import { EmailProcessingService } from '@/lib/email/service';
import {
  processEmailPayload,
  validatePostmarkPayload,
} from '@/lib/email/validation';
import { createServiceClient } from '@/lib/supabase/service';
import { headers } from 'next/headers';

// TODO: Implement proper webhook signature verification
// const WEBHOOK_SECRET = process.env.POSTMARK_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const isTestEmail = headersList.get('X-Test-Email') === 'true';

    // Only verify signature for non-test emails
    if (!isTestEmail) {
      const signature = headersList.get('X-Postmark-Signature') ?? null;
      if (!signature) {
        return Response.json(
          { error: 'Missing webhook signature' },
          { status: 401 }
        );
      }
      // TODO: Verify signature
    }

    // Parse and validate payload
    const rawPayload = await request.json();
    const payload = validatePostmarkPayload(rawPayload);
    const processedData = processEmailPayload(payload);

    // Initialize Supabase client
    const supabase = createServiceClient();

    // Extract organization ID from email domain
    const [, domain] = processedData.to[0].email.split('@');
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('domain', domain)
      .single();

    if (orgError || !org) {
      console.error('Organization not found for domain:', domain);
      return Response.json({ error: 'Invalid organization' }, { status: 400 });
    }

    // Process email
    const emailService = new EmailProcessingService(org.id);
    const result = await emailService.processEmail(processedData);

    // Return success response
    return Response.json(
      { message: 'Email processed successfully', result },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing email webhook:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
