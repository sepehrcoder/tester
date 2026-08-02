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

interface RentPayment {
  id: string;
  forMonth: string;
  amount: string;
  proofUrl: string | null;
  status: string;
  note: string | null;
}

export default function TenantPaymentsPage() {
  const { accessToken } = useAuth();
  const [lease, setLease] = useState<Lease | null | undefined>(undefined);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [monthRaw, setMonthRaw] = useState("");
  const [amount, setAmount] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      const leases = await apiFetch<Lease[]>("/leases/mine", { token: accessToken });
      const active = leases.find((l) => l.status === "ACTIVE") ?? null;
      setLease(active);
      if (active) {
        const p = await apiFetch<RentPayment[]>(`/leases/${active.id}/rent-payments`, { token: accessToken });
        setPayments(p);
      }
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Something went wrong");
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
      await apiFetch(`/leases/${lease.id}/rent-payments`, {
        method: "POST",
        token: accessToken,
        body: { forMonth: `${monthRaw}-01`, amount: Number(amount), ...(proofUrl ? { proofUrl } : {}) },
      });
      setMonthRaw("");
      setAmount("");
      setProofUrl("");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Rent payments" subtitle="Submit proof each month, and track review status." />

      {lease === undefined && !loadError && <p className="font-body text-sm text-ink-soft">Loading…</p>}
      {loadError && (
        <div className="mb-4 flex items-center gap-3">
          <p className="font-body text-sm text-ember">{loadError}</p>
          <button onClick={reload} className="font-body text-sm font-semibold text-teal">
            Retry
          </button>
        </div>
      )}
      {lease === null && !loadError && <p className="font-body text-sm text-ink-soft">No active lease yet.</p>}

      {lease && (
        <>
          <form onSubmit={submit} className="surface-flat mb-6 flex flex-wrap items-end gap-3 p-5">
            <TextField label="Month" name="forMonth" type="month" value={monthRaw} onChange={(e) => setMonthRaw(e.target.value)} required />
            <TextField label="Amount (PKR)" name="amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <TextField label="Proof URL (optional)" name="proofUrl" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} />
            <Button variant="primary" type="submit" disabled={busy}>
              {busy ? "Submitting…" : "Submit payment"}
            </Button>
            {error && <p className="w-full font-body text-sm text-ember">{error}</p>}
          </form>

          <div className="surface-flat divide-y divide-flat-border">
            {payments.length === 0 && <p className="p-4 font-body text-sm text-ink-faint">No payments submitted yet.</p>}
            {payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-body text-sm font-semibold text-ink">
                    {new Date(p.forMonth).toLocaleDateString(undefined, { month: "long", year: "numeric" })} — PKR{" "}
                    {Number(p.amount).toLocaleString()}
                  </p>
                  {p.proofUrl && (
                    <a href={p.proofUrl} target="_blank" rel="noreferrer" className="font-body text-xs text-teal">
                      View proof ↗
                    </a>
                  )}
                  {p.note && <p className="font-body text-xs text-ink-soft">{p.note}</p>}
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
