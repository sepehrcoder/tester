export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="surface-flat p-5">
      <p className="font-body text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="tabular mt-2 font-display text-3xl font-extrabold text-ink">{value}</p>
    </div>
  );
}
