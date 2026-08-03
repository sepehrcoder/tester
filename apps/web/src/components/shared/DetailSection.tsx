import type { ReactNode } from "react";

export function DetailSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="surface-flat mb-5 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-bold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function FactGrid({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {items.map((it) => (
        <div key={it.label}>
          <dt className="font-body text-xs text-ink-faint">{it.label}</dt>
          <dd className="mt-0.5 font-body text-sm font-semibold text-ink">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
