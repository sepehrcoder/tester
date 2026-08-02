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

interface UtilityBill {
  id: string;
  type: string;
  billMonth: string;
  amount: string;
  documentUrl: string | null;
  status: string;
}

const selectClass =
  "rounded-sm border border-flat-border bg-flat px-4 py-3 font-body text-sm text-ink outline-none focus:border-ember";

export default function TenantUtilityBillsPage() {
  const { accessToken } = useAuth();
  const [lease, setLease] = useState<Lease | null | undefined>(undefined);
  const [bills, setBills] = useState<UtilityBill[]>([]);
  const [type, setType] = useState("ELECTRICITY");
  const [monthRaw, setMonthRaw] = useState("");
  const [amount, setAmount] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      const leases = await apiFetch<Lease[]>("/leases/mine", { token: accessToken });
      const active = leases.find((l) => l.status === "ACTIVE") ?? null;
      setLease(active);
      if (active) {
        const b = await apiFetch<UtilityBill[]>(`/leases/${active.id}/utility-bills`, { token: accessToken });
        setBills(b);
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
      await apiFetch(`/leases/${lease.id}/utility-bills`, {
        method: "POST",
        token: accessToken,
        body: { type, billMonth: `${monthRaw}-01`, amount: Number(amount), ...(documentUrl ? { documentUrl } : {}) },
      });
      setMonthRaw("");
      setAmount("");
      setDocumentUrl("");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Utility bills" subtitle="Upload each bill so your owner or plaza manager can track it." />

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
            <label className="flex flex-col gap-1.5">
              <span className="font-body text-xs font-bold uppercase tracking-wide text-ink-soft">Type</span>
              <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
                {["ELECTRICITY", "GAS", "WATER", "INTERNET", "OTHER"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <TextField label="Month" name="billMonth" type="month" value={monthRaw} onChange={(e) => setMonthRaw(e.target.value)} required />
            <TextField label="Amount (PKR)" name="amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <TextField label="Document URL (optional)" name="documentUrl" value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} />
            <Button variant="primary" type="submit" disabled={busy}>
              {busy ? "Uploading…" : "Upload bill"}
            </Button>
            {error && <p className="w-full font-body text-sm text-ember">{error}</p>}
          </form>

          <div className="surface-flat divide-y divide-flat-border">
            {bills.length === 0 && <p className="p-4 font-body text-sm text-ink-faint">No utility bills uploaded yet.</p>}
            {bills.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-body text-sm font-semibold text-ink">
                    {b.type.replaceAll("_", " ")} — PKR {Number(b.amount).toLocaleString()}
                  </p>
                  <p className="font-body text-xs text-ink-soft">
                    {new Date(b.billMonth).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </p>
                  {b.documentUrl && (
                    <a href={b.documentUrl} target="_blank" rel="noreferrer" className="font-body text-xs text-teal">
                      View bill ↗
                    </a>
                  )}
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
