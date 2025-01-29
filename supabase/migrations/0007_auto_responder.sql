-- Create enum for draft status
CREATE TYPE draft_status AS ENUM ('pending', 'approved', 'rejected', 'modified');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create table for response drafts
CREATE TABLE response_drafts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES organizations(id),
    thread_id uuid NOT NULL REFERENCES email_threads(id),
    ticket_id uuid NOT NULL REFERENCES tickets(id),
    content text NOT NULL,
    status draft_status NOT NULL DEFAULT 'pending',
    grade jsonb,
    metadata jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    approved_at timestamptz,
    approved_by uuid REFERENCES users(id),
    modified_content text,
    feedback text
);

-- Add indexes
CREATE INDEX response_drafts_thread_idx ON response_drafts(thread_id);
CREATE INDEX response_drafts_ticket_idx ON response_drafts(ticket_id);
CREATE INDEX response_drafts_status_idx ON response_drafts(org_id, status);

-- Add RLS policies
ALTER TABLE response_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read drafts in their organization"
    ON response_drafts
    FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM users WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "System can create drafts"
    ON response_drafts
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update drafts in their organization"
    ON response_drafts
    FOR UPDATE
    USING (org_id IN (
        SELECT org_id FROM users WHERE auth_user_id = auth.uid()
    ));

-- Create trigger to update updated_at
CREATE TRIGGER set_response_drafts_timestamp
    BEFORE UPDATE ON response_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 