"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface PlazaUnit {
  id: string;
  floorNumber: number | null;
  title: string;
  unitLayout: string;
  furnishing: string;
  monthlyRent: string;
  occupancy: string;
  owner: { name: string } | null;
  leases: { tenant: { name: string } }[];
}

interface PlazaDetail {
  id: string;
  name: string;
  city: string | null;
  units: PlazaUnit[];
}

const selectClass =
  "rounded-sm border border-flat-border bg-flat px-4 py-3 font-body text-sm text-ink outline-none focus:border-ember";

export default function PlazaDetailPage() {
  const params = useParams<{ plazaId: string }>();
  const { accessToken } = useAuth();
  const { data, loading, error, refetch } = useAuthedFetch<PlazaDetail>(`/plazas/${params.plazaId}`);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [unitLayout, setUnitLayout] = useState("TWO_BED");
  const [furnishing, setFurnishing] = useState("UNFURNISHED");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch(`/plazas/${params.plazaId}/units`, {
        method: "POST",
        token: accessToken,
        body: {
          title,
          city: data?.city ?? "",
          unitLayout,
          furnishing,
          monthlyRent: Number(monthlyRent),
          ...(floorNumber ? { floorNumber: Number(floorNumber) } : {}),
        },
      });
      setTitle("");
      setFloorNumber("");
      setMonthlyRent("");
      setShowForm(false);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={data?.name ?? "Plaza"}
        subtitle={data ? data.city ?? undefined : "Loading…"}
        action={
          <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Add a unit"}
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={submit} className="surface-flat mb-6 grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <TextField label="Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <TextField label="Floor number" name="floorNumber" type="number" value={floorNumber} onChange={(e) => setFloorNumber(e.target.value)} />
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-xs font-bold uppercase tracking-wide text-ink-soft">Layout</span>
            <select value={unitLayout} onChange={(e) => setUnitLayout(e.target.value)} className={selectClass}>
              {["STUDIO", "ONE_BED", "TWO_BED", "THREE_BED", "FOUR_BED_PLUS", "SHOP", "OFFICE"].map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-xs font-bold uppercase tracking-wide text-ink-soft">Furnishing</span>
            <select value={furnishing} onChange={(e) => setFurnishing(e.target.value)} className={selectClass}>
              {["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"].map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <TextField
            label="Monthly rent (PKR)"
            name="monthlyRent"
            type="number"
            min={0}
            value={monthlyRent}
            onChange={(e) => setMonthlyRent(e.target.value)}
            required
          />
          {formError && <p className="font-body text-sm text-ember sm:col-span-2">{formError}</p>}
          <Button variant="secondary" type="submit" disabled={busy} className="sm:col-span-2 justify-center">
            {busy ? "Adding…" : "Add unit"}
          </Button>
        </form>
      )}

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.units.length === 0 && <p className="font-body text-sm text-ink-soft">No units yet — add one above.</p>}
          {data.units.map((u) => (
            <Link key={u.id} href={`/plaza/units/${u.id}`} className="surface-flat p-4 hover:bg-flat">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-body text-xs text-ink-faint">{u.floorNumber != null ? `Floor ${u.floorNumber}` : "No floor set"}</p>
                  <p className="font-display font-bold text-ink">{u.title}</p>
                  <p className="font-body text-xs text-ink-soft">{u.unitLayout.replaceAll("_", " ")} · {u.furnishing.replaceAll("_", " ")}</p>
                </div>
                <StatusBadge status={u.occupancy} />
              </div>
              <p className="tabular mt-2 font-body text-sm font-semibold text-ink">PKR {Number(u.monthlyRent).toLocaleString()}/mo</p>
              <p className="mt-1 font-body text-xs text-ink-soft">
                {u.owner ? `Owner: ${u.owner.name}` : "No owner linked"}
                {u.leases[0] ? ` · Tenant: ${u.leases[0].tenant.name}` : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
