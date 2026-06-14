-- Restore missing get_office_by_code RPC (lawyer registration lookup)
-- Safe to run if 004/007 were skipped or partially applied.

drop function if exists get_office_by_firm_code(text);
create function get_office_by_firm_code(firm_code_input text)
returns table(id uuid, name text, firm_code text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select f.id, f.name, f.firm_code::text
  from firms f
  where upper(f.firm_code) = upper(trim(firm_code_input))
    and f.deleted_at is null
  limit 1;
end;
$$;

drop function if exists get_office_by_code(text);
create function get_office_by_code(office_code_input text)
returns table(id uuid, name text, office_code text, firm_code text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select f.id, f.name, f.firm_code::text, f.firm_code::text
  from firms f
  where upper(f.firm_code) = upper(trim(office_code_input))
    and f.deleted_at is null
  limit 1;
end;
$$;

grant execute on function get_office_by_firm_code(text) to anon, authenticated;
grant execute on function get_office_by_code(text) to anon, authenticated;
