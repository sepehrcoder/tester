"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { DetailSection, FactGrid } from "@/components/shared/DetailSection";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface LeadDetail {
  id: string;
  status: string;
  acceptedAt: string | null;
  slaDeadline: string | null;
  createdAt: string;
  requirement: {
    propertyType: string;
    purpose: string;
    city: string;
    area: string | null;
    budgetMin: string | null;
    budgetMax: string | null;
    beds: number | null;
    notes: string | null;
  };
  dealer: { id: string; name: string; phone: string } | null;
  statusUpdates: { id: string; stage: string; note: string | null; createdAt: string }[];
}

interface DealerOption {
  id: string;
  name: string;
  dealerProfile: { agencyName: string | null } | null;
}

export default function AdminLeadDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const { data, loading, error, refetch } = useAuthedFetch<LeadDetail>(`/admin/leads/${params.id}`);
  const [dealers, setDealers] = useState<DealerOption[]>([]);
  const [selectedDealer, setSelectedDealer] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    apiFetch<DealerOption[]>("/admin/dealers", { token: accessToken })
      .then(setDealers)
      .catch(() => {});
  }, [accessToken]);

  async function reassign() {
    if (!selectedDealer) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/leads/${params.id}/reassign`, {
        method: "PATCH",
        token: accessToken,
        body: { dealerId: selectedDealer },
      });
      setSelectedDealer("");
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function forceRelease() {
    if (!confirm("Force-release this lead? It reopens to every matched dealer.")) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/leads/${params.id}/release`, { method: "PATCH", token: accessToken });
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="font-body text-sm text-ink-soft">Loading…</p>;
  if (error) return <p className="font-body text-sm text-ember">{error}</p>;
  if (!data) return null;

  const r = data.requirement;

  return (
    <div>
      <PageHeader
        backHref="/admin/leads"
        backLabel="All leads"
        title={`${r.propertyType} · ${r.purpose === "SALE" ? "Sale" : "Rent"}`}
        subtitle={`${r.area ? `${r.area}, ` : ""}${r.city}`}
        action={<StatusBadge status={data.status} />}
      />

      <DetailSection title="Requirement">
        <FactGrid
          items={[
            {
              label: "Budget",
              value:
                r.budgetMin || r.budgetMax
                  ? `PKR ${r.budgetMin ? Number(r.budgetMin).toLocaleString() : "?"} – ${r.budgetMax ? Number(r.budgetMax).toLocaleString() : "?"}`
                  : "Not specified",
            },
            { label: "Beds", value: r.beds ?? "—" },
            { label: "Posted", value: new Date(data.createdAt).toLocaleDateString() },
          ]}
        />
        {r.notes && <p className="mt-3 font-body text-sm text-ink-soft">&ldquo;{r.notes}&rdquo;</p>}
      </DetailSection>

      <DetailSection title="Current assignment">
        <FactGrid
          items={[
            { label: "Dealer", value: data.dealer ? `${data.dealer.name} (${data.dealer.phone})` : "Unclaimed" },
            { label: "Accepted", value: data.acceptedAt ? new Date(data.acceptedAt).toLocaleString() : "—" },
            { label: "SLA deadline", value: data.slaDeadline ? new Date(data.slaDeadline).toLocaleString() : "—" },
          ]}
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={selectedDealer}
            onChange={(e) => setSelectedDealer(e.target.value)}
            className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
          >
            <option value="">Reassign to…</option>
            {dealers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} {d.dealerProfile?.agencyName ? `— ${d.dealerProfile.agencyName}` : ""}
              </option>
            ))}
          </select>
          <button
            disabled={busy || !selectedDealer}
            onClick={reassign}
            className="rounded-sm bg-teal-soft px-3 py-1.5 font-body text-xs font-bold text-teal disabled:opacity-50"
          >
            Reassign
          </button>
          {data.dealer && (
            <button
              disabled={busy}
              onClick={forceRelease}
              className="rounded-sm bg-ember px-3 py-1.5 font-body text-xs font-bold text-ember-ink disabled:opacity-50"
            >
              Force-release
            </button>
          )}
        </div>
      </DetailSection>

      <DetailSection title="Status timeline">
        {data.statusUpdates.length === 0 ? (
          <p className="font-body text-sm text-ink-faint">No status updates logged yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {data.statusUpdates.map((s) => (
              <li key={s.id} className="font-body text-sm text-ink-soft">
                · <span className="font-semibold text-ink">{s.stage.replaceAll("_", " ")}</span>
                {s.note ? ` — ${s.note}` : ""} ({new Date(s.createdAt).toLocaleString()})
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </div>
  );
}
