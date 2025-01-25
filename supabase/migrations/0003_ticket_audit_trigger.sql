-- Enable pgcrypto for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to get the user ID
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  WITH auth_id AS (
    SELECT auth.uid()::uuid AS id
  )
  SELECT i.id
  FROM auth_id a
  LEFT JOIN public.users i ON i.auth_user_id = a.id
  WHERE a.id IS NOT NULL;
$$;

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION public.create_ticket_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  changes_json jsonb;
  actor_id uuid;
BEGIN
  -- Get the internal user ID (will be null for system changes)
  actor_id := public.current_user_id();
  
  -- For INSERT operations
  IF (TG_OP = 'INSERT') THEN
    changes_json := jsonb_build_object(
      'new', row_to_json(NEW)::jsonb - 'created_at' - 'updated_at'
    );
  
  -- For UPDATE operations
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Only create audit log if there are actual changes
    IF OLD = NEW THEN
      RETURN NEW;
    END IF;
    
    -- Initialize changes with empty objects
    changes_json := jsonb_build_object('old', '{}'::jsonb, 'new', '{}'::jsonb);
    
    -- Compare each field and only include those that changed
    IF OLD.subject IS DISTINCT FROM NEW.subject THEN
      changes_json = jsonb_set(changes_json, '{old,subject}', to_jsonb(OLD.subject));
      changes_json = jsonb_set(changes_json, '{new,subject}', to_jsonb(NEW.subject));
    END IF;
    
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      changes_json = jsonb_set(changes_json, '{old,status}', to_jsonb(OLD.status));
      changes_json = jsonb_set(changes_json, '{new,status}', to_jsonb(NEW.status));
    END IF;
    
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      changes_json = jsonb_set(changes_json, '{old,priority}', to_jsonb(OLD.priority));
      changes_json = jsonb_set(changes_json, '{new,priority}', to_jsonb(NEW.priority));
    END IF;
    
    IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
      changes_json = jsonb_set(changes_json, '{old,assignee_id}', COALESCE(to_jsonb(OLD.assignee_id), 'null'::jsonb));
      changes_json = jsonb_set(changes_json, '{new,assignee_id}', COALESCE(to_jsonb(NEW.assignee_id), 'null'::jsonb));
    END IF;
    
    IF OLD.team_id IS DISTINCT FROM NEW.team_id THEN
      changes_json = jsonb_set(changes_json, '{old,team_id}', COALESCE(to_jsonb(OLD.team_id), 'null'::jsonb));
      changes_json = jsonb_set(changes_json, '{new,team_id}', COALESCE(to_jsonb(NEW.team_id), 'null'::jsonb));
    END IF;
    
    IF OLD.metadata IS DISTINCT FROM NEW.metadata THEN
      changes_json = jsonb_set(changes_json, '{old,metadata}', COALESCE(to_jsonb(OLD.metadata), '{}'::jsonb));
      changes_json = jsonb_set(changes_json, '{new,metadata}', COALESCE(to_jsonb(NEW.metadata), '{}'::jsonb));
    END IF;
  
  -- For DELETE operations
  ELSIF (TG_OP = 'DELETE') THEN
    changes_json := jsonb_build_object(
      'old', row_to_json(OLD)::jsonb - 'created_at' - 'updated_at'
    );
  END IF;

  -- Insert the audit log
  INSERT INTO public.audit_logs (
    org_id,
    action,
    entity_type,
    entity_id,
    actor_id,
    changes
  ) VALUES (
    CASE TG_OP
      WHEN 'INSERT' THEN NEW.org_id
      WHEN 'UPDATE' THEN NEW.org_id
      WHEN 'DELETE' THEN OLD.org_id
    END,
    lower(TG_OP)::audit_log_action,  -- 'insert', 'update', or 'delete'
    'ticket',
    CASE TG_OP
      WHEN 'INSERT' THEN NEW.id
      WHEN 'UPDATE' THEN NEW.id
      WHEN 'DELETE' THEN OLD.id
    END,
    actor_id,  -- Will be null for system changes
    changes_json
  );

  -- Return the appropriate record
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for ticket table
DROP TRIGGER IF EXISTS ticket_audit_trigger ON public.tickets;

CREATE TRIGGER ticket_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE
  ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.create_ticket_audit_log();

-- Add comment
COMMENT ON FUNCTION public.create_ticket_audit_log IS 'Automatically creates audit log entries for ticket changes'; 