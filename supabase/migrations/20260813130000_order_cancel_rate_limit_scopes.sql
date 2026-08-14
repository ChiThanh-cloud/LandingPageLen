-- Extends the deployed order limiter with isolated cancellation scopes.
-- The application sends only HMAC-derived keys; no customer PII is stored.

alter table private.order_creation_rate_limits
  drop constraint if exists order_creation_rate_limits_scope_valid;

alter table private.order_creation_rate_limits
  add constraint order_creation_rate_limits_scope_valid check (
    scope in (
      'ip_burst',
      'ip_sustained',
      'ip_phone',
      'lookup_ip_burst',
      'lookup_ip_sustained',
      'lookup_ip_order',
      'cancel_ip_burst',
      'cancel_ip_sustained',
      'cancel_ip_order'
    )
  );

create or replace function public.check_order_creation_rate_limits(p_entries jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_scope text;
  v_key_hash text;
  v_limit integer;
  v_window_seconds integer;
  v_attempt_count integer;
  v_window_started_at timestamptz;
  v_retry_after integer := 0;
  v_limited boolean := false;
  v_entry_count integer;
begin
  if p_entries is null or pg_catalog.jsonb_typeof(p_entries) <> 'array' then
    raise exception using message = 'INVALID_RATE_LIMIT_REQUEST', errcode = 'P0001';
  end if;

  v_entry_count := pg_catalog.jsonb_array_length(p_entries);
  if v_entry_count < 1 or v_entry_count > 2 then
    raise exception using message = 'INVALID_RATE_LIMIT_REQUEST', errcode = 'P0001';
  end if;

  for v_scope, v_key_hash, v_limit, v_window_seconds in
    select entry.scope, entry."keyHash", entry."limit", entry."windowSeconds"
    from pg_catalog.jsonb_to_recordset(p_entries) as entry(
      scope text,
      "keyHash" text,
      "limit" integer,
      "windowSeconds" integer
    )
    order by entry.scope, entry."keyHash"
  loop
    if v_scope is null
      or v_scope not in (
        'ip_burst',
        'ip_sustained',
        'ip_phone',
        'lookup_ip_burst',
        'lookup_ip_sustained',
        'lookup_ip_order',
        'cancel_ip_burst',
        'cancel_ip_sustained',
        'cancel_ip_order'
      )
      or v_key_hash is null
      or v_key_hash !~ '^[0-9a-f]{64}$'
      or v_limit is null
      or v_limit < 1 or v_limit > 1000
      or v_window_seconds is null
      or v_window_seconds < 1 or v_window_seconds > 86400 then
      raise exception using message = 'INVALID_RATE_LIMIT_REQUEST', errcode = 'P0001';
    end if;

    insert into private.order_creation_rate_limits as current_limit (
      scope,
      key_hash,
      window_started_at,
      attempt_count,
      updated_at
    ) values (
      v_scope,
      v_key_hash,
      v_now,
      1,
      v_now
    )
    on conflict (scope, key_hash) do update
    set
      window_started_at = case
        when current_limit.window_started_at
          + pg_catalog.make_interval(secs => v_window_seconds) <= v_now
          then v_now
        else current_limit.window_started_at
      end,
      attempt_count = case
        when current_limit.window_started_at
          + pg_catalog.make_interval(secs => v_window_seconds) <= v_now
          then 1
        else current_limit.attempt_count + 1
      end,
      updated_at = v_now
    returning current_limit.attempt_count, current_limit.window_started_at
    into v_attempt_count, v_window_started_at;

    if v_attempt_count > v_limit then
      v_limited := true;
      v_retry_after := greatest(
        v_retry_after,
        greatest(
          1,
          pg_catalog.ceil(
            extract(epoch from (
              v_window_started_at
              + pg_catalog.make_interval(secs => v_window_seconds)
              - v_now
            ))
          )::integer
        )
      );
    end if;
  end loop;

  -- Opportunistic bounded cleanup avoids requiring a cron job.
  if pg_catalog.random() < 0.02 then
    delete from private.order_creation_rate_limits
    where ctid in (
      select ctid
      from private.order_creation_rate_limits
      where updated_at < v_now - interval '2 days'
      order by updated_at
      limit 100
    );
  end if;

  return pg_catalog.jsonb_build_object(
    'allowed', not v_limited,
    'retryAfterSeconds', case when v_limited then v_retry_after else 0 end
  );
end;
$$;

revoke all on table private.order_creation_rate_limits from public, anon, authenticated;

revoke all on function public.check_order_creation_rate_limits(jsonb)
  from public, anon, authenticated;

grant execute on function public.check_order_creation_rate_limits(jsonb)
  to service_role;
