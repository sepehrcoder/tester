"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/Button";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface Overview {
  dealerCount: number;
  activeLeads: number;
  totalAccepted: number;
  closedWon: number;
  closedLost: number;
  conversionRate: number;
  totalListings: number;
  avgRating: number;
}

interface Me {
  name: string;
  inviteCode: string;
}

export default function CompanyDashboard() {
  const { data, loading, error } = useAuthedFetch<Overview>("/company/overview");
  const { data: me } = useAuthedFetch<Me>("/company/me");
  const [copied, setCopied] = useState(false);

  async function copyInvite() {
    if (!me) return;
    await navigator.clipboard.writeText(me.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <PageHeader title="Overview" subtitle={me ? `${me.name} — a rollup across every dealer who's joined.` : "Loading…"} />

      {me && (
        <div className="surface-flat mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-wide text-ink-soft">Invite code</p>
            <p className="mt-1 font-mono text-lg font-bold text-ink">{me.inviteCode}</p>
            <p className="mt-1 font-body text-xs text-ink-faint">
              Share this with dealers — they enter it under Dealer Console → Company to join.
            </p>
          </div>
          <Button variant="secondary" onClick={copyInvite}>
            {copied ? "Copied!" : "Copy code"}
          </Button>
        </div>
      )}

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Dealers" value={data.dealerCount} />
          <StatCard label="Active leads" value={data.activeLeads} />
          <StatCard label="Total accepted" value={data.totalAccepted} />
          <StatCard label="Closed won" value={data.closedWon} />
          <StatCard label="Closed lost" value={data.closedLost} />
          <StatCard label="Conversion rate" value={`${Math.round(data.conversionRate * 100)}%`} />
          <StatCard label="Total listings" value={data.totalListings} />
          <StatCard label="Avg. dealer rating" value={data.avgRating > 0 ? data.avgRating.toFixed(1) : "—"} />
        </div>
      )}
    </div>
  );
}
