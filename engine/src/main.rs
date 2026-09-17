mod database;

use axum::{extract::Query, response::Json, routing::get, Router};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Deserialize)]
struct DatabaseQuery {
    path: String,
}

#[derive(Serialize)]
struct TablesResponse {
    tables: Vec<String>,
}

#[derive(Deserialize)]
struct SqlQuery {
    path: String,
    sql: String,
}

#[derive(Serialize)]
struct QueryResponse {
    columns: Vec<String>,
    rows: Vec<Vec<String>>,
}

async fn tables(Query(query): Query<DatabaseQuery>) -> Result<Json<TablesResponse>, String> {
    let path = PathBuf::from(query.path);
    let database = database::Database::open(&path).map_err(|e| e.to_string())?;
    let tables = database.get_tables().map_err(|e| e.to_string())?;

    Ok(Json(TablesResponse { tables }))
}

async fn execute_query(Query(query): Query<SqlQuery>) -> Result<Json<QueryResponse>, String> {
    let path = PathBuf::from(query.path);
    let database = database::Database::open(&path).map_err(|e| e.to_string())?;
    let result = database.execute_query(&query.sql).map_err(|e| e.to_string())?;

    Ok(Json(QueryResponse {columns: result.columns, rows: result.rows}))
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/tables", get(tables))
        .route("/query", get(execute_query));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:9000").await.unwrap();

    println!("Rust engine active @ http://127.0.0.1:9000");
    axum::serve(listener, app).await.unwrap();
}