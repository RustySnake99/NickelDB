import { useState } from "react";
import "./App.css";

interface Database {
  id: string;
  filename: string;
}

interface QueryResult {
  columns: string[];
  rows: string[][];
}

function App() {
  const [database, setDatabase] = useState<Database | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const [sql, setSql] = useState<string>(
    "SELECT * FROM users;"
  );

  const [result, setResult] =
    useState<QueryResult | null>(null);

  const [uploading, setUploading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function uploadDatabase(file: File) {
    setUploading(true);
    setError(null);

    setDatabase(null);
    setResult(null);
    setTables([]);
    setSelectedTable(null);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        "http://127.0.0.1:8000/databases/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to upload file."
        );
      }

      const data: Database =
        await response.json();

      setDatabase(data);

      await loadTables(data.id);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setUploading(false);
    }
  }

  async function loadTables(databaseId: string) {
    setLoadingTables(true);
    setError(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/databases/${databaseId}/tables`
      );

if (!response.ok) {
  throw new Error(
    "Failed to load tables."
  );
}

const data = await response.json();

setTables(data.tables);
    } catch (error) {
  setError(
    error instanceof Error
      ? error.message
      : "Failed to load tables."
  );
} finally {
  setLoadingTables(false);
}
  }

async function executeQuery() {
  if (!database) {
    return;
  }

  if (!sql.trim()) {
    setError(
      "SQL Query cannot be empty."
    );
    return;
  }

  setExecuting(true);
  setError(null);

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/databases/${database.id}/query`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          sql,
        }),
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(errorText);
    }

    const data: QueryResult =
      await response.json();

    setResult(data);

    // Refresh tables in case the query
    // created or deleted a table.
    await loadTables(database.id);
  } catch (error) {
    setResult(null);

    setError(
      error instanceof Error
        ? error.message
        : "Query execution failed."
    );
  } finally {
    setExecuting(false);
  }
}

function handleFileChange(
  event: React.ChangeEvent<HTMLInputElement>
) {
  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  uploadDatabase(file);
}

function handleTableClick(
  table: string
) {
  setSelectedTable(table);

  setSql(
    `SELECT * FROM "${table}" LIMIT 100;`
  );

  setResult(null);
  setError(null);
}

return (
  <div className="app">

    {/* Header */}

    <header className="topbar">

      <div>
        <h1>NickelDB</h1>

        <span>
          SQLite Web Explorer
        </span>
      </div>

      <div className="database-name">
        {database
          ? database.filename
          : "No database loaded"}
      </div>

    </header>


    {/* Toolbar */}

    <div className="toolbar">

      <label className="upload-button">

        {uploading
          ? "Uploading..."
          : "Upload SQLite Database"}

        <input
          type="file"
          accept=".db,.sqlite,.sqlite3"
          onChange={handleFileChange}
          disabled={uploading}
          hidden
        />

      </label>

    </div>


    {/* Error */}

    {error && (
      <div className="error">
        {error}
      </div>
    )}


    {/* Workspace */}

    <main className="workspace">

      {/* Sidebar */}

      <aside className="sidebar">

        <div className="sidebar-title">
          TABLES
        </div>


        {!database && (
          <div className="empty-sidebar">
            Upload a database
          </div>
        )}


        {database &&
          loadingTables && (
            <div className="empty-sidebar">
              Loading tables...
            </div>
          )}


        {database &&
          !loadingTables &&
          tables.length === 0 && (
            <div className="empty-sidebar">
              No tables found
            </div>
          )}


        <div className="table-list">

          {tables.map((table) => (

            <button
              key={table}

              className={
                selectedTable === table
                  ? "table-item selected"
                  : "table-item"
              }

              onClick={() =>
                handleTableClick(table)
              }
            >

              <span>📁</span>

              <span>
                {table}
              </span>

            </button>

          ))}

        </div>

      </aside>


      {/* Main panel */}

      <section className="main-panel">

        {/* SQL Editor Header */}

        <div className="editor-header">

          <span>
            SQL Editor
          </span>


          <button
            className="execute-button"

            onClick={executeQuery}

            disabled={
              !database ||
              executing
            }
          >

            {executing
              ? "Executing..."
              : "Execute"}

          </button>

        </div>


        {/* SQL Editor */}

        <textarea
          className="sql-editor"

          value={sql}

          onChange={(event) =>
            setSql(event.target.value)
          }

          placeholder="Enter SQL query..."

          spellCheck={false}
        />

        <div className="results-header">

          <span>Results</span>


          {result && (
            <span className="row-count">
              {result.rows.length} row 
              {result.rows.length === 1 ? "" : "s"}
            </span>
          )}

        </div>


        {/* Results */}

        <div className="results-container">

          {!result && (
            <div className="empty-results">
              Execute a query to see results.
            </div>
          )}


          {result && result.columns.length === 0 && (
              <div className="empty-results">
                Query executed successfully.
              </div>
            )}

          {result && result.columns.length > 0 && (
              <table className="results-table">
                <thead>
                  <tr>
                    {result.columns.map(
                      (column) => (
                        <th key={column}>{column}</th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((value, columnIndex) => (
                            <td key={columnIndex}>{value}</td>
                          )
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            )}
        </div>
      </section>
    </main>
  </div>
)};

export default App;