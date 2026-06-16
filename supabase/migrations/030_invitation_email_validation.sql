-- Invitation RPC: email validation + store invitee name/phone
-- Run after 029_subscription_approval_hardening.sql

drop function if exists public.create_office_invitation(text, text, text);

create or replace function public.create_office_invitation(
  invite_email text,
  invite_role text,
  app_origin text default null,
  invite_full_name text default null,
  invite_phone text default null
)
returns table (id uuid, email text, role text, status text, expires_at timestamptz, invite_url text)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  raw_token text;
  hashed_token text;
  new_invitation public.invitations%rowtype;
  base_url text;
  normalized_email text;
begin
  perform public.expire_old_invitations();

  if not (select private.is_firm_manager()) then
    raise exception 'Only firm admins can create invitations';
  end if;

  normalized_email := lower(trim(invite_email));

  if normalized_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'invalid_email';
  end if;

  if invite_role not in ('lawyer', 'assistant') then
    raise exception 'Invalid role';
  end if;

  raw_token := encode(gen_random_bytes(32), 'hex');
  hashed_token := public.invitation_hash(raw_token);
  base_url := coalesce(nullif(trim(app_origin), ''), 'https://app.com');

  insert into public.invitations (
    firm_id, email, full_name, phone, role, status, token_hash, invited_by, expires_at, invite_url
  )
  values (
    private.get_current_firm_id(),
    normalized_email,
    nullif(trim(invite_full_name), ''),
    nullif(trim(invite_phone), ''),
    invite_role::public.employee_role_enum,
    'pending',
    hashed_token,
    private.get_current_employee_id(),
    now() + interval '7 days',
    base_url || '/invite/' || raw_token
  )
  returning * into new_invitation;

  return query
  select
    new_invitation.id,
    new_invitation.email,
    new_invitation.role::text,
    new_invitation.status,
    new_invitation.expires_at,
    new_invitation.invite_url;
end;
$$;

revoke all on function public.create_office_invitation(text, text, text, text, text) from public;
grant execute on function public.create_office_invitation(text, text, text, text, text) to authenticated;
