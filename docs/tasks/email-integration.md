# Email Integration Tasks

## Email Processing Core

**Context**: Implement webhook endpoint and processing system that can handle Postmark-formatted email data. For development, we'll create a testing tool to simulate incoming emails without actual email service integration.

**Considerations**:

- Email thread table needs provider_thread_id and provider_message_ids for reliable threading
- Webhook needs to validate payload format matches Postmark's schema
- Create test data generator that matches Postmark's inbound webhook format
- Edge functions need proper error handling and retry mechanisms
- Email content should be sanitized before storage
- Test data should simulate various email scenarios (new threads, replies, attachments)

### Initial Setup

[X] Research and document Postmark's inbound webhook payload format
[X] Create test data generator for simulating email webhooks
[X] Set up edge function endpoint for webhook
[X] Create basic email payload validation

### Core Email Processing

[X] Create edge function for processing webhook data
[X] Implement email parsing (from, to, subject, body)
[X] Set up thread detection and tracking
[X] Store email content and metadata in Supabase

### Testing Infrastructure

[X] Create UI tool for sending test emails to webhook
[X] Add preset templates for common email scenarios
[X] Implement attachment simulation
[X] Add delay simulation for testing real-world scenarios

### Basic Email Features

[X] Implement email sending through internal system
[X] Add reply handling with proper thread maintenance
[X] Set up basic email templates for responses
[ ] Handle attachments using Supabase storage (skip for now)

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

[X] Add assign button to ticket view
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
