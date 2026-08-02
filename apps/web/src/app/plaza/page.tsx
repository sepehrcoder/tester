"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { useAuthedFetch } from "@/lib/useAuthedFetch";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface Plaza {
  id: string;
  name: string;
  city: string | null;
  area: string | null;
  totalFloors: number | null;
  unitCount: number;
  occupiedCount: number;
  vacantCount: number;
}

export default function PlazasPage() {
  const { accessToken } = useAuth();
  const { data, loading, error, refetch } = useAuthedFetch<Plaza[]>("/plazas/mine");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await apiFetch("/plazas", {
        method: "POST",
        token: accessToken,
        body: { name, city: city || undefined, totalFloors: totalFloors ? Number(totalFloors) : undefined },
      });
      setName("");
      setCity("");
      setTotalFloors("");
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
        title="My plazas"
        subtitle="Buildings you manage — floors, units, occupancy at a glance."
        action={
          <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Add a plaza"}
          </Button>
        }
      />

      {showForm && (
        <form onSubmit={submit} className="surface-flat mb-6 flex flex-wrap items-end gap-3 p-5">
          <TextField label="Name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField label="City" name="city" value={city} onChange={(e) => setCity(e.target.value)} />
          <TextField label="Total floors" name="totalFloors" type="number" min={1} value={totalFloors} onChange={(e) => setTotalFloors(e.target.value)} />
          <Button variant="secondary" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create plaza"}
          </Button>
          {formError && <p className="w-full font-body text-sm text-ember">{formError}</p>}
        </form>
      )}

      {loading && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.length === 0 && <p className="font-body text-sm text-ink-soft">No plazas yet — add one above.</p>}
          {data.map((p) => (
            <Link key={p.id} href={`/plaza/${p.id}`} className="surface-flat p-5 hover:bg-flat">
              <h3 className="font-display text-lg font-bold text-ink">{p.name}</h3>
              <p className="font-body text-sm text-ink-soft">
                {p.city ?? "No city set"}
                {p.totalFloors ? ` · ${p.totalFloors} floors` : ""}
              </p>
              <div className="mt-3 flex gap-4 font-body text-sm">
                <span className="text-ink">{p.unitCount} units</span>
                <span className="text-teal">{p.occupiedCount} occupied</span>
                <span className="text-ink-soft">{p.vacantCount} vacant</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
