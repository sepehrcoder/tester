"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface FeedLead {
  id: string;
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
}

function formatBudget(min: string | null, max: string | null) {
  if (!min && !max) return null;
  const fmt = (v: string) => `PKR ${Number(v).toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min ?? max ?? "0");
}

export default function LeadFeedPage() {
  const { accessToken } = useAuth();
  const { data, loading, error, refetch } = useAuthedFetch<FeedLead[]>("/leads/feed");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  async function accept(id: string) {
    setAcceptingId(id);
    setAcceptError(null);
    try {
      await apiFetch(`/leads/${id}/accept`, { method: "POST", token: accessToken });
      refetch();
    } catch (err) {
      setAcceptError(err instanceof ApiError ? err.message : "This lead was just claimed by another dealer");
      refetch();
    } finally {
      setAcceptingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Lead feed"
        subtitle="Live requirements matched to your coverage cities and property types — first to accept gets the client."
      />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}
      {acceptError && <p className="mb-3 font-body text-sm text-ember">{acceptError}</p>}

      {data && data.length === 0 && (
        <p className="font-body text-sm text-ink-faint">
          No open requirements match your coverage right now — check your dealer profile&apos;s cities and
          property types if you expect to see leads here.
        </p>
      )}

      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((lead) => (
            <div key={lead.id} className="surface-flat flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-body text-sm font-bold text-ink">
                  {lead.requirement.propertyType} · {lead.requirement.purpose === "SALE" ? "Buying" : "Renting"}
                </p>
                <p className="font-body text-xs text-ink-soft">
                  {lead.requirement.area ? `${lead.requirement.area}, ` : ""}
                  {lead.requirement.city}
                  {lead.requirement.beds ? ` · ${lead.requirement.beds}+ bed` : ""}
                </p>
                {formatBudget(lead.requirement.budgetMin, lead.requirement.budgetMax) && (
                  <p className="font-body text-xs font-semibold text-teal">
                    {formatBudget(lead.requirement.budgetMin, lead.requirement.budgetMax)}
                  </p>
                )}
                {lead.requirement.notes && (
                  <p className="mt-1 max-w-md font-body text-xs text-ink-faint">{lead.requirement.notes}</p>
                )}
                <p className="mt-1 font-body text-[10px] text-ink-faint">
                  Posted {new Date(lead.createdAt).toLocaleString()}
                </p>
              </div>
              <Button variant="primary" onClick={() => accept(lead.id)} disabled={acceptingId === lead.id}>
                {acceptingId === lead.id ? "Accepting…" : "Accept"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
