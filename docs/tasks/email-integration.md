# Email Integration Tasks

## Email Processing Core

**Context**: Implement essential email processing using Postmark for reliable email handling and thread tracking.

**Considerations**:
- Email thread table needs provider_thread_id and provider_message_ids for reliable threading
- Organizations need to store their email domain and Postmark settings
- Attachments should be stored with content-type and size validation
- Edge functions need proper error handling and retry mechanisms
- Rate limiting should be considered for the webhook endpoint
- Email content should be sanitized before storage

### Initial Setup
[ ] Set up Postmark account and get API credentials
[ ] Add environment variables for Postmark configuration
[ ] Create MessageStream for support tickets
[ ] Set up inbound webhook domain

### Core Email Processing
[ ] Create edge function for inbound email webhook
[ ] Implement basic email parsing (from, to, subject, body)
[ ] Set up thread detection and tracking
[ ] Store email content and metadata in Supabase

### Basic Email Features
[ ] Implement email sending through Postmark
[ ] Add reply handling with proper thread maintenance
[ ] Set up basic email templates for responses
[ ] Handle attachments using Supabase storage

## Ticket Assignment (Basic)

**Context**: Simple but effective ticket routing system focusing on essential functionality.

**Considerations**:
- Tickets table needs assignee_id and team_id fields
- Track assignment history in audit_logs table
- Consider team working hours when doing round-robin
- Need to handle reassignment edge cases (user unavailable, team changes)
- Cache current ticket counts per agent for load checking
- Consider implementing a basic assignment queue

### Core Assignment
[ ] Implement basic round-robin assignment
[ ] Add manual assignment capability
[ ] Create simple team-based routing
[ ] Add basic load checking (ticket count per agent)

### Assignment UI
[ ] Add assign button to ticket view
[ ] Create simple team assignment dropdown
[ ] Add bulk assignment capability to ticket list
[ ] Display current assignee and assignment history

## Auto-categorization (Minimal)

**Context**: Simple categorization system using basic rules and patterns.

**Considerations**:
- Categories should be organization-specific
- Store category rules in a queryable format
- Consider using an array of tags in tickets table
- Priority rules should be simple and documented
- Category changes should be tracked in audit_logs
- Consider implementing a basic matching score system

### Basic Categorization
[ ] Implement simple keyword-based categorization
[ ] Add basic priority detection from email content
[ ] Create manual category override capability
[ ] Set up default categories for common issues

### Category Management
[ ] Create basic category CRUD interface
[ ] Add simple rule editor for keywords
[ ] Implement category assignment in ticket view
[ ] Add bulk categorization in ticket list

## Implementation Order

1. Start with Email Processing Core
   - This is the foundation for ticket creation
   - Focus on reliable email receiving and sending
   - Ensure proper thread tracking

2. Then Basic Assignment
   - Keep it simple with manual and round-robin
   - Add team routing once basic assignment works

3. Finally Basic Categorization
   - Start with manual categorization
   - Add simple keyword matching later

## Technical Notes

- Use Postmark for all email handling
- Store attachments in Supabase storage
- Use edge functions for webhooks
- Keep email templates simple (text-based first)
- Focus on reliability over features 