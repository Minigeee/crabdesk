# Portal System Tasks

## Contact to Portal User Flow
The foundation of the portal system revolves around converting email-based contacts into portal users. When customers email support, they become contacts in our system. To access the portal, they need a secure way to convert their contact status into a portal user account. This section handles the secure link generation and account connection process.

1. [X] Portal Link Generation System
   - Create secure link generation for contact portal access
   - Add expiration and single-use functionality for links
   - Create system to validate and process these links
   - Handle edge cases (expired links, already registered users)

2. [X] Contact-Portal User Connection
   - Link contacts to portal users during account creation
   - Handle existing contacts without portal users
   - Connect all contact's tickets to new portal user
   - Maintain email-based ticket association

## Portal Authentication
Authentication in the portal system needs to handle both new and existing users, while maintaining the connection to their contact profile and associated tickets. The system must be able to derive the correct organization context from the access link to ensure users only see their relevant organization's interface.

3. [X] Portal Authentication Flow
   - Create portal signup/login pages
   - Add email verification step
   - Handle linking existing contact data during signup
   - Set up organization context from ticket link

## Portal UI
The portal interface needs to be simple and focused, allowing customers to view and manage their support tickets. It must handle both authenticated and unauthenticated states gracefully, and clearly display organization branding to maintain context. The UI should guide users through the authentication process when needed.

4. [ ] Portal Layout
   - Create basic portal navigation structure
   - Add organization branding display
   - Add user authentication status display
   - Create unauthenticated view states

5. [X] Ticket Access Flow
   - Create public ticket link handler
   - Show appropriate UI for unauthenticated users
   - Guide users through account creation if needed
   - Redirect to full ticket view after authentication

6. [ ] Ticket List View
   - Display all tickets associated with user's email
   - Show ticket status and history
   - Add sorting and basic filtering
   - Handle empty states

7. [ ] Single Ticket View
   - Display full ticket conversation thread
   - Show ticket status and metadata
   - Add reply functionality
   - Handle loading and error states

## Dashboard Integration
Support agents need the ability to manually generate portal access links for contacts. This section adds UI elements to the agent dashboard that allow them to create and manage these links. This functionality will be used to test the portal access system before implementing the automated email flow.

8. [ ] Portal Link Generation UI
   - Add "Generate Portal Link" button to ticket view
   - Create link generation modal/form
   - Show link status (used/expired)
   - Add copy-to-clipboard functionality

## Notes
- All tasks should include error handling and loading states
- Focus on text-only content for MVP
- Portal is secondary to email interaction
- Account creation is optional, triggered by portal access
- System must handle both authenticated and unauthenticated states 