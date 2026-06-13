use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Manager, State};
use uuid::Uuid;

struct AppState {
    db: Mutex<Connection>,
}

#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error("{0}")]
    Message(String),
    #[error(transparent)]
    Sql(#[from] rusqlite::Error),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

type AppResult<T> = Result<T, AppError>;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct QueryPayload {
    table: String,
    id: Option<String>,
    firm_id: Option<String>,
    include_deleted: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpsertPayload {
    table: String,
    row: Value,
    event_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DeletePayload {
    table: String,
    id: String,
    firm_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SyncStatus {
    pending_events: i64,
    conflicts: i64,
    last_sync_at: Option<String>,
}

const SYNCABLE_TABLES: &[&str] = &[
    "firms",
    "employees",
    "invitations",
    "clients",
    "cases",
    "sessions",
    "documents",
    "case_attachments",
    "lawyers",
    "notifications",
    "audit_logs",
];

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let db_path = database_path(app)?;
            if let Some(parent) = db_path.parent() {
                fs::create_dir_all(parent)?;
            }
            let conn = Connection::open(db_path)?;
            conn.execute_batch("pragma foreign_keys = on; pragma journal_mode = wal;")?;
            run_migrations(&conn)?;
            app.manage(AppState {
                db: Mutex::new(conn),
            });
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            initialize_local_database,
            list_local_rows,
            get_local_row,
            upsert_local_row,
            soft_delete_local_row,
            list_outbox_events,
            mark_outbox_event_synced,
            record_sync_conflict,
            get_sync_status,
            update_sync_cursor
        ])
        .run(tauri::generate_context!())
        .expect("error while running LegalMind Yemen");
}

fn database_path(app: &tauri::App) -> AppResult<PathBuf> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|err| AppError::Message(err.to_string()))?;
    Ok(dir.join("legalmind-yemen.sqlite3"))
}

fn now() -> String {
    Utc::now().to_rfc3339()
}

fn validate_table(table: &str) -> AppResult<()> {
    if SYNCABLE_TABLES.contains(&table) {
        Ok(())
    } else {
        Err(AppError::Message(format!("Unsupported local table: {table}")))
    }
}

fn run_migrations(conn: &Connection) -> AppResult<()> {
    conn.execute_batch(
        r#"
        create table if not exists local_migrations (
          version integer primary key,
          applied_at text not null
        );
        "#,
    )?;

    let current: i64 = conn
        .query_row("select coalesce(max(version), 0) from local_migrations", [], |row| row.get(0))
        .unwrap_or(0);

    if current < 1 {
        conn.execute_batch(include_str!("migrations/001_local_schema.sql"))?;
        conn.execute(
            "insert into local_migrations(version, applied_at) values(1, ?1)",
            params![now()],
        )?;
    }

    Ok(())
}

fn row_to_json(row_json: String) -> AppResult<Value> {
    Ok(serde_json::from_str(&row_json)?)
}

#[tauri::command]
fn initialize_local_database(state: State<'_, AppState>) -> AppResult<SyncStatus> {
    let conn = state.db.lock().map_err(|_| AppError::Message("Database lock failed".into()))?;
    run_migrations(&conn)?;
    sync_status(&conn)
}

#[tauri::command]
fn list_local_rows(state: State<'_, AppState>, payload: QueryPayload) -> AppResult<Vec<Value>> {
    validate_table(&payload.table)?;
    let conn = state.db.lock().map_err(|_| AppError::Message("Database lock failed".into()))?;
    let include_deleted = payload.include_deleted.unwrap_or(false);

    let sql = if let Some(firm_id) = payload.firm_id {
        if include_deleted {
            format!("select data from {} where firm_id = ?1 order by updated_at desc", payload.table)
        } else {
            format!(
                "select data from {} where firm_id = ?1 and deleted_at is null order by updated_at desc",
                payload.table
            )
        }
        .replace("?1", &format!("'{}'", firm_id.replace('\'', "''")))
    } else if include_deleted {
        format!("select data from {} order by updated_at desc", payload.table)
    } else {
        format!("select data from {} where deleted_at is null order by updated_at desc", payload.table)
    };

    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))?
        .collect::<Result<Vec<_>, _>>()?;

    rows.into_iter().map(row_to_json).collect()
}

#[tauri::command]
fn get_local_row(state: State<'_, AppState>, payload: QueryPayload) -> AppResult<Option<Value>> {
    validate_table(&payload.table)?;
    let id = payload.id.ok_or_else(|| AppError::Message("Missing row id".into()))?;
    let conn = state.db.lock().map_err(|_| AppError::Message("Database lock failed".into()))?;
    let sql = format!("select data from {} where id = ?1", payload.table);
    let row = conn.query_row(&sql, params![id], |row| row.get::<_, String>(0)).optional()?;
    row.map(row_to_json).transpose()
}

#[tauri::command]
fn upsert_local_row(state: State<'_, AppState>, payload: UpsertPayload) -> AppResult<Value> {
    validate_table(&payload.table)?;
    let conn = state.db.lock().map_err(|_| AppError::Message("Database lock failed".into()))?;
    let row = normalize_row(payload.row)?;
    let id = json_string(&row, "id")?;
    let firm_id = row.get("firm_id").and_then(Value::as_str).map(ToOwned::to_owned);
    let updated_at = json_string(&row, "updated_at").unwrap_or_else(|_| now());
    let deleted_at = row.get("deleted_at").and_then(Value::as_str).map(ToOwned::to_owned);
    let version = row.get("version").and_then(Value::as_i64).unwrap_or(1);
    let data = serde_json::to_string(&row)?;
    let tx = conn.unchecked_transaction()?;

    let sql = format!(
        "insert into {} (id, firm_id, data, created_at, updated_at, deleted_at, version, dirty, last_synced_at)
         values (?1, ?2, ?3, coalesce(json_extract(?3, '$.created_at'), ?4), ?4, ?5, ?6, 1, null)
         on conflict(id) do update set
           firm_id = excluded.firm_id,
           data = excluded.data,
           updated_at = excluded.updated_at,
           deleted_at = excluded.deleted_at,
           version = {}.version + 1,
           dirty = 1",
        payload.table, payload.table
    );
    tx.execute(&sql, params![id, firm_id, data, updated_at, deleted_at, version])?;
    append_outbox(&tx, &payload.table, &id, firm_id.as_deref(), &payload.event_type, &row)?;
    tx.commit()?;
    Ok(row)
}

#[tauri::command]
fn soft_delete_local_row(state: State<'_, AppState>, payload: DeletePayload) -> AppResult<()> {
    validate_table(&payload.table)?;
    let conn = state.db.lock().map_err(|_| AppError::Message("Database lock failed".into()))?;
    let deleted_at = now();
    let tx = conn.unchecked_transaction()?;
    let sql = format!(
        "update {} set deleted_at = ?1, dirty = 1, updated_at = ?1,
         data = json_set(data, '$.deleted_at', ?1, '$.updated_at', ?1)
         where id = ?2",
        payload.table
    );
    tx.execute(&sql, params![deleted_at, payload.id])?;
    append_outbox(
        &tx,
        &payload.table,
        &payload.id,
        payload.firm_id.as_deref(),
        &format!("{}.deleted", payload.table),
        &json!({ "id": payload.id, "deleted_at": deleted_at }),
    )?;
    tx.commit()?;
    Ok(())
}

#[tauri::command]
fn list_outbox_events(state: State<'_, AppState>, limit: Option<i64>) -> AppResult<Vec<Value>> {
    let conn = state.db.lock().map_err(|_| AppError::Message("Database lock failed".into()))?;
    let mut stmt = conn.prepare(
        "select json_object(
          'id', id,
          'tableName', table_name,
          'recordId', record_id,
          'firmId', firm_id,
          'eventType', event_type,
          'payload', json(payload),
          'attempts', attempts,
          'createdAt', created_at
        ) from sync_outbox
        where status = 'pending'
        order by created_at asc
        limit ?1",
    )?;
    let rows = stmt
        .query_map(params![limit.unwrap_or(100)], |row| row.get::<_, String>(0))?
        .collect::<Result<Vec<_>, _>>()?;
    rows.into_iter().map(row_to_json).collect()
}

#[tauri::command]
fn mark_outbox_event_synced(state: State<'_, AppState>, id: String) -> AppResult<()> {
    let conn = state.db.lock().map_err(|_| AppError::Message("Database lock failed".into()))?;
    conn.execute(
        "update sync_outbox set status = 'synced', synced_at = ?1 where id = ?2",
        params![now(), id],
    )?;
    Ok(())
}

#[tauri::command]
fn record_sync_conflict(
    state: State<'_, AppState>,
    table_name: String,
    record_id: String,
    local_row: Value,
    remote_row: Value,
    reason: String,
) -> AppResult<()> {
    validate_table(&table_name)?;
    let conn = state.db.lock().map_err(|_| AppError::Message("Database lock failed".into()))?;
    conn.execute(
        "insert into sync_conflicts(id, table_name, record_id, local_row, remote_row, reason, status, created_at)
         values (?1, ?2, ?3, ?4, ?5, ?6, 'open', ?7)",
        params![
            Uuid::new_v4().to_string(),
            table_name,
            record_id,
            serde_json::to_string(&local_row)?,
            serde_json::to_string(&remote_row)?,
            reason,
            now()
        ],
    )?;
    Ok(())
}

#[tauri::command]
fn get_sync_status(state: State<'_, AppState>) -> AppResult<SyncStatus> {
    let conn = state.db.lock().map_err(|_| AppError::Message("Database lock failed".into()))?;
    sync_status(&conn)
}

#[tauri::command]
fn update_sync_cursor(state: State<'_, AppState>, table_name: String, cursor: String) -> AppResult<()> {
    validate_table(&table_name)?;
    let conn = state.db.lock().map_err(|_| AppError::Message("Database lock failed".into()))?;
    conn.execute(
        "insert into sync_state(table_name, cursor, last_sync_at)
         values (?1, ?2, ?3)
         on conflict(table_name) do update set cursor = excluded.cursor, last_sync_at = excluded.last_sync_at",
        params![table_name, cursor, now()],
    )?;
    Ok(())
}

fn sync_status(conn: &Connection) -> AppResult<SyncStatus> {
    let pending_events = conn.query_row(
        "select count(*) from sync_outbox where status = 'pending'",
        [],
        |row| row.get(0),
    )?;
    let conflicts = conn.query_row(
        "select count(*) from sync_conflicts where status = 'open'",
        [],
        |row| row.get(0),
    )?;
    let last_sync_at = conn
        .query_row("select max(last_sync_at) from sync_state", [], |row| row.get(0))
        .optional()?
        .flatten();
    Ok(SyncStatus {
        pending_events,
        conflicts,
        last_sync_at,
    })
}

fn append_outbox(
    conn: &Connection,
    table_name: &str,
    record_id: &str,
    firm_id: Option<&str>,
    event_type: &str,
    payload: &Value,
) -> AppResult<()> {
    conn.execute(
        "insert into sync_outbox(id, table_name, record_id, firm_id, event_type, payload, status, attempts, created_at)
         values (?1, ?2, ?3, ?4, ?5, ?6, 'pending', 0, ?7)",
        params![
            Uuid::new_v4().to_string(),
            table_name,
            record_id,
            firm_id,
            event_type,
            serde_json::to_string(payload)?,
            now()
        ],
    )?;
    Ok(())
}

fn normalize_row(mut row: Value) -> AppResult<Value> {
    let obj = row
        .as_object_mut()
        .ok_or_else(|| AppError::Message("Local row must be a JSON object".into()))?;
    obj.entry("id").or_insert_with(|| Value::String(Uuid::new_v4().to_string()));
    let timestamp = now();
    obj.entry("created_at").or_insert_with(|| Value::String(timestamp.clone()));
    obj.insert("updated_at".into(), Value::String(timestamp));
    obj.entry("deleted_at").or_insert(Value::Null);
    obj.entry("version").or_insert(Value::Number(1.into()));
    Ok(row)
}

fn json_string(row: &Value, key: &str) -> AppResult<String> {
    row.get(key)
        .and_then(Value::as_str)
        .map(ToOwned::to_owned)
        .ok_or_else(|| AppError::Message(format!("Missing string field: {key}")))
}
