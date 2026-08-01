import type { ReactNode } from "react";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyFor: (row: T) => string;
  emptyMessage?: string;
}

export function Table<T>({ columns, rows, keyFor, emptyMessage = "Nothing here yet." }: TableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="surface-flat p-8 text-center font-body text-sm text-ink-soft">{emptyMessage}</div>
    );
  }

  return (
    <div className="surface-flat overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr className="border-b border-flat-border">
            {columns.map((col) => (
              <th
                key={col.header}
                className="px-4 py-3 text-left font-body text-xs font-bold uppercase tracking-wide text-ink-faint"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyFor(row)} className="border-b border-flat-border last:border-0">
              {columns.map((col) => (
                <td key={col.header} className={`px-4 py-3 font-body text-sm text-ink ${col.className ?? ""}`}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
