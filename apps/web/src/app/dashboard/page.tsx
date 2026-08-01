"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface Stats {
  requirements: { OPEN: number; CLOSED: number; CANCELLED: number };
  listings: { PENDING: number; APPROVED: number; REJECTED: number; FLAGGED: number; ARCHIVED: number };
  leadsInProgress: number;
}

export default function CustomerDashboard() {
  const { data, loading, error } = useAuthedFetch<Stats>("/users/me/stats");

  return (
    <div>
      <PageHeader title="Overview" subtitle="Your requirements, listings, and leads in one place." />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard label="Open requirements" value={data.requirements.OPEN} />
          <StatCard label="Leads in progress" value={data.leadsInProgress} />
          <StatCard label="Closed requirements" value={data.requirements.CLOSED} />
          <StatCard label="Listings pending review" value={data.listings.PENDING} />
          <StatCard label="Listings live" value={data.listings.APPROVED} />
          <StatCard label="Listings flagged" value={data.listings.FLAGGED} />
        </div>
      )}
    </div>
  );
}
