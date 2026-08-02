"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconBell } from "@repo/icons/web";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

const POLL_MS = 30000;

export function NotificationBell() {
  const { accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    apiFetch<Notification[]>("/notifications", { token: accessToken })
      .then(setNotifications)
      .catch((err) => setError(err instanceof ApiError ? err.message : null));
  }, [accessToken]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH", token: accessToken });
    } catch {
      // best-effort — next poll reconciles state either way
    }
  }

  async function markAllRead() {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH", token: accessToken });
    } catch {
      // best-effort
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative text-ink-soft hover:text-ink"
      >
        <IconBell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 font-body text-[10px] font-bold text-ember-ink">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="surface-glass-strong absolute right-0 top-full z-20 mt-2 w-80 max-h-96 overflow-y-auto rounded-sm p-2">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="font-body text-xs font-bold uppercase tracking-wide text-ink-soft">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="font-body text-xs font-semibold text-teal">
                Mark all read
              </button>
            )}
          </div>
          {error && <p className="px-2 py-2 font-body text-xs text-ember">{error}</p>}
          {!error && notifications.length === 0 && (
            <p className="px-2 py-4 font-body text-sm text-ink-faint">Nothing yet.</p>
          )}
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`block w-full rounded-sm px-2 py-2 text-left transition-colors hover:bg-flat ${
                n.readAt ? "" : "bg-flat"
              }`}
            >
              <p className="font-body text-sm font-semibold text-ink">{n.title}</p>
              <p className="font-body text-xs text-ink-soft">{n.body}</p>
              <p className="mt-0.5 font-body text-[10px] text-ink-faint">{new Date(n.createdAt).toLocaleString()}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
