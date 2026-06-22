-- Office-wide activity log: firm scope, human summaries, extra audited tables

alter table public.audit_logs
  add column if not exists firm_id uuid references public.firms(id) on delete set null;

create index if not exists idx_audit_logs_firm_created
  on public.audit_logs (firm_id, created_at desc)
  where firm_id is not null;

create or replace function private.audit_resolve_firm_id(p_table text, p_row jsonb)
returns uuid
language plpgsql
stable
set search_path = public, private
as $$
declare
  v_firm_id uuid;
  v_case_id uuid;
begin
  if p_row is null then
    return null;
  end if;

  if p_table in ('clients', 'cases', 'employees', 'office_expenses', 'case_payments', 'receipt_vouchers', 'invitations') then
    return nullif(p_row ->> 'firm_id', '')::uuid;
  end if;

  if p_table in ('sessions', 'documents', 'case_attachments') then
    v_case_id := nullif(p_row ->> 'case_id', '')::uuid;
    if v_case_id is not null then
      select c.firm_id into v_firm_id from public.cases c where c.id = v_case_id;
      return v_firm_id;
    end if;
  end if;

  return null;
end;
$$;

create or replace function private.audit_entity_summary(
  p_table text,
  p_op text,
  p_new jsonb,
  p_old jsonb
)
returns text
language plpgsql
stable
set search_path = public, private
as $$
declare
  v_row jsonb := coalesce(p_new, p_old);
begin
  case p_table
    when 'clients' then
      case p_op
        when 'INSERT' then return 'تسجيل عميل جديد: ' || coalesce(p_new ->> 'name', '—');
        when 'UPDATE' then return 'تعديل بيانات العميل: ' || coalesce(p_new ->> 'name', p_old ->> 'name', '—');
        when 'DELETE' then return 'حذف العميل: ' || coalesce(p_old ->> 'name', '—');
        else return null;
      end case;
    when 'cases' then
      case p_op
        when 'INSERT' then return 'فتح قضية جديدة: ' || coalesce(p_new ->> 'title', '—');
        when 'UPDATE' then return 'تعديل القضية: ' || coalesce(p_new ->> 'title', p_old ->> 'title', '—');
        when 'DELETE' then return 'حذف القضية: ' || coalesce(p_old ->> 'title', '—');
        else return null;
      end case;
    when 'documents' then
      case p_op
        when 'INSERT' then return 'رفع مستند: ' || coalesce(p_new ->> 'title', '—');
        when 'UPDATE' then return 'تعديل مستند: ' || coalesce(p_new ->> 'title', p_old ->> 'title', '—');
        when 'DELETE' then return 'حذف مستند: ' || coalesce(p_old ->> 'title', '—');
        else return null;
      end case;
    when 'sessions' then
      case p_op
        when 'INSERT' then return 'جدولة جلسة: ' || coalesce(p_new ->> 'court', '—') || ' — ' || coalesce(p_new ->> 'session_date', '');
        when 'UPDATE' then return 'تعديل جلسة: ' || coalesce(p_new ->> 'court', p_old ->> 'court', '—');
        when 'DELETE' then return 'حذف جلسة: ' || coalesce(p_old ->> 'court', '—');
        else return null;
      end case;
    when 'case_payments' then
      case p_op
        when 'INSERT' then return 'تسجيل دفعة: ' || coalesce(p_new ->> 'amount', '0') || ' ر.ي';
        when 'UPDATE' then return 'تعديل دفعة: ' || coalesce(p_new ->> 'amount', p_old ->> 'amount', '0') || ' ر.ي';
        when 'DELETE' then return 'حذف دفعة: ' || coalesce(p_old ->> 'amount', '0') || ' ر.ي';
        else return null;
      end case;
    when 'receipt_vouchers' then
      case p_op
        when 'INSERT' then return 'إنشاء سند قبض: ' || coalesce(p_new ->> 'receipt_number', '—') || ' — ' || coalesce(p_new ->> 'amount', '0') || ' ر.ي';
        when 'UPDATE' then return 'تحديث سند قبض: ' || coalesce(p_new ->> 'receipt_number', p_old ->> 'receipt_number', '—');
        else return null;
      end case;
    when 'office_expenses' then
      case p_op
        when 'INSERT' then return 'إضافة مصروف: ' || coalesce(p_new ->> 'title', '—');
        when 'UPDATE' then return 'تعديل مصروف: ' || coalesce(p_new ->> 'title', p_old ->> 'title', '—');
        when 'DELETE' then return 'حذف مصروف: ' || coalesce(p_old ->> 'title', '—');
        else return null;
      end case;
    when 'employees' then
      case p_op
        when 'INSERT' then return 'إضافة موظف: ' || coalesce(p_new ->> 'full_name', '—');
        when 'UPDATE' then return 'تعديل موظف: ' || coalesce(p_new ->> 'full_name', p_old ->> 'full_name', '—');
        when 'DELETE' then return 'حذف موظف: ' || coalesce(p_old ->> 'full_name', '—');
        else return null;
      end case;
    when 'invitations' then
      case p_op
        when 'INSERT' then return 'دعوة موظف: ' || coalesce(p_new ->> 'email', '—');
        when 'UPDATE' then return 'تحديث دعوة: ' || coalesce(p_new ->> 'email', p_old ->> 'email', '—');
        when 'DELETE' then return 'إلغاء دعوة: ' || coalesce(p_old ->> 'email', '—');
        else return null;
      end case;
    else
      return p_table || ' — ' || p_op;
  end case;
end;
$$;

create or replace function private.insert_audit_log()
returns trigger
language plpgsql
security definer
set search_path = private, public
as $$
declare
  changes jsonb;
  emp_id uuid;
  v_ip inet;
  v_firm_id uuid;
  v_new jsonb;
  v_old jsonb;
  v_summary text;
begin
  emp_id := private.get_current_employee_id();

  if tg_op = 'INSERT' then
    v_new := row_to_json(new)::jsonb;
    changes := v_new;
  elsif tg_op = 'UPDATE' then
    v_new := row_to_json(new)::jsonb;
    v_old := row_to_json(old)::jsonb;
    changes := jsonb_build_object('old', v_old, 'new', v_new);
  elsif tg_op = 'DELETE' then
    v_old := row_to_json(old)::jsonb;
    changes := v_old;
  end if;

  v_firm_id := private.audit_resolve_firm_id(tg_table_name, coalesce(v_new, v_old));
  v_summary := private.audit_entity_summary(tg_table_name, tg_op, v_new, v_old);

  begin
    v_ip := nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-forwarded-for';
    if v_ip is not null and v_ip <> '' then
      v_ip := split_part(v_ip, ',', 1)::inet;
    else
      v_ip := null;
    end if;
  exception when others then
    v_ip := null;
  end;

  insert into public.audit_logs (
    table_name, record_id, operation, changed_by, changes, ip_address, action_type, entity_summary, firm_id
  )
  values (
    tg_table_name,
    coalesce(new.id, old.id),
    tg_op,
    emp_id,
    changes,
    v_ip,
    tg_table_name || '.' || lower(tg_op),
    v_summary,
    v_firm_id
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

-- Ensure audit triggers on all office activity tables
do $$
declare t text;
begin
  foreach t in array array[
    'clients', 'cases', 'sessions', 'documents', 'case_attachments', 'employees',
    'case_payments', 'receipt_vouchers', 'office_expenses', 'invitations'
  ]
  loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      execute format('drop trigger if exists audit_%s on public.%I', t, t);
      execute format(
        'create trigger audit_%s after insert or update or delete on public.%I
         for each row execute function private.insert_audit_log()',
        t, t
      );
    end if;
  end loop;
end $$;

-- Enriched activity feed for office owners
create or replace function public.list_firm_activity_logs(
  p_limit integer default 200,
  p_table_filter text default null
)
returns table (
  id uuid,
  record_id uuid,
  created_at timestamptz,
  operation text,
  table_name text,
  action_type text,
  entity_summary text,
  employee_name text,
  employee_id uuid,
  ip_address inet,
  changes jsonb
)
language sql
stable
security definer
set search_path = public, private
as $$
  select
    a.id,
    a.record_id,
    a.created_at,
    a.operation,
    a.table_name,
    a.action_type,
    a.entity_summary,
    e.full_name as employee_name,
    a.changed_by as employee_id,
    a.ip_address,
    a.changes
  from public.audit_logs a
  left join public.employees e on e.id = a.changed_by and e.deleted_at is null
  where private.is_office_admin()
    and (
      a.firm_id = private.get_current_firm_id()
      or (
        a.firm_id is null
        and a.changed_by is not null
        and e.firm_id = private.get_current_firm_id()
      )
    )
    and (p_table_filter is null or p_table_filter = '' or a.table_name = p_table_filter)
  order by a.created_at desc
  limit greatest(1, least(coalesce(p_limit, 200), 500));
$$;

revoke all on function public.list_firm_activity_logs(integer, text) from public;
grant execute on function public.list_firm_activity_logs(integer, text) to authenticated;

-- Keep legacy RPC compatible (delegates to activity feed)
create or replace function public.list_firm_audit_logs(p_limit integer default 100)
returns setof public.audit_logs
language sql
stable
security definer
set search_path = public, private
as $$
  select a.*
  from public.audit_logs a
  left join public.employees e on e.id = a.changed_by and e.deleted_at is null
  where private.is_office_admin()
    and (
      a.firm_id = private.get_current_firm_id()
      or (
        a.firm_id is null
        and a.changed_by is not null
        and e.firm_id = private.get_current_firm_id()
      )
    )
  order by a.created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;
