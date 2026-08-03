"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { DetailSection, FactGrid } from "@/components/shared/DetailSection";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  price: string;
  city: string;
  area: string;
  society: { name: string } | null;
  phase: { name: string } | null;
  block: { name: string } | null;
  status: string;
  verified: boolean;
  promoTier: string;
  purpose: string;
  propertyType: string;
  beds: number | null;
  baths: number | null;
  sizeValue: number | null;
  sizeUnit: string | null;
  createdAt: string;
  photos: { id: string; url: string }[];
  owner: { id: string; name: string; role: string };
}

interface AuditEntry {
  id: string;
  action: string;
  createdAt: string;
  actor: { name: string };
}

interface ReportEntry {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { name: string };
}

interface EditForm {
  title?: string;
  description?: string;
  price?: string;
  city?: string;
  area?: string;
  societyName?: string;
  phaseName?: string;
  blockName?: string;
  beds?: number | null;
  baths?: number | null;
  sizeValue?: number | null;
  sizeUnit?: string | null;
}

export default function AdminListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();
  const { data, loading, error, refetch } = useAuthedFetch<ListingDetail>(`/listings/${params.id}`);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>({});
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [reports, setReports] = useState<ReportEntry[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    apiFetch<AuditEntry[]>(`/admin/audit-log?targetId=${params.id}`, { token: accessToken })
      .then(setHistory)
      .catch(() => {});
    apiFetch<ReportEntry[]>(`/admin/reports?listingId=${params.id}`, { token: accessToken })
      .then(setReports)
      .catch(() => {});
  }, [accessToken, params.id]);

  async function moderate(status: "APPROVED" | "REJECTED" | "FLAGGED", verified?: boolean) {
    setBusy(true);
    try {
      await apiFetch(`/admin/listings/${params.id}/moderate`, { method: "PATCH", token: accessToken, body: { status, verified } });
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function promote(tier: "FEATURED" | "PREMIUM") {
    setBusy(true);
    try {
      await apiFetch(`/admin/listings/${params.id}/promote`, { method: "PATCH", token: accessToken, body: { tier, days: 30 } });
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function unpromote() {
    setBusy(true);
    try {
      await apiFetch(`/admin/listings/${params.id}/unpromote`, { method: "PATCH", token: accessToken });
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function startEdit() {
    if (!data) return;
    setForm({
      title: data.title,
      description: data.description,
      price: data.price,
      city: data.city,
      area: data.area,
      societyName: data.society?.name ?? "",
      phaseName: data.phase?.name ?? "",
      blockName: data.block?.name ?? "",
      beds: data.beds,
      baths: data.baths,
      sizeValue: data.sizeValue,
      sizeUnit: data.sizeUnit,
    });
    setEditing(true);
  }

  async function saveEdit() {
    setBusy(true);
    try {
      await apiFetch(`/listings/${params.id}`, {
        method: "PATCH",
        token: accessToken,
        body: {
          ...form,
          price: form.price != null ? Number(form.price) : undefined,
          beds: form.beds != null ? Number(form.beds) : undefined,
          baths: form.baths != null ? Number(form.baths) : undefined,
          sizeValue: form.sizeValue != null ? Number(form.sizeValue) : undefined,
        },
      });
      setEditing(false);
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function deleteListing() {
    if (!confirm("Delete this listing permanently? This can't be undone.")) return;
    setBusy(true);
    try {
      await apiFetch(`/listings/${params.id}`, { method: "DELETE", token: accessToken });
      router.push("/admin/listings");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  if (loading) return <p className="font-body text-sm text-ink-soft">Loading…</p>;
  if (error) return <p className="font-body text-sm text-ember">{error}</p>;
  if (!data) return null;

  return (
    <div>
      <PageHeader
        backHref="/admin/listings"
        backLabel="All listings"
        title={data.title}
        subtitle={`${data.owner.name} (${data.owner.role}) · ${data.area}, ${data.city}`}
        action={
          <div className="flex gap-2">
            <StatusBadge status={data.status} />
            {data.verified && <Badge variant="teal">Verified</Badge>}
            {data.promoTier !== "STANDARD" && <Badge variant="ember">{data.promoTier}</Badge>}
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          disabled={busy}
          onClick={() => moderate("APPROVED", true)}
          className="rounded-sm bg-teal-soft px-3 py-1.5 font-body text-xs font-bold text-teal disabled:opacity-50"
        >
          Approve
        </button>
        <button
          disabled={busy}
          onClick={() => moderate("REJECTED")}
          className="rounded-sm bg-ember px-3 py-1.5 font-body text-xs font-bold text-ember-ink disabled:opacity-50"
        >
          Reject
        </button>
        <button
          disabled={busy}
          onClick={() => moderate("FLAGGED")}
          className="rounded-sm bg-flat px-3 py-1.5 font-body text-xs font-bold text-ink-soft disabled:opacity-50"
        >
          Flag
        </button>
        <button
          disabled={busy}
          onClick={startEdit}
          className="rounded-sm bg-flat px-3 py-1.5 font-body text-xs font-bold text-ink-soft disabled:opacity-50"
        >
          Edit
        </button>
        {data.promoTier === "STANDARD" ? (
          <>
            <button
              disabled={busy}
              onClick={() => promote("FEATURED")}
              className="rounded-sm bg-flat px-3 py-1.5 font-body text-xs font-bold text-ink-soft disabled:opacity-50"
            >
              Feature (30d)
            </button>
            <button
              disabled={busy}
              onClick={() => promote("PREMIUM")}
              className="rounded-sm bg-flat px-3 py-1.5 font-body text-xs font-bold text-ink-soft disabled:opacity-50"
            >
              Promote to Premium (30d)
            </button>
          </>
        ) : (
          <button
            disabled={busy}
            onClick={unpromote}
            className="rounded-sm bg-flat px-3 py-1.5 font-body text-xs font-bold text-ink-soft disabled:opacity-50"
          >
            Remove promotion
          </button>
        )}
        <button
          disabled={busy}
          onClick={deleteListing}
          className="rounded-sm bg-ember px-3 py-1.5 font-body text-xs font-bold text-ember-ink disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {editing ? (
        <DetailSection title="Edit listing">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="font-body text-xs text-ink-faint">Title</span>
              <input
                value={form.title ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="font-body text-xs text-ink-faint">Description</span>
              <textarea
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-ink-faint">Price (PKR)</span>
              <input
                type="number"
                value={form.price ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-ink-faint">City</span>
              <input
                value={form.city ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-ink-faint">Area (legacy display fallback)</span>
              <input
                value={form.area ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-ink-faint">Society (e.g. Bahria Town)</span>
              <input
                value={form.societyName ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, societyName: e.target.value }))}
                className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-ink-faint">Phase (e.g. Phase 6)</span>
              <input
                value={form.phaseName ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, phaseName: e.target.value }))}
                disabled={!form.societyName}
                className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none disabled:opacity-50"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-ink-faint">Block (e.g. Block C)</span>
              <input
                value={form.blockName ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, blockName: e.target.value }))}
                disabled={!form.phaseName}
                className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none disabled:opacity-50"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-ink-faint">Beds</span>
              <input
                type="number"
                value={form.beds ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, beds: e.target.value ? Number(e.target.value) : null }))}
                className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-ink-faint">Baths</span>
              <input
                type="number"
                value={form.baths ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, baths: e.target.value ? Number(e.target.value) : null }))}
                className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-ink-faint">Size value</span>
              <input
                type="number"
                value={form.sizeValue ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, sizeValue: e.target.value ? Number(e.target.value) : null }))}
                className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-ink-faint">Size unit</span>
              <input
                value={form.sizeUnit ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, sizeUnit: e.target.value }))}
                className="rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              disabled={busy}
              onClick={saveEdit}
              className="rounded-sm bg-teal-soft px-3 py-1.5 font-body text-xs font-bold text-teal disabled:opacity-50"
            >
              Save changes
            </button>
            <button onClick={() => setEditing(false)} className="font-body text-xs font-semibold text-ink-faint">
              Cancel
            </button>
          </div>
        </DetailSection>
      ) : (
        <DetailSection title="Listing data">
          <FactGrid
            items={[
              { label: "Price", value: `PKR ${Number(data.price).toLocaleString()}` },
              { label: "Type", value: `${data.propertyType} · ${data.purpose === "SALE" ? "For sale" : "For rent"}` },
              { label: "Beds / Baths", value: `${data.beds ?? "—"} / ${data.baths ?? "—"}` },
              { label: "Size", value: data.sizeValue ? `${data.sizeValue} ${data.sizeUnit}` : "—" },
              {
                label: "Location",
                value: [data.society?.name, data.phase?.name, data.block?.name].filter(Boolean).join(" › ") || "Unstructured",
              },
              { label: "Photos", value: data.photos.length },
              { label: "Posted", value: new Date(data.createdAt).toLocaleDateString() },
            ]}
          />
          <p className="mt-3 whitespace-pre-line font-body text-sm text-ink-soft">{data.description}</p>
        </DetailSection>
      )}

      <DetailSection title="Moderation history">
        {history.length === 0 ? (
          <p className="font-body text-sm text-ink-faint">No moderation actions logged yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {history.map((h) => (
              <li key={h.id} className="font-body text-sm text-ink-soft">
                · {h.action.replaceAll("_", " ")} by {h.actor.name} — {new Date(h.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title={`Reports (${reports.length})`}>
        {reports.length === 0 ? (
          <p className="font-body text-sm text-ink-faint">No reports filed against this listing.</p>
        ) : (
          <ul className="space-y-1.5">
            {reports.map((r) => (
              <li key={r.id} className="font-body text-sm text-ink-soft">
                · <StatusBadge status={r.status} /> &ldquo;{r.reason}&rdquo; by {r.reporter.name} — {new Date(r.createdAt).toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </div>
  );
}
