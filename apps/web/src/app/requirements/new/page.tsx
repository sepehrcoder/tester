"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AppNav } from "@/components/marketing/AppNav";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

const PROPERTY_TYPES = ["HOUSE", "APARTMENT", "PLOT", "COMMERCIAL"];
const PURPOSES = ["SALE", "RENT"];

export default function PostRequirementPage() {
  const { user, accessToken, loading: authLoading } = useAuth();

  const [propertyType, setPropertyType] = useState("HOUSE");
  const [purpose, setPurpose] = useState("SALE");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [beds, setBeds] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!city.trim()) {
      setError("City is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/requirements", {
        method: "POST",
        token: accessToken,
        body: {
          propertyType,
          purpose,
          city: city.trim(),
          area: area.trim() || undefined,
          budgetMin: budgetMin ? Number(budgetMin) : undefined,
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
          beds: beds ? Number(beds) : undefined,
          notes: notes.trim() || undefined,
        },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't post your requirement");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="aurora-backdrop" />
      <div className="flex min-h-full flex-col">
        <div className="px-4 pt-4">
          <AppNav />
        </div>

        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
          <h1 className="mb-2 font-display text-2xl font-extrabold text-ink">Post a requirement</h1>
          <p className="mb-6 font-body text-sm text-ink-soft">
            Every dealer covering this city and property type gets notified — first to respond and follow
            through gets the client.
          </p>

          {authLoading ? null : !user ? (
            <div className="surface-glass p-6 text-center">
              <p className="font-body text-sm text-ink-soft">Sign in as a buyer/owner account to post a requirement.</p>
              <div className="mt-4 flex justify-center gap-3">
                <Link href="/login">
                  <Button variant="primary">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary">Register</Button>
                </Link>
              </div>
            </div>
          ) : user.role !== "CUSTOMER" ? (
            <div className="surface-glass p-6 text-center">
              <p className="font-body text-sm text-ink-soft">
                Signed in as {user.name} — only buyer/owner accounts can post requirements.
              </p>
            </div>
          ) : done ? (
            <div className="surface-glass p-6 text-center">
              <p className="font-body text-sm text-ink">Your requirement is live — matched dealers have been notified.</p>
              <Link href="/dashboard/requirements" className="mt-4 inline-block font-body text-sm font-semibold text-teal">
                View my requirements →
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="surface-glass space-y-4 p-6">
              <div>
                <label className="mb-1 block font-body text-xs font-semibold text-ink-soft">Property type</label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setPropertyType(pt)}
                      className={`rounded-pill px-3 py-1.5 font-body text-xs font-bold ${
                        propertyType === pt ? "bg-ember text-ember-ink" : "bg-flat text-ink-soft"
                      }`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block font-body text-xs font-semibold text-ink-soft">Purpose</label>
                <div className="flex gap-2">
                  {PURPOSES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPurpose(p)}
                      className={`rounded-pill px-3 py-1.5 font-body text-xs font-bold ${
                        purpose === p ? "bg-ember text-ember-ink" : "bg-flat text-ink-soft"
                      }`}
                    >
                      {p === "SALE" ? "Buy" : "Rent"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-body text-xs font-semibold text-ink-soft">City *</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-body text-xs font-semibold text-ink-soft">Area</label>
                  <input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block font-body text-xs font-semibold text-ink-soft">Min budget</label>
                  <input
                    type="number"
                    min={0}
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="w-full rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-body text-xs font-semibold text-ink-soft">Max budget</label>
                  <input
                    type="number"
                    min={0}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="w-full rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-body text-xs font-semibold text-ink-soft">Beds</label>
                  <input
                    type="number"
                    min={0}
                    value={beds}
                    onChange={(e) => setBeds(e.target.value)}
                    className="w-full rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-body text-xs font-semibold text-ink-soft">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-sm border border-flat-border bg-flat px-3 py-2 font-body text-sm text-ink outline-none"
                />
              </div>

              {error && <p className="font-body text-xs text-ember">{error}</p>}

              <Button type="submit" variant="primary" disabled={submitting} className="w-full justify-center">
                {submitting ? "Posting…" : "Post requirement"}
              </Button>
            </form>
          )}
        </main>
      </div>
    </>
  );
}
