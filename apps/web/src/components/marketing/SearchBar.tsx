"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconFilter, IconSearch, IconSparkles, IconVerified } from "@repo/icons/web";
import { Badge } from "@/components/ui/Badge";
import { apiFetch, ApiError } from "@/lib/api";
import { formatPKR } from "@/lib/price";
import { useAuth } from "@/providers/AuthProvider";

const FILTERS: { label: string; params: Record<string, string> }[] = [
  { label: "For sale", params: { purpose: "SALE" } },
  { label: "For rent", params: { purpose: "RENT" } },
  { label: "Houses", params: { propertyType: "HOUSE" } },
  { label: "Plots", params: { propertyType: "PLOT" } },
  { label: "Apartments", params: { propertyType: "APARTMENT" } },
  { label: "Verified only", params: { verifiedOnly: "true" } },
];

const AI_EXAMPLES = [
  "3 bed houses for rent in Lahore under 80,000",
  "5 Marla plots in Bahria Town",
  "Verified dealers in Karachi",
];

interface AiListingResult {
  id: string;
  title: string;
  city: string;
  area?: string | null;
  price: string;
  verified: boolean;
}

export function MarketingSearchBar() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [mode, setMode] = useState<"filter" | "ai">("filter");
  const [query, setQuery] = useState("");

  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<AiListingResult[]>([]);

  function submitFilter(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("city", query.trim());
    router.push(`/listings${params.toString() ? `?${params.toString()}` : ""}`);
  }

  async function submitAi(e: FormEvent, textOverride?: string) {
    e.preventDefault();
    const message = (textOverride ?? aiQuery).trim();
    if (!message || aiLoading) return;
    setAiQuery(message);
    setAiLoading(true);
    setAiError(null);
    setAiReply(null);
    setAiResults([]);
    try {
      const result = await apiFetch<{ reply: string; listings?: AiListingResult[] }>("/ai/chat", {
        method: "POST",
        token: accessToken,
        body: { message, history: [] },
      });
      setAiReply(result.reply);
      setAiResults(result.listings ?? []);
    } catch (err) {
      setAiError(err instanceof ApiError ? err.message : "Couldn't reach the assistant — try again.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <>
      <div className="surface-glass mb-3 inline-flex w-fit gap-1 rounded-sm p-1">
        <button
          type="button"
          onClick={() => setMode("filter")}
          className={`rounded-sm px-3 py-1.5 font-body text-xs font-bold ${
            mode === "filter" ? "bg-ember text-ember-ink" : "text-ink-soft"
          }`}
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setMode("ai")}
          className={`flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-body text-xs font-bold ${
            mode === "ai" ? "bg-ember text-ember-ink" : "text-ink-soft"
          }`}
        >
          <IconSparkles size={13} />
          Ask AI
        </button>
      </div>

      {mode === "filter" ? (
        <form onSubmit={submitFilter} className="surface-glass mb-8 flex flex-wrap items-center gap-3 p-4">
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
      ) : (
        <div className="mb-8">
          <form onSubmit={submitAi} className="surface-glass mb-3 flex flex-wrap items-center gap-3 p-4">
            <div className="flex flex-1 items-center gap-2 rounded-sm border border-flat-border bg-flat px-3 py-2 text-ink-soft">
              <IconSparkles size={16} className="text-ember" />
              <input
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="w-full bg-transparent font-body text-sm text-ink outline-none placeholder:text-ink-faint"
                placeholder={`Ask e.g. "${AI_EXAMPLES[0]}"`}
              />
            </div>
            <button
              type="submit"
              disabled={aiLoading || !aiQuery.trim()}
              className="flex items-center gap-1.5 font-body text-sm font-semibold text-ink-soft hover:text-ink disabled:opacity-50"
            >
              {aiLoading ? "Asking…" : "Ask"}
            </button>
          </form>

          {!aiReply && !aiLoading && (
            <div className="mb-2 flex flex-wrap gap-2">
              {AI_EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={(e) => submitAi(e, ex)}>
                  <Badge variant="ghost">{ex}</Badge>
                </button>
              ))}
            </div>
          )}

          {aiError && <p className="font-body text-xs text-ember">{aiError}</p>}

          {aiReply && (
            <div className="surface-flat p-4">
              <p className="font-body text-sm text-ink-soft">{aiReply}</p>
              {aiResults.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {aiResults.map((l) => (
                    <Link
                      key={l.id}
                      href={`/listings/${l.id}`}
                      className="rounded-sm border border-flat-border bg-canvas p-2.5 hover:border-ember"
                    >
                      <p className="font-body text-xs font-bold text-ink">{l.title}</p>
                      <p className="font-body text-[11px] text-ink-soft">
                        {l.area ? `${l.area}, ` : ""}
                        {l.city}
                      </p>
                      <p className="mt-0.5 font-body text-xs font-semibold text-teal">
                        {formatPKR(l.price)}
                        {l.verified ? " · Verified" : ""}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {mode === "filter" && (
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
      )}
    </>
  );
}
