-- Expert security layer: event logging, error-log RPC gate, grant matrix sync (061–069)

-- ─── 1) Security events (auth + sensitive actions) ───────────────────────────

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid references public.firms(id) on delete set null,
  actor_auth_uid uuid,
  employee_id uuid references public.employees(id) on delete set null,
  event_type text not null,
  severity text not null default 'info'
    check (severity in ('info', 'warning', 'high', 'critical')),
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_security_events_firm_created
  on public.security_events (firm_id, created_at desc);
create index if not exists idx_security_events_type_created
  on public.security_events (event_type, created_at desc);
create index if not exists idx_security_events_actor_created
  on public.security_events (actor_auth_uid, created_at desc);

alter table public.security_events enable row level security;

drop policy if exists "security_events_select" on public.security_events;
create policy "security_events_select" on public.security_events
  for select using (
    private.is_office_admin()
    and firm_id = private.get_current_firm_id()
  );

revoke all on public.security_events from anon;
grant select on public.security_events to authenticated;

create or replace function public.log_security_event(
  p_event_type text,
  p_severity text default 'info',
  p_metadata jsonb default '{}'::jsonb,
  p_user_agent text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_uid uuid := auth.uid();
  v_firm_id uuid;
  v_employee_id uuid;
  v_id uuid;
  v_recent int;
  v_severity text := lower(trim(coalesce(p_severity, 'info')));
begin
  if p_event_type is null or trim(p_event_type) = '' then
    raise exception 'invalid_event_type';
  end if;

  if v_severity not in ('info', 'warning', 'high', 'critical') then
    v_severity := 'info';
  end if;

  -- Rate limit: 60 events / 5 min per auth user (anti-spam)
  if v_uid is not null then
    select count(*) into v_recent
    from public.security_events se
    where se.actor_auth_uid = v_uid
      and se.created_at > now() - interval '5 minutes';

    if v_recent >= 60 then
      return null;
    end if;
  end if;

  v_firm_id := private.get_current_firm_id();
  v_employee_id := private.get_current_employee_id();

  insert into public.security_events (
    firm_id, actor_auth_uid, employee_id, event_type, severity, user_agent, metadata
  )
  values (
    v_firm_id,
    v_uid,
    v_employee_id,
    lower(trim(p_event_type)),
    v_severity,
    nullif(trim(coalesce(p_user_agent, '')), ''),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.list_firm_security_events(p_limit integer default 100)
returns setof public.security_events
language sql
stable
security definer
set search_path = public, private
as $$
  select se.*
  from public.security_events se
  where private.is_office_admin()
    and se.firm_id = private.get_current_firm_id()
  order by se.created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

revoke all on function public.log_security_event(text, text, jsonb, text) from public;
grant execute on function public.log_security_event(text, text, jsonb, text) to authenticated, anon;

revoke all on function public.list_firm_security_events(integer) from public;
grant execute on function public.list_firm_security_events(integer) to authenticated;

-- ─── 2) Client error logs — RPC only (no direct table insert) ────────────────

drop policy if exists "error_logs_insert" on public.error_logs;

revoke insert on public.error_logs from authenticated;

create or replace function public.submit_client_error_log(
  p_message text,
  p_stack text default null,
  p_context jsonb default null,
  p_severity text default 'error'
)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_firm_id uuid;
  v_employee_id uuid;
  v_severity text := lower(trim(coalesce(p_severity, 'error')));
  v_recent int;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if p_message is null or char_length(trim(p_message)) < 2 then
    raise exception 'invalid_message';
  end if;

  if v_severity not in ('info', 'warning', 'error', 'critical') then
    v_severity := 'error';
  end if;

  v_firm_id := private.get_current_firm_id();
  v_employee_id := private.get_current_employee_id();

  select count(*) into v_recent
  from public.error_logs el
  where el.employee_id = v_employee_id
    and el.created_at > now() - interval '1 hour';

  if v_recent >= 50 then
    return null;
  end if;

  insert into public.error_logs (firm_id, employee_id, message, stack, context, severity)
  values (
    v_firm_id,
    v_employee_id,
    left(trim(p_message), 2000),
    left(coalesce(p_stack, ''), 4000),
    p_context,
    v_severity
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_client_error_log(text, text, jsonb, text) from public;
grant execute on function public.submit_client_error_log(text, text, jsonb, text) to authenticated;

-- ─── 3) Grant matrix sync (migrations 061–069 RPCs) ─────────────────────────

do $$
declare
  grant_row record;
begin
  for grant_row in
    select *
    from (values
      ('public.get_firm_roles_for_registration(text)',              'anon, authenticated'),
      ('public.list_pending_member_registrations()',               'authenticated'),
      ('public.approve_member_registration(uuid)',                  'authenticated'),
      ('public.reject_member_registration(uuid)',                   'authenticated'),
      ('public.append_case_timeline_event(uuid, text, text, text, jsonb)', 'authenticated'),
      ('public.list_firm_audit_logs(integer)',                       'authenticated'),
      ('public.reprint_receipt_voucher(uuid)',                       'authenticated'),
      ('public.get_employee_permissions(uuid)',                      'authenticated'),
      ('public.update_employee_permissions(uuid, jsonb)',             'authenticated'),
      ('public.apply_firm_role_to_employee(uuid, uuid)',             'authenticated'),
      ('public.update_firm_role_permissions(uuid, jsonb)',            'authenticated'),
      ('public.create_custom_firm_role(text, text, jsonb)',           'authenticated'),
      ('public.log_security_event(text, text, jsonb, text)',         'authenticated, anon'),
      ('public.list_firm_security_events(integer)',                  'authenticated'),
      ('public.submit_client_error_log(text, text, jsonb, text)',    'authenticated')
    ) as grants(function_signature, grantees)
  loop
    begin
      execute format('revoke all on function %s from public', grant_row.function_signature);
      execute format(
        'grant execute on function %s to %s',
        grant_row.function_signature,
        grant_row.grantees
      );
    exception
      when undefined_function then
        raise notice 'Skipped missing function: %', grant_row.function_signature;
    end;
  end loop;
end $$;
