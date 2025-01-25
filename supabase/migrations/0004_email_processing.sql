-- Create email processing function
CREATE OR REPLACE FUNCTION public.process_email(
  p_org_id uuid,
  p_from_email text,
  p_from_name text,
  p_to_email text,
  p_subject text,
  p_message_id text,
  p_in_reply_to text DEFAULT NULL,
  p_reference_ids text[] DEFAULT ARRAY[]::text[],
  p_headers jsonb DEFAULT '{}'::jsonb,
  p_text_body text DEFAULT '',
  p_html_body text DEFAULT '',
  p_raw_payload jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contact_id uuid;
  v_ticket_id uuid;
  v_thread_id uuid;
  v_message_id uuid;
  v_now timestamptz;
  v_thread_exists boolean;
  v_result jsonb;
BEGIN
  -- Start transaction
  v_now := now();

  -- Find or create contact
  INSERT INTO public.contacts (
    org_id,
    email,
    name,
    first_seen_at,
    last_seen_at,
    created_at,
    updated_at
  )
  VALUES (
    p_org_id,
    p_from_email,
    p_from_name,
    v_now,
    v_now,
    v_now,
    v_now
  )
  ON CONFLICT (org_id, email) DO UPDATE
  SET
    last_seen_at = v_now,
    name = COALESCE(EXCLUDED.name, contacts.name),
    updated_at = v_now
  RETURNING id INTO v_contact_id;

  -- Check if this is a reply to an existing thread
  SELECT EXISTS (
    SELECT 1
    FROM public.email_threads
    WHERE org_id = p_org_id
    AND (
      (p_in_reply_to IS NOT NULL AND message_id = p_in_reply_to)
      OR (p_reference_ids IS NOT NULL AND provider_message_ids && p_reference_ids)
    )
  ) INTO v_thread_exists;

  -- If no existing thread, create new ticket
  IF NOT v_thread_exists THEN
    INSERT INTO public.tickets (
      org_id,
      contact_id,
      subject,
      status,
      priority,
      source,
      created_at,
      updated_at
    )
    VALUES (
      p_org_id,
      v_contact_id,
      p_subject,
      'open',
      'normal',
      'email',
      v_now,
      v_now
    )
    RETURNING id INTO v_ticket_id;
  ELSE
    -- Get ticket ID from existing thread
    SELECT t.id INTO v_ticket_id
    FROM public.tickets t
    JOIN public.email_threads et ON et.ticket_id = t.id
    WHERE et.org_id = p_org_id
    AND (
      (p_in_reply_to IS NOT NULL AND et.message_id = p_in_reply_to)
      OR (p_reference_ids IS NOT NULL AND et.provider_message_ids && p_reference_ids)
    )
    LIMIT 1;

    -- Update ticket timestamp
    UPDATE public.tickets
    SET updated_at = v_now
    WHERE id = v_ticket_id;
  END IF;

  -- Create or update thread
  INSERT INTO public.email_threads (
    org_id,
    ticket_id,
    provider_thread_id,
    provider_message_ids,
    from_email,
    to_email,
    subject,
    last_message_at,
    message_id,
    in_reply_to,
    reference_ids,
    headers,
    raw_payload,
    created_at,
    updated_at
  )
  VALUES (
    p_org_id,
    v_ticket_id,
    CASE 
      WHEN p_in_reply_to IS NOT NULL AND p_in_reply_to != '' THEN p_in_reply_to 
      ELSE p_message_id 
    END,
    ARRAY[p_message_id],
    p_from_email,
    p_to_email,
    p_subject,
    v_now,
    p_message_id,
    NULLIF(p_in_reply_to, ''),
    p_reference_ids,
    p_headers,
    p_raw_payload,
    v_now,
    v_now
  )
  ON CONFLICT (org_id, provider_thread_id) DO UPDATE
  SET
    provider_message_ids = array_append(email_threads.provider_message_ids, p_message_id),
    last_message_at = v_now,
    updated_at = v_now
  RETURNING id INTO v_thread_id;

  -- Create message
  INSERT INTO public.email_messages (
    thread_id,
    message_id,
    in_reply_to,
    reference_ids,
    from_email,
    from_name,
    to_emails,
    subject,
    text_body,
    html_body,
    headers,
    created_at
  )
  VALUES (
    v_thread_id,
    p_message_id,
    NULLIF(p_in_reply_to, ''),
    p_reference_ids,
    p_from_email,
    p_from_name,
    ARRAY[p_to_email],
    p_subject,
    p_text_body,
    p_html_body,
    p_headers,
    v_now
  )
  RETURNING id INTO v_message_id;

  -- Build result
  SELECT jsonb_build_object(
    'thread', row_to_json(t),
    'ticket', row_to_json(tk),
    'message', row_to_json(m),
    'contact', row_to_json(c)
  ) INTO v_result
  FROM public.email_threads t
  JOIN public.tickets tk ON tk.id = t.ticket_id
  JOIN public.email_messages m ON m.thread_id = t.id
  JOIN public.contacts c ON c.id = tk.contact_id
  WHERE t.id = v_thread_id
  AND m.id = v_message_id;

  RETURN v_result;
END;
$$; 