"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface Stats {
  totalAccepted: number;
  activeLeads: number;
  closedWon: number;
  closedLost: number;
  releasedSla: number;
  conversionRate: number;
  listings: Record<string, number>;
  ratingAvg: number;
  ratingCount: number;
  kycStatus: string;
  company: { id: string; name: string } | null;
}

export default function DealerDashboard() {
  const { data, loading, error } = useAuthedFetch<Stats>("/users/me/stats");

  return (
    <div>
      <PageHeader title="Overview" subtitle="Your leads, listings, and performance." />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <>
          <div className="mb-6 flex items-center gap-3">
            <span className="font-body text-sm text-ink-soft">KYC status</span>
            <StatusBadge status={data.kycStatus} />
            {data.company && (
              <span className="font-body text-sm text-ink-soft">
                · Part of <span className="font-semibold text-ink">{data.company.name}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Active leads" value={data.activeLeads} />
            <StatCard label="Total accepted" value={data.totalAccepted} />
            <StatCard label="Closed won" value={data.closedWon} />
            <StatCard label="Closed lost" value={data.closedLost} />
            <StatCard label="Missed SLA" value={data.releasedSla} />
            <StatCard label="Conversion rate" value={`${Math.round(data.conversionRate * 100)}%`} />
            <StatCard label="Rating" value={data.ratingCount > 0 ? `${data.ratingAvg.toFixed(1)} ★ (${data.ratingCount})` : "No reviews yet"} />
            <StatCard label="Listings live" value={data.listings.APPROVED ?? 0} />
          </div>
        </>
      )}
    </div>
  );
}
