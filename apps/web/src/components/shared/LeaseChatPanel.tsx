"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { IconSend } from "@repo/icons/web";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface Message {
  id: string;
  body: string;
  senderId: string;
  sender: { id: string; name: string; role: string };
  createdAt: string;
}

const POLL_MS = 4000;

export function LeaseChatPanel({ leaseId }: { leaseId: string }) {
  const { user, accessToken } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    async function open() {
      setError(null);
      try {
        const conversation = await apiFetch<{ id: string }>(`/leases/${leaseId}/chat`, {
          method: "POST",
          token: accessToken,
        });
        if (cancelled) return;
        setConversationId(conversation.id);

        // Merge by id rather than replace wholesale — a poll response that
        // was already in flight when the user sent a message would
        // otherwise overwrite the optimistic append with a list that
        // predates it, making the just-sent message flicker out until the
        // next cycle.
        const load = () =>
          apiFetch<Message[]>(`/chat/conversations/${conversation.id}/messages`, { token: accessToken })
            .then((msgs) => {
              if (cancelled) return;
              setMessages((prev) => {
                const byId = new Map(msgs.map((m) => [m.id, m]));
                for (const m of prev) if (!byId.has(m.id)) byId.set(m.id, m);
                return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
              });
            })
            .catch(() => {});
        load();
        interval = setInterval(load, POLL_MS);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Couldn't open chat");
      }
    }
    open();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [leaseId, accessToken, retryNonce]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !conversationId) return;
    const body = draft;
    setDraft("");
    try {
      const message = await apiFetch<Message>(`/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        token: accessToken,
        body: { body },
      });
      setMessages((prev) => [...prev, message]);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Message failed to send");
    }
  }

  return (
    <div className="surface-flat flex h-96 flex-col p-4">
      {error && (
        <div className="mb-2 flex items-center gap-2">
          <p className="font-body text-xs text-ember">{error}</p>
          <button
            onClick={() => setRetryNonce((n) => n + 1)}
            className="font-body text-xs font-semibold text-teal"
          >
            Retry
          </button>
        </div>
      )}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 && <p className="font-body text-sm text-ink-faint">No messages yet — say hello.</p>}
        {messages.map((m) => {
          const mine = m.senderId === user?.id;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[80%] rounded-sm px-3 py-2 font-body text-sm ${
                  mine ? "bg-ember text-ember-ink" : "bg-flat text-ink"
                }`}
              >
                {m.body}
              </div>
              <span className="mt-0.5 font-body text-[10px] text-ink-faint">
                {mine ? "You" : m.sender.name} · {new Date(m.createdAt).toLocaleTimeString()}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          disabled={!conversationId}
          className="flex-1 rounded-sm border border-flat-border bg-canvas px-3 py-2 font-body text-sm text-ink outline-none placeholder:text-ink-faint focus:border-ember"
        />
        <button
          type="submit"
          disabled={!conversationId || !draft.trim()}
          aria-label="Send"
          className="flex items-center justify-center rounded-sm bg-ember px-3 text-ember-ink disabled:opacity-50"
        >
          <IconSend size={17} />
        </button>
      </form>
    </div>
  );
}
