"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface Lease {
  id: string;
  status: string;
}

interface MaintenanceItem {
  id: string;
  title: string;
  description: string | null;
  cost: string | null;
  status: string;
}

export default function TenantMaintenancePage() {
  const { accessToken } = useAuth();
  const [lease, setLease] = useState<Lease | null | undefined>(undefined);
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const leases = await apiFetch<Lease[]>("/leases/mine", { token: accessToken });
    const active = leases.find((l) => l.status === "ACTIVE") ?? null;
    setLease(active);
    if (active) {
      const m = await apiFetch<MaintenanceItem[]>(`/leases/${active.id}/maintenance`, { token: accessToken });
      setItems(m);
    }
  }, [accessToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!lease) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/leases/${lease.id}/maintenance`, {
        method: "POST",
        token: accessToken,
        body: { title, ...(description ? { description } : {}) },
      });
      setTitle("");
      setDescription("");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Maintenance" subtitle="Raise an issue and track it through to resolved." />

      {lease === undefined && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {lease === null && <p className="font-body text-sm text-ink-soft">No active lease yet.</p>}

      {lease && (
        <>
          <form onSubmit={submit} className="surface-flat mb-6 flex flex-wrap items-end gap-3 p-5">
            <TextField label="Issue" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <TextField label="Details (optional)" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Button variant="primary" type="submit" disabled={busy}>
              {busy ? "Raising…" : "Raise request"}
            </Button>
            {error && <p className="w-full font-body text-sm text-ember">{error}</p>}
          </form>

          <div className="surface-flat divide-y divide-flat-border">
            {items.length === 0 && <p className="p-4 font-body text-sm text-ink-faint">No maintenance requests yet.</p>}
            {items.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-body text-sm font-semibold text-ink">{m.title}</p>
                  {m.description && <p className="font-body text-xs text-ink-soft">{m.description}</p>}
                  {m.cost && <p className="font-body text-xs text-ink-faint">Cost: PKR {Number(m.cost).toLocaleString()}</p>}
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
