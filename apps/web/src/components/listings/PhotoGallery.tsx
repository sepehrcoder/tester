"use client";

import { useState } from "react";

interface Photo {
  id: string;
  url: string;
}

export function PhotoGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());

  const usable = photos.filter((p) => !failed.has(p.id));
  const current = usable[Math.min(active, usable.length - 1)];

  function markFailed(id: string) {
    setFailed((prev) => new Set(prev).add(id));
  }

  if (usable.length === 0) {
    return (
      <div className="mb-4 flex h-96 w-full items-center justify-center rounded-md bg-linear-to-br from-violet to-cyan">
        <span className="font-body text-xs text-white/70">No photos yet</span>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="h-96 w-full overflow-hidden rounded-md bg-flat">
        {/* eslint-disable-next-line @next/next/no-img-element -- external hotlinked stock photos, not a local/optimizable asset */}
        <img
          key={current.id}
          src={current.url}
          alt={title}
          className="h-full w-full object-cover"
          onError={() => markFailed(current.id)}
        />
      </div>
      {usable.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {usable.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActive(i)}
              className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-sm ${
                i === active ? "ring-2 ring-ember" : "opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail of the same external photo set */}
              <img
                src={p.url}
                alt=""
                className="h-full w-full object-cover"
                onError={() => markFailed(p.id)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
