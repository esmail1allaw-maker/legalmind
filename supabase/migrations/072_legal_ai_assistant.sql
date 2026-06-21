-- Legal AI Assistant: permission, audit log, access RPC

-- ─── 1) Extend firm role templates with ai.use ───────────────────────────────
update public.firm_roles
set permissions = coalesce(permissions, '{}'::jsonb) || '{"ai.use": true}'::jsonb
where slug in ('firm_owner', 'managing_lawyer', 'lawyer', 'legal_assistant', 'secretary');

update public.firm_roles
set permissions = coalesce(permissions, '{}'::jsonb) || '{"ai.use": false}'::jsonb
where slug = 'accountant';

-- Merge ai.use into existing employee permission snapshots (preserve other keys)
update public.employees e
set individual_permissions = coalesce(e.individual_permissions, '{}'::jsonb)
  || jsonb_build_object(
    'ai.use',
    coalesce((fr.permissions ->> 'ai.use')::boolean, false)
  )
from public.firm_roles fr
where e.firm_role_id = fr.id
  and e.deleted_at is null;

-- ─── 2) Audit log (rate limiting + office admin review) ─────────────────────
create table if not exists public.ai_assistant_logs (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid references public.firms(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  action_type text not null check (action_type in ('summarize', 'contract_draft', 'legal_research')),
  input_chars integer not null default 0,
  output_chars integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_assistant_logs_employee_created
  on public.ai_assistant_logs (employee_id, created_at desc);

alter table public.ai_assistant_logs enable row level security;

drop policy if exists "ai_assistant_logs_select" on public.ai_assistant_logs;
create policy "ai_assistant_logs_select" on public.ai_assistant_logs
  for select using (
    private.is_office_admin()
    and firm_id = private.get_current_firm_id()
  );

revoke all on public.ai_assistant_logs from anon;
grant select on public.ai_assistant_logs to authenticated;

-- ─── 3) Access check for Edge Function + frontend ───────────────────────────
create or replace function public.assert_ai_assistant_access()
returns boolean
language plpgsql
stable
security definer
set search_path = public, private
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  return private.has_permission('ai.use');
end;
$$;

revoke all on function public.assert_ai_assistant_access() from public;
grant execute on function public.assert_ai_assistant_access() to authenticated;

-- Extend has_permission fallback for ai.use
create or replace function private.has_permission(perm_key text)
returns boolean
language plpgsql
stable
security definer
set search_path = private, public
as $$
declare
  v_perm boolean;
  v_role text;
  v_status text;
  v_employee_id uuid;
begin
  if perm_key is null or perm_key = '' then return false; end if;

  select e.id, e.status
  into v_employee_id, v_status
  from public.employees e
  where e.auth_uid = auth.uid() and e.deleted_at is null
  limit 1;

  if v_status = 'pending_approval' then return false; end if;

  if v_employee_id is not null then
    select (private.employee_effective_permissions(v_employee_id) ->> perm_key)::boolean
    into v_perm;
    if v_perm is not null then return v_perm; end if;
  end if;

  v_role := private.get_current_role()::text;
  return case perm_key
    when 'ai.use' then v_role in ('super_admin','admin','firm_manager','lawyer','assistant')
    when 'financials.view' then v_role in ('super_admin','admin','firm_manager','lawyer','assistant')
    when 'financials.add_payments' then v_role in ('super_admin','admin','firm_manager')
    else private.is_office_admin()
  end;
end;
$$;
