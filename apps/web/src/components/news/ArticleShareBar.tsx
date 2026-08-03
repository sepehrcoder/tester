"use client";

import { useState } from "react";

// Share buttons per §11's function inventory for the article single page —
// WhatsApp/Facebook/X/copy-link.
export function ArticleShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing more we can do
    }
  }

  return (
    <div className="mt-3 flex items-center gap-3 font-body text-xs font-semibold text-ink-faint">
      <span>Share:</span>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
        target="_blank"
        rel="noreferrer"
        className="hover:text-ink"
      >
        WhatsApp
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        className="hover:text-ink"
      >
        Facebook
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        className="hover:text-ink"
      >
        X
      </a>
      <button type="button" onClick={copyLink} className="hover:text-ink">
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
