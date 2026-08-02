"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconFilter, IconSearch, IconVerified } from "@repo/icons/web";
import { Badge } from "@/components/ui/Badge";

const FILTERS: { label: string; params: Record<string, string> }[] = [
  { label: "For sale", params: { purpose: "SALE" } },
  { label: "For rent", params: { purpose: "RENT" } },
  { label: "Houses", params: { propertyType: "HOUSE" } },
  { label: "Plots", params: { propertyType: "PLOT" } },
  { label: "Apartments", params: { propertyType: "APARTMENT" } },
  { label: "Verified only", params: { verifiedOnly: "true" } },
];

export function MarketingSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("city", query.trim());
    router.push(`/listings${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <>
      <form onSubmit={submit} className="surface-glass mb-8 flex flex-wrap items-center gap-3 p-4">
        <div className="flex flex-1 items-center gap-2 rounded-sm border border-flat-border bg-flat px-3 py-2 text-ink-soft">
          <IconSearch size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent font-body text-sm text-ink outline-none placeholder:text-ink-faint"
            placeholder="Search city, area, or project"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-1.5 font-body text-sm font-semibold text-ink-soft hover:text-ink"
        >
          <IconFilter size={16} />
          Search
        </button>
      </form>

      <section className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => router.push(`/listings?${new URLSearchParams(f.params).toString()}`)}
          >
            <Badge variant={f.label === "Verified only" ? "teal" : "ghost"}>
              {f.label === "Verified only" && <IconVerified size={11} className="mr-1 inline" />}
              {f.label}
            </Badge>
          </button>
        ))}
      </section>
    </>
  );
}
