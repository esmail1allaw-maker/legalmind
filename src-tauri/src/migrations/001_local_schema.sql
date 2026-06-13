create table if not exists device_metadata (
  id text primary key,
  current_firm_id text,
  current_employee_id text,
  current_user_email text,
  device_name text,
  last_login_at text,
  created_at text not null,
  updated_at text not null
);

create table if not exists sync_state (
  table_name text primary key,
  cursor text,
  last_sync_at text
);

create table if not exists sync_outbox (
  id text primary key,
  table_name text not null,
  record_id text not null,
  firm_id text,
  event_type text not null,
  payload text not null,
  status text not null default 'pending' check (status in ('pending','syncing','synced','failed')),
  attempts integer not null default 0,
  last_error text,
  created_at text not null,
  synced_at text
);

create index if not exists idx_sync_outbox_status_created on sync_outbox(status, created_at);
create index if not exists idx_sync_outbox_record on sync_outbox(table_name, record_id);

create table if not exists sync_conflicts (
  id text primary key,
  table_name text not null,
  record_id text not null,
  local_row text not null,
  remote_row text not null,
  reason text not null,
  status text not null default 'open' check (status in ('open','resolved','ignored')),
  created_at text not null,
  resolved_at text
);

create index if not exists idx_sync_conflicts_status on sync_conflicts(status, created_at);

create table if not exists firms (
  id text primary key,
  firm_id text,
  data text not null,
  created_at text not null,
  updated_at text not null,
  deleted_at text,
  version integer not null default 1,
  dirty integer not null default 0,
  last_synced_at text
);

create table if not exists employees (
  id text primary key,
  firm_id text,
  data text not null,
  created_at text not null,
  updated_at text not null,
  deleted_at text,
  version integer not null default 1,
  dirty integer not null default 0,
  last_synced_at text
);

create table if not exists invitations (
  id text primary key,
  firm_id text,
  data text not null,
  created_at text not null,
  updated_at text not null,
  deleted_at text,
  version integer not null default 1,
  dirty integer not null default 0,
  last_synced_at text
);

create table if not exists clients (
  id text primary key,
  firm_id text,
  data text not null,
  created_at text not null,
  updated_at text not null,
  deleted_at text,
  version integer not null default 1,
  dirty integer not null default 0,
  last_synced_at text
);

create table if not exists cases (
  id text primary key,
  firm_id text,
  data text not null,
  created_at text not null,
  updated_at text not null,
  deleted_at text,
  version integer not null default 1,
  dirty integer not null default 0,
  last_synced_at text
);

create table if not exists sessions (
  id text primary key,
  firm_id text,
  data text not null,
  created_at text not null,
  updated_at text not null,
  deleted_at text,
  version integer not null default 1,
  dirty integer not null default 0,
  last_synced_at text
);

create table if not exists documents (
  id text primary key,
  firm_id text,
  data text not null,
  created_at text not null,
  updated_at text not null,
  deleted_at text,
  version integer not null default 1,
  dirty integer not null default 0,
  last_synced_at text
);

create table if not exists case_attachments (
  id text primary key,
  firm_id text,
  data text not null,
  created_at text not null,
  updated_at text not null,
  deleted_at text,
  version integer not null default 1,
  dirty integer not null default 0,
  last_synced_at text
);

create table if not exists lawyers (
  id text primary key,
  firm_id text,
  data text not null,
  created_at text not null,
  updated_at text not null,
  deleted_at text,
  version integer not null default 1,
  dirty integer not null default 0,
  last_synced_at text
);

create table if not exists notifications (
  id text primary key,
  firm_id text,
  data text not null,
  created_at text not null,
  updated_at text not null,
  deleted_at text,
  version integer not null default 1,
  dirty integer not null default 0,
  last_synced_at text
);

create table if not exists audit_logs (
  id text primary key,
  firm_id text,
  data text not null,
  created_at text not null,
  updated_at text not null,
  deleted_at text,
  version integer not null default 1,
  dirty integer not null default 0,
  last_synced_at text
);

create index if not exists idx_firms_updated on firms(updated_at);
create index if not exists idx_employees_firm_updated on employees(firm_id, updated_at);
create index if not exists idx_invitations_firm_updated on invitations(firm_id, updated_at);
create index if not exists idx_clients_firm_updated on clients(firm_id, updated_at);
create index if not exists idx_cases_firm_updated on cases(firm_id, updated_at);
create index if not exists idx_sessions_firm_updated on sessions(firm_id, updated_at);
create index if not exists idx_documents_firm_updated on documents(firm_id, updated_at);
create index if not exists idx_case_attachments_firm_updated on case_attachments(firm_id, updated_at);
create index if not exists idx_lawyers_firm_updated on lawyers(firm_id, updated_at);
create index if not exists idx_notifications_firm_updated on notifications(firm_id, updated_at);
create index if not exists idx_audit_logs_firm_updated on audit_logs(firm_id, updated_at);
