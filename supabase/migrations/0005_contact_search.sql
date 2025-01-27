create or replace function search_contacts(
  p_org_id uuid,
  p_query text default '',
  p_limit int default 10,
  p_offset int default 0,
  p_order_by text default 'last_seen_at',
  p_ascending boolean default false
) returns table (
  contacts jsonb,
  total_count bigint
) language plpgsql security definer as $$
declare
  v_order_direction text;
  v_order_field text;
  v_query text;
begin
  -- Set order direction
  v_order_direction := case when p_ascending then 'asc' else 'desc' end;

  -- Handle special sorting for ticket counts
  case p_order_by
    when 'open_tickets_count' then
      v_order_field := 'open_tickets_count';
    when 'total_tickets_count' then
      v_order_field := 'total_tickets_count';
    else
      v_order_field := quote_ident(p_order_by);
  end case;

  -- Build the query
  v_query := format('
    with contact_counts as (
      select
        c.*,
        count(t.id) as total_tickets_count,
        count(t.id) filter (where t.status in (''open'', ''pending'')) as open_tickets_count
      from contacts c
      left join tickets t on t.contact_id = c.id and t.org_id = c.org_id
      where c.org_id = %L
      group by c.id
    )
    select
      (
        select jsonb_agg(row_to_json(t))
        from (
          select *
          from contact_counts
          where 
            case when %L <> '''' then
              email ilike ''%%'' || %L || ''%%'' or
              name ilike ''%%'' || %L || ''%%''
            else true end
          order by %s %s nulls last
          limit %L
          offset %L
        ) t
      ) as contacts,
      (
        select count(*)
        from contact_counts
        where 
          case when %L <> '''' then
            email ilike ''%%'' || %L || ''%%'' or
            name ilike ''%%'' || %L || ''%%''
          else true end
      ) as total_count
  ',
    p_org_id,
    p_query,
    p_query,
    p_query,
    v_order_field,
    v_order_direction,
    p_limit,
    p_offset,
    p_query,
    p_query,
    p_query
  );

  -- Execute the query
  return query execute v_query;
end;
$$; 