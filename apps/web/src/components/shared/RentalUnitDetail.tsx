"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { LeaseChatPanel } from "@/components/shared/LeaseChatPanel";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface Lease {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  rentAmount: string;
  depositAmount: string | null;
  agreementUrl: string | null;
  tenant: { id: string; name: string; phone: string };
}

interface RentalUnit {
  id: string;
  title: string;
  city: string;
  area: string | null;
  unitLayout: string;
  furnishing: string;
  monthlyRent: string;
  occupancy: string;
  floorNumber: number | null;
  plaza: { id: string; name: string; managerId: string } | null;
  owner: { id: string; name: string; phone: string } | null;
  leases: Lease[];
}

interface RentPayment {
  id: string;
  forMonth: string;
  amount: string;
  proofUrl: string | null;
  status: string;
  note: string | null;
  reviewedBy: { name: string } | null;
}

interface UtilityBill {
  id: string;
  type: string;
  billMonth: string;
  amount: string;
  documentUrl: string | null;
  status: string;
}

interface MaintenanceItem {
  id: string;
  title: string;
  description: string | null;
  cost: string | null;
  status: string;
  raisedBy: { name: string; role: string };
}

const selectClass =
  "rounded-sm border border-flat-border bg-flat px-4 py-3 font-body text-sm text-ink outline-none focus:border-ember";

export function RentalUnitDetail({ unitId }: { unitId: string }) {
  const { user, accessToken } = useAuth();
  const [unit, setUnit] = useState<RentalUnit | null>(null);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [bills, setBills] = useState<UtilityBill[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const activeLease = unit?.leases.find((l) => l.status === "ACTIVE") ?? null;

  const reload = useCallback(async () => {
    try {
      const u = await apiFetch<RentalUnit>(`/rental-units/${unitId}`, { token: accessToken });
      setUnit(u);
      const lease = u.leases.find((l) => l.status === "ACTIVE");
      if (lease) {
        const [p, b, m] = await Promise.all([
          apiFetch<RentPayment[]>(`/leases/${lease.id}/rent-payments`, { token: accessToken }),
          apiFetch<UtilityBill[]>(`/leases/${lease.id}/utility-bills`, { token: accessToken }),
          apiFetch<MaintenanceItem[]>(`/leases/${lease.id}/maintenance`, { token: accessToken }),
        ]);
        setPayments(p);
        setBills(b);
        setMaintenance(m);
      } else {
        setPayments([]);
        setBills([]);
        setMaintenance([]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }, [unitId, accessToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  const isController = !!unit && (unit.owner?.id === user?.id || unit.plaza?.managerId === user?.id);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!unit) return <p className="font-body text-sm text-ink-soft">{error ?? "Loading…"}</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="surface-flat p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">{unit.title}</h2>
            <p className="font-body text-sm text-ink-soft">
              {unit.area ? `${unit.area}, ` : ""}
              {unit.city}
              {unit.floorNumber != null ? ` · Floor ${unit.floorNumber}` : ""}
              {unit.plaza ? ` · ${unit.plaza.name}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="ghost">{unit.unitLayout.replaceAll("_", " ")}</Badge>
            <Badge variant="ghost">{unit.furnishing.replaceAll("_", " ")}</Badge>
            <StatusBadge status={unit.occupancy} />
          </div>
        </div>
        <p className="mt-3 tabular font-display text-2xl font-extrabold text-ink">
          PKR {Number(unit.monthlyRent).toLocaleString()}
          <span className="font-body text-sm font-normal text-ink-soft"> / month</span>
        </p>
        {unit.owner && <p className="mt-1 font-body text-xs text-ink-soft">Owner: {unit.owner.name}</p>}
        {unit.plaza && !unit.owner && unit.plaza.managerId === user?.id && (
          <LinkOwnerForm unitId={unit.id} onLinked={reload} />
        )}
      </div>

      {error && <p className="font-body text-sm text-ember">{error}</p>}

      {activeLease ? (
        <>
          <div className="surface-flat p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-body text-xs font-bold uppercase tracking-wide text-ink-soft">Current tenant</p>
                <p className="font-display text-lg font-bold text-ink">{activeLease.tenant.name}</p>
                <p className="font-body text-sm text-ink-soft">{activeLease.tenant.phone}</p>
              </div>
              <div className="text-right">
                <p className="font-body text-xs text-ink-soft">
                  {new Date(activeLease.startDate).toLocaleDateString()} – {new Date(activeLease.endDate).toLocaleDateString()}
                </p>
                <p className="tabular font-body text-sm font-semibold text-ink">
                  Rent: PKR {Number(activeLease.rentAmount).toLocaleString()}
                </p>
                {activeLease.depositAmount && (
                  <p className="tabular font-body text-xs text-ink-soft">
                    Deposit: PKR {Number(activeLease.depositAmount).toLocaleString()}
                  </p>
                )}
                {activeLease.agreementUrl && (
                  <a href={activeLease.agreementUrl} target="_blank" rel="noreferrer" className="font-body text-xs font-semibold text-teal">
                    Lease agreement ↗
                  </a>
                )}
              </div>
            </div>
            {isController && (
              <Button
                variant="ghost"
                className="mt-4"
                disabled={busy}
                onClick={() => run(() => apiFetch(`/leases/${activeLease.id}/end`, { method: "PATCH", token: accessToken }))}
              >
                End lease
              </Button>
            )}
          </div>

          <section>
            <h3 className="mb-3 font-display text-base font-bold text-ink">Rent payments</h3>
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
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    {isController && p.status === "SUBMITTED" && (
                      <>
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              apiFetch(`/rent-payments/${p.id}/review`, {
                                method: "PATCH",
                                token: accessToken,
                                body: { status: "APPROVED" },
                              }),
                            )
                          }
                          className="rounded-sm bg-teal-soft px-2.5 py-1 font-body text-xs font-bold text-teal disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              apiFetch(`/rent-payments/${p.id}/review`, {
                                method: "PATCH",
                                token: accessToken,
                                body: { status: "REJECTED" },
                              }),
                            )
                          }
                          className="rounded-sm bg-ember px-2.5 py-1 font-body text-xs font-bold text-ember-ink disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {user?.role === "TENANT" && <RentPaymentForm leaseId={activeLease.id} onSubmitted={reload} />}
          </section>

          <section>
            <h3 className="mb-3 font-display text-base font-bold text-ink">Utility bills</h3>
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
                  <div className="flex items-center gap-2">
                    <StatusBadge status={b.status} />
                    {isController && b.status !== "PAID" && (
                      <button
                        disabled={busy}
                        onClick={() => run(() => apiFetch(`/utility-bills/${b.id}/settle`, { method: "PATCH", token: accessToken }))}
                        className="rounded-sm bg-teal-soft px-2.5 py-1 font-body text-xs font-bold text-teal disabled:opacity-50"
                      >
                        Mark paid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {user?.role === "TENANT" && <UtilityBillForm leaseId={activeLease.id} onSubmitted={reload} />}
          </section>

          <section>
            <h3 className="mb-3 font-display text-base font-bold text-ink">Maintenance</h3>
            <div className="surface-flat divide-y divide-flat-border">
              {maintenance.length === 0 && <p className="p-4 font-body text-sm text-ink-faint">No maintenance requests.</p>}
              {maintenance.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-body text-sm font-semibold text-ink">{m.title}</p>
                    {m.description && <p className="font-body text-xs text-ink-soft">{m.description}</p>}
                    <p className="font-body text-xs text-ink-faint">
                      Raised by {m.raisedBy.name} ({m.raisedBy.role})
                      {m.cost ? ` · Cost: PKR ${Number(m.cost).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={m.status} />
                    {isController && m.status !== "RESOLVED" && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          run(() =>
                            apiFetch(`/maintenance/${m.id}`, {
                              method: "PATCH",
                              token: accessToken,
                              body: { status: m.status === "OPEN" ? "IN_PROGRESS" : "RESOLVED" },
                            }),
                          )
                        }
                        className="rounded-sm bg-flat px-2.5 py-1 font-body text-xs font-bold text-ink-soft disabled:opacity-50"
                      >
                        {m.status === "OPEN" ? "Start work" : "Mark resolved"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <MaintenanceForm leaseId={activeLease.id} onSubmitted={reload} />
          </section>

          <section>
            <h3 className="mb-3 font-display text-base font-bold text-ink">Chat</h3>
            <LeaseChatPanel leaseId={activeLease.id} />
          </section>
        </>
      ) : (
        isController && <CreateLeaseForm unitId={unit.id} onCreated={reload} />
      )}
    </div>
  );
}

function LinkOwnerForm({ unitId, onLinked }: { unitId: string; onLinked: () => void }) {
  const { accessToken } = useAuth();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/rental-units/${unitId}/link-owner`, {
        method: "PATCH",
        token: accessToken,
        body: { ownerPhone: phone },
      });
      onLinked();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-2 border-t border-flat-border pt-3">
      <TextField
        label="Link real owner (phone)"
        name="ownerPhone"
        placeholder="+923001234567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />
      <Button variant="secondary" type="submit" disabled={busy}>
        {busy ? "Linking…" : "Link owner"}
      </Button>
      {error && <p className="font-body text-sm text-ember">{error}</p>}
    </form>
  );
}

function CreateLeaseForm({ unitId, onCreated }: { unitId: string; onCreated: () => void }) {
  const { accessToken } = useAuth();
  const [tenantPhone, setTenantPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [agreementUrl, setAgreementUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/rental-units/${unitId}/lease`, {
        method: "POST",
        token: accessToken,
        body: {
          tenantPhone,
          startDate,
          endDate,
          rentAmount: Number(rentAmount),
          ...(depositAmount ? { depositAmount: Number(depositAmount) } : {}),
          ...(agreementUrl ? { agreementUrl } : {}),
        },
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface-flat p-5">
      <h3 className="mb-3 font-display text-base font-bold text-ink">Vacant — move a tenant in</h3>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField
          label="Tenant phone (must already have a Tenant account)"
          name="tenantPhone"
          placeholder="+923001234567"
          value={tenantPhone}
          onChange={(e) => setTenantPhone(e.target.value)}
          required
        />
        <TextField label="Monthly rent (PKR)" name="rentAmount" type="number" min={0} value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} required />
        <TextField label="Lease start" name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        <TextField label="Lease end" name="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        <TextField label="Deposit (optional)" name="depositAmount" type="number" min={0} value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
        <TextField
          label="Lease agreement URL (optional)"
          name="agreementUrl"
          value={agreementUrl}
          onChange={(e) => setAgreementUrl(e.target.value)}
        />
        {error && <p className="font-body text-sm text-ember sm:col-span-2">{error}</p>}
        <Button variant="primary" type="submit" disabled={busy} className="sm:col-span-2 justify-center">
          {busy ? "Creating lease…" : "Start lease"}
        </Button>
      </form>
    </div>
  );
}

function RentPaymentForm({ leaseId, onSubmitted }: { leaseId: string; onSubmitted: () => void }) {
  const { accessToken } = useAuth();
  const [monthRaw, setMonthRaw] = useState("");
  const [amount, setAmount] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/leases/${leaseId}/rent-payments`, {
        method: "POST",
        token: accessToken,
        body: { forMonth: `${monthRaw}-01`, amount: Number(amount), ...(proofUrl ? { proofUrl } : {}) },
      });
      setMonthRaw("");
      setAmount("");
      setProofUrl("");
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-2">
      <TextField label="Month" name="forMonth" type="month" value={monthRaw} onChange={(e) => setMonthRaw(e.target.value)} required />
      <TextField label="Amount (PKR)" name="amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <TextField label="Proof URL (optional)" name="proofUrl" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} />
      <Button variant="secondary" type="submit" disabled={busy}>
        {busy ? "Submitting…" : "Submit payment"}
      </Button>
      {error && <p className="font-body text-sm text-ember">{error}</p>}
    </form>
  );
}

function UtilityBillForm({ leaseId, onSubmitted }: { leaseId: string; onSubmitted: () => void }) {
  const { accessToken } = useAuth();
  const [type, setType] = useState("ELECTRICITY");
  const [monthRaw, setMonthRaw] = useState("");
  const [amount, setAmount] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/leases/${leaseId}/utility-bills`, {
        method: "POST",
        token: accessToken,
        body: { type, billMonth: `${monthRaw}-01`, amount: Number(amount), ...(documentUrl ? { documentUrl } : {}) },
      });
      setMonthRaw("");
      setAmount("");
      setDocumentUrl("");
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-2">
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
      <Button variant="secondary" type="submit" disabled={busy}>
        {busy ? "Uploading…" : "Upload bill"}
      </Button>
      {error && <p className="font-body text-sm text-ember">{error}</p>}
    </form>
  );
}

function MaintenanceForm({ leaseId, onSubmitted }: { leaseId: string; onSubmitted: () => void }) {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/leases/${leaseId}/maintenance`, {
        method: "POST",
        token: accessToken,
        body: { title, ...(description ? { description } : {}) },
      });
      setTitle("");
      setDescription("");
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-2">
      <TextField label="Issue" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <TextField label="Details (optional)" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <Button variant="secondary" type="submit" disabled={busy}>
        {busy ? "Raising…" : "Raise request"}
      </Button>
      {error && <p className="font-body text-sm text-ember">{error}</p>}
    </form>
  );
}
