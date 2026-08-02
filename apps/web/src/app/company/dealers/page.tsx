"use client";

import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table } from "@/components/shared/Table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";

interface Dealer {
  id: string;
  name: string;
  phone: string;
  agencyName: string | null;
  kycStatus: string;
  ratingAvg: number;
  ratingCount: number;
  activeLeads: number;
  totalAccepted: number;
  closedWon: number;
  closedLost: number;
  conversionRate: number;
  listingCount: number;
}

export default function CompanyDealersPage() {
  const { data, loading, error } = useAuthedFetch<Dealer[]>("/company/dealers");

  return (
    <div>
      <PageHeader title="Dealers" subtitle="Everyone who's joined with your invite code." />

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <Table
          rows={data}
          keyFor={(d) => d.id}
          emptyMessage="No dealers have joined yet — share your invite code from the Overview page."
          columns={[
            {
              header: "Dealer",
              cell: (d) => (
                <Link href={`/company/dealers/${d.id}`} className="font-semibold text-ink hover:text-ember">
                  {d.name}
                  <span className="block text-xs font-normal text-ink-soft">{d.agencyName ?? d.phone}</span>
                </Link>
              ),
            },
            { header: "KYC", cell: (d) => <StatusBadge status={d.kycStatus} /> },
            { header: "Active leads", cell: (d) => d.activeLeads, className: "tabular" },
            { header: "Closed won", cell: (d) => d.closedWon, className: "tabular" },
            { header: "Conversion", cell: (d) => `${Math.round(d.conversionRate * 100)}%`, className: "tabular" },
            { header: "Listings", cell: (d) => d.listingCount, className: "tabular" },
            {
              header: "Rating",
              cell: (d) => (d.ratingCount > 0 ? `${d.ratingAvg.toFixed(1)} ★ (${d.ratingCount})` : "—"),
            },
          ]}
        />
      )}
    </div>
  );
}
