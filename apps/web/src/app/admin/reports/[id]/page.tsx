"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { DetailSection, FactGrid } from "@/components/shared/DetailSection";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface ReportDetail {
  id: string;
  targetType: string;
  reason: string;
  status: string;
  resolutionNotes: string | null;
  createdAt: string;
  reporter: { id: string; name: string; phone: string };
  listing: { id: string; title: string; owner: { id: string; name: string } } | null;
}

export default function AdminReportDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const { data, loading, error, refetch } = useAuthedFetch<ReportDetail>(`/admin/reports/${params.id}`);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function act(action: "resolve" | "dismiss") {
    setBusy(true);
    try {
      await apiFetch(`/admin/reports/${params.id}/${action}`, { method: "PATCH", token: accessToken, body: { notes: notes || undefined } });
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

  return (
    <div>
      <PageHeader
        backHref="/admin/reports"
        backLabel="All reports"
        title={data.listing ? data.listing.title : data.targetType}
        subtitle={`Reported by ${data.reporter.name} (${data.reporter.phone})`}
        action={<StatusBadge status={data.status} />}
      />

      <DetailSection title="Evidence">
        <FactGrid
          items={[
            { label: "Target type", value: data.targetType },
            { label: "Filed", value: new Date(data.createdAt).toLocaleString() },
          ]}
        />
        <p className="mt-3 font-body text-sm text-ink-soft">&ldquo;{data.reason}&rdquo;</p>
        {data.listing && (
          <Link href={`/admin/listings/${data.listing.id}`} className="mt-3 inline-block font-body text-xs font-semibold text-teal">
            View reported listing (owner: {data.listing.owner.name}) ↗
          </Link>
        )}
      </DetailSection>

      {data.status === "OPEN" ? (
        <DetailSection title="Resolution">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Resolution notes — what action was taken and why"
            rows={3}
            className="w-full rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none placeholder:text-ink-faint"
          />
          <div className="mt-3 flex gap-2">
            <button
              disabled={busy}
              onClick={() => act("resolve")}
              className="rounded-sm bg-teal-soft px-3 py-1.5 font-body text-xs font-bold text-teal disabled:opacity-50"
            >
              Resolve
            </button>
            <button
              disabled={busy}
              onClick={() => act("dismiss")}
              className="rounded-sm bg-flat px-3 py-1.5 font-body text-xs font-bold text-ink-soft disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        </DetailSection>
      ) : (
        <DetailSection title="Resolution">
          <p className="font-body text-sm text-ink-soft">{data.resolutionNotes || "No notes were left."}</p>
        </DetailSection>
      )}
    </div>
  );
}
