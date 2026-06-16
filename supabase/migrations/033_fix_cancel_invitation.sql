-- Fix: cancel/resend invitation silently no-op when no row matches
-- Run after 032_fix_invitation_hash_digest.sql

drop function if exists public.cancel_office_invitation(uuid);

create or replace function public.cancel_office_invitation(invitation_id uuid)
returns table (id uuid, status text)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  inv public.invitations%rowtype;
begin
  if not (select private.is_firm_manager()) then
    raise exception 'Only firm admins can cancel invitations';
  end if;

  update public.invitations
  set status = 'cancelled', cancelled_at = now()
  where invitations.id = invitation_id
    and invitations.firm_id = private.get_current_firm_id()
    and invitations.status in ('pending', 'expired')
  returning * into inv;

  if not found then
    raise exception 'invitation_not_found_or_not_cancellable';
  end if;

  return query select inv.id, inv.status;
end;
$$;

revoke all on function public.cancel_office_invitation(uuid) from public;
grant execute on function public.cancel_office_invitation(uuid) to authenticated;

create or replace function public.resend_office_invitation(
  invitation_id uuid,
  app_origin text default null
)
returns table (
  id uuid,
  email text,
  role text,
  status text,
  expires_at timestamptz,
  invite_url text
)
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  raw_token text;
  inv public.invitations%rowtype;
  base_url text;
begin
  if not (select private.is_firm_manager()) then
    raise exception 'Only firm admins can resend invitations';
  end if;

  raw_token := encode(public.secure_random_bytes(32), 'hex');
  base_url := coalesce(nullif(trim(app_origin), ''), 'https://app.com');

  update public.invitations
  set
    token_hash = public.invitation_hash(raw_token),
    status = 'pending',
    expires_at = now() + interval '7 days',
    invite_url = base_url || '/invite/' || raw_token,
    cancelled_at = null,
    resent_at = now()
  where invitations.id = invitation_id
    and invitations.firm_id = private.get_current_firm_id()
    and invitations.status in ('pending', 'expired', 'cancelled')
  returning * into inv;

  if not found then
    raise exception 'invitation_not_found_or_not_resendable';
  end if;

  return query
  select inv.id, inv.email, inv.role::text, inv.status, inv.expires_at, inv.invite_url;
end;
$$;

revoke all on function public.resend_office_invitation(uuid, text) from public;
grant execute on function public.resend_office_invitation(uuid, text) to authenticated;
