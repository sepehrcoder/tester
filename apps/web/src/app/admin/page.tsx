"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface Stats {
  totalUsers: number;
  totalDealers: number;
  totalCompanies: number;
  totalPlazaManagers: number;
  totalTenants: number;
  pendingKyc: number;
  listingsPending: number;
  listingsApproved: number;
  requirementsOpen: number;
  leadsBroadcast: number;
  leadsAccepted: number;
  flaggedMessages: number;
  openReports: number;
  totalPlazas: number;
  totalRentalUnits: number;
  activeLeases: number;
  rentPaymentsPendingReview: number;
  openMaintenance: number;
}

export default function AdminDashboard() {
  const { data, loading, error } = useAuthedFetch<Stats>("/admin/stats");

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Platform-wide counts, live from the database." />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <>
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-soft">Marketplace</h2>
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
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

          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-soft">
            Companies &amp; property management
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Companies" value={data.totalCompanies} />
            <StatCard label="Plaza managers" value={data.totalPlazaManagers} />
            <StatCard label="Tenants" value={data.totalTenants} />
            <StatCard label="Plazas" value={data.totalPlazas} />
            <StatCard label="Rental units" value={data.totalRentalUnits} />
            <StatCard label="Active leases" value={data.activeLeases} />
            <StatCard label="Rent payments to review" value={data.rentPaymentsPendingReview} />
            <StatCard label="Open maintenance" value={data.openMaintenance} />
          </div>
        </>
      )}
    </div>
  );
}
