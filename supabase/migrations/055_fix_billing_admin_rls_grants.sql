-- RLS policies call private.is_billing_admin() / private.is_subscription_super_admin()
-- directly. The authenticated role must be able to EXECUTE them during policy checks.

grant execute on function private.is_billing_admin() to authenticated, service_role;
grant execute on function private.is_subscription_super_admin() to authenticated, service_role;
