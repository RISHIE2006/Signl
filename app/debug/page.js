import { getDebugDatabaseSnapshot } from '@/src/lib/debug-db';

export const dynamic = 'force-dynamic';

function renderValue(value) {
  if (value === null) return 'NULL';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function DebugPage() {
  const snapshot = getDebugDatabaseSnapshot();

  return (
    <main style={{ padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Signl Debug Dashboard</h1>
      <p>Database file: {snapshot.databasePath}</p>

      {snapshot.tables.length === 0 ? (
        <p>No database tables found yet.</p>
      ) : (
        snapshot.tables.map((table) => (
          <section key={table.name} style={{ marginTop: '24px' }}>
            <h2>{table.name}</h2>
            <p>Columns: {table.columns.map((column) => column.name).join(', ')}</p>
            <div style={{ overflowX: 'auto' }}>
              <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {table.columns.map((column) => (
                      <th key={column.name}>{column.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.length === 0 ? (
                    <tr>
                      <td colSpan={table.columns.length}>No rows</td>
                    </tr>
                  ) : (
                    table.rows.map((row, index) => (
                      <tr key={`${table.name}-${index}`}>
                        {table.columns.map((column) => (
                          <td key={`${table.name}-${column.name}-${index}`}>
                            {renderValue(row[column.name])}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </main>
  );
}
