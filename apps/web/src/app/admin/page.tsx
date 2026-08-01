"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface Stats {
  totalUsers: number;
  totalDealers: number;
  pendingKyc: number;
  listingsPending: number;
  listingsApproved: number;
  requirementsOpen: number;
  leadsBroadcast: number;
  leadsAccepted: number;
  flaggedMessages: number;
  openReports: number;
}

export default function AdminDashboard() {
  const { data, loading, error } = useAuthedFetch<Stats>("/admin/stats");

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Platform-wide counts, live from the database." />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Customers" value={data.totalUsers} />
          <StatCard label="Dealers" value={data.totalDealers} />
          <StatCard label="Pending KYC" value={data.pendingKyc} />
          <StatCard label="Listings pending" value={data.listingsPending} />
          <StatCard label="Listings approved" value={data.listingsApproved} />
          <StatCard label="Requirements open" value={data.requirementsOpen} />
          <StatCard label="Leads broadcasting" value={data.leadsBroadcast} />
          <StatCard label="Leads accepted" value={data.leadsAccepted} />
          <StatCard label="Flagged messages" value={data.flaggedMessages} />
          <StatCard label="Open reports" value={data.openReports} />
        </div>
      )}
    </div>
  );
}
