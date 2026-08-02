"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface Lease {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  rentAmount: string;
  depositAmount: string | null;
  agreementUrl: string | null;
  unit: {
    title: string;
    city: string;
    area: string | null;
    unitLayout: string;
    furnishing: string;
    plaza: { name: string } | null;
    owner: { name: string; phone: string } | null;
  };
}

export default function TenantOverviewPage() {
  const { data, loading, error } = useAuthedFetch<Lease[]>("/leases/mine");
  const active = data?.find((l) => l.status === "ACTIVE");
  const past = data?.filter((l) => l.status !== "ACTIVE") ?? [];

  return (
    <div>
      <PageHeader title="My lease" subtitle="Your current tenancy and who to contact." />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && !active && (
        <p className="font-body text-sm text-ink-soft">
          You don&apos;t have an active lease yet — ask your owner or plaza manager to add you as a tenant using this
          account&apos;s phone number.
        </p>
      )}

      {active && (
        <div className="surface-flat max-w-xl p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">{active.unit.title}</h2>
              <p className="font-body text-sm text-ink-soft">
                {active.unit.area ? `${active.unit.area}, ` : ""}
                {active.unit.city}
                {active.unit.plaza ? ` · ${active.unit.plaza.name}` : ""}
              </p>
            </div>
            <StatusBadge status={active.status} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-wide text-ink-soft">Rent</p>
              <p className="tabular font-display text-lg font-extrabold text-ink">
                PKR {Number(active.rentAmount).toLocaleString()}/mo
              </p>
            </div>
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-wide text-ink-soft">Lease term</p>
              <p className="font-body text-sm text-ink">
                {new Date(active.startDate).toLocaleDateString()} – {new Date(active.endDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-wide text-ink-soft">Layout</p>
              <p className="font-body text-sm text-ink">{active.unit.unitLayout.replaceAll("_", " ")}</p>
            </div>
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-wide text-ink-soft">Furnishing</p>
              <p className="font-body text-sm text-ink">{active.unit.furnishing.replaceAll("_", " ")}</p>
            </div>
          </div>

          {active.unit.owner && (
            <div className="mt-4 border-t border-flat-border pt-4">
              <p className="font-body text-xs font-bold uppercase tracking-wide text-ink-soft">Owner / manager</p>
              <p className="font-body text-sm text-ink">
                {active.unit.owner.name} · {active.unit.owner.phone}
              </p>
            </div>
          )}

          {active.agreementUrl && (
            <a href={active.agreementUrl} target="_blank" rel="noreferrer" className="mt-4 inline-block font-body text-sm font-semibold text-teal">
              View lease agreement ↗
            </a>
          )}
        </div>
      )}

      {past.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-2 font-display text-base font-bold text-ink">Past leases</h3>
          <ul className="flex flex-col gap-2">
            {past.map((l) => (
              <li key={l.id} className="surface-flat flex items-center justify-between p-4">
                <span className="font-body text-sm text-ink">{l.unit.title}</span>
                <StatusBadge status={l.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
