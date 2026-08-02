"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

const selectClass =
  "rounded-sm border border-flat-border bg-flat px-4 py-3 font-body text-sm text-ink outline-none focus:border-ember";

export default function NewRentalPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [unitLayout, setUnitLayout] = useState("TWO_BED");
  const [furnishing, setFurnishing] = useState("UNFURNISHED");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const unit = await apiFetch<{ id: string }>("/rental-units", {
        method: "POST",
        token: accessToken,
        body: { title, city, area: area || undefined, unitLayout, furnishing, monthlyRent: Number(monthlyRent) },
      });
      router.push(`/dashboard/rentals/${unit.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader title="List a rental property" subtitle="Add a property you own and manage yourself." />
      <form onSubmit={onSubmit} className="surface-flat grid max-w-xl grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <TextField label="Title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="sm:col-span-2" />
        <TextField label="City" name="city" value={city} onChange={(e) => setCity(e.target.value)} required />
        <TextField label="Area (optional)" name="area" value={area} onChange={(e) => setArea(e.target.value)} />
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
        {error && <p className="font-body text-sm text-ember sm:col-span-2">{error}</p>}
        <Button variant="primary" type="submit" disabled={submitting} className="justify-center sm:col-span-2">
          {submitting ? "Adding…" : "Add property"}
        </Button>
      </form>
    </div>
  );
}
