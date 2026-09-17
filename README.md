# 🗄️ NickelDB

**NickelDB** is a full-stack web-based SQLite database explorer and query tool.

It allows users to upload a local `.db`, `.sqlite`, or `.sqlite3` database through a browser, inspect its tables, and execute SQL queries against it through a modern web interface.

The project combines three technologies:

* 🦀 **Rust** for the SQLite engine
* ⚡ **Python + FastAPI** for the API layer
* ⚛️ **TypeScript + React** for the frontend

---

## ✨ Features

### 📤 SQLite Database Upload

Upload SQLite database files directly through the browser.

Supported extensions:

```text
.db
.sqlite
.sqlite3
```

Each uploaded database receives a unique ID and is stored separately.

---

### 📋 Table Explorer

After uploading a database, NickelDB automatically discovers its tables and displays them in the sidebar.

Clicking a table automatically generates a query such as:

```sql
SELECT * FROM "users" LIMIT 100;
```

---

### 🧑‍💻 SQL Editor

NickelDB provides a built-in SQL editor for executing queries against the uploaded database.

Example:

```sql
SELECT *
FROM users;
```

Queries are sent through FastAPI to the Rust SQLite engine.

---

### 📊 Query Results

`SELECT` queries return structured results containing:

* Column names
* Rows
* SQLite values

For example:

```json
{
  "columns": [
    "id",
    "name",
    "age"
  ],
  "rows": [
    ["1", "Alice", "25"],
    ["2", "Bob", "30"]
  ]
}
```

The frontend renders these results as a table.

---

### ✏️ Database Editing

Because the SQL editor executes SQLite statements, databases can be modified using SQL.

For example:

#### Insert

```sql
INSERT INTO users (name, age)
VALUES ('Charlie', 28);
```

#### Create a table

```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL
);
```

#### Update

```sql
UPDATE users
SET age = 26
WHERE name = 'Alice';
```

#### Delete

```sql
DELETE FROM users
WHERE name = 'Bob';
```

The table list is refreshed after query execution so newly created or deleted tables appear automatically.

---

# 🏗️ Architecture

NickelDB uses a layered architecture:

```text
                    ┌─────────────────────┐
                    │      Browser        │
                    │                     │
                    │ TypeScript + React  │
                    └──────────┬──────────┘
                               │
                               │ HTTP
                               ▼
                    ┌─────────────────────┐
                    │       FastAPI       │
                    │                     │
                    │   Python API Layer  │
                    └──────────┬──────────┘
                               │
                               │ HTTP
                               ▼
                    ┌─────────────────────┐
                    │    Rust Engine      │
                    │                     │
                    │ Axum + rusqlite     │
                    └──────────┬──────────┘
                               │
                               │ SQLite API
                               ▼
                    ┌─────────────────────┐
                    │      SQLite         │
                    │                     │
                    │     .db file        │
                    └─────────────────────┘
```

### Frontend

The React frontend is responsible for:

* Database uploading
* Displaying tables
* SQL editing
* Sending queries
* Rendering query results
* Displaying errors and loading states

### FastAPI

The Python API acts as the application layer between the frontend and Rust engine.

Responsibilities include:

* Receiving database uploads
* Storing uploaded databases
* Managing database IDs
* Forwarding table requests
* Forwarding SQL queries
* Returning Rust responses to the frontend

### Rust Engine

The Rust service is responsible for the actual SQLite processing.

It uses:

* **Axum** for HTTP endpoints
* **rusqlite** for SQLite interaction
* **anyhow** for error handling

The Rust engine:

* Opens SQLite databases
* Validates SQLite files
* Discovers tables
* Executes SQL
* Converts SQLite values into API-friendly strings
* Returns query results as JSON

---
# 🛠️ Technology Stack

| Layer               | Technology |
| ------------------- | ---------- |
| Frontend            | TypeScript |
| UI Framework        | React      |
| Frontend Build Tool | Vite       |
| API                 | Python     |
| API Framework       | FastAPI    |
| Database Engine     | SQLite     |
| Backend Engine      | Rust       |
| Rust Web Framework  | Axum       |
| SQLite Library      | rusqlite   |
| Async Runtime       | Tokio      |
| Serialization       | Serde      |

---
