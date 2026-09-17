use anyhow::{anyhow, Result};
use rusqlite::Connection;
use std::{path::Path, fs::File, io::Read};

pub struct Database {
    connection: Connection
}

pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<String>>,
}

impl Database {
    pub fn open(path: &Path) -> Result<Self> {
        validate_sqlite_file(path)?;
        let connection = Connection::open(path)?;
        Ok(Self {connection})
    }
    pub fn get_tables(&self) -> Result<Vec<String>> {
        let mut stmt = self.connection.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")?;
        let tables = stmt.query_map([], |r| r.get::<_, String>(0))?.collect::<Result<Vec<_>, _>>()?;
        Ok(tables)
    }
    pub fn execute_query(&self, sql: &str) -> Result<QueryResult> {
        let mut stmt = self.connection.prepare(sql)?;
        let cols = stmt.column_count();
        let columns = stmt.column_names().iter().map(|name| name.to_string()).collect();

        let mut rows = Vec::new();
        let mut query_rows = stmt.query([])?;

        while let Some(r) = query_rows.next()? {
            let mut values = Vec::new();
            for i in 0..cols {
                let value = r.get_ref(i)?;
                let value = match value {
                    rusqlite::types::ValueRef::Null => "NULL".to_string(),
                    rusqlite::types::ValueRef::Integer(x) => {x.to_string()},
                    rusqlite::types::ValueRef::Real(x) => {x.to_string()},
                    rusqlite::types::ValueRef::Text(txt) => {String::from_utf8_lossy(txt).to_string()},
                    rusqlite::types::ValueRef::Blob(blb) => {format!("<BLOB {} bytes>", blb.len())},
                };
                values.push(value);
            }
            rows.push(values);
        }
        Ok(QueryResult {columns, rows})
    }
}

fn validate_sqlite_file(path: &Path) -> Result<()> {
    let mut file = File::open(path)?;
    let mut header = [0u8; 16];
    file.read_exact(&mut header)?;

    if &header != b"SQLite format 3\0" {
        return Err(anyhow!("File is not a valid SQLite database!"));
    }

    Ok(())
}