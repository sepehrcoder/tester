"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { IconChat, IconSend, IconSparkles } from "@repo/icons/web";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface ConversationSummary {
  id: string;
  createdAt: string;
  participants: { user: { id: string; name: string; role: string } }[];
  messages: { id: string; body: string; createdAt: string; aiGenerated: boolean }[];
  lead: { requirement: { propertyType: string; purpose: string; city: string } } | null;
  listing: { id: string; title: string } | null;
  lease: { unit: { id: string; title: string } } | null;
}

interface Message {
  id: string;
  body: string;
  senderId: string;
  aiGenerated: boolean;
  sender: { id: string; name: string; role: string };
  createdAt: string;
}

const LIST_POLL_MS = 8000;
const THREAD_POLL_MS = 4000;

function conversationTitle(c: ConversationSummary, myId: string | undefined) {
  const other = c.participants.find((p) => p.user.id !== myId)?.user;
  return other?.name ?? "Conversation";
}

function conversationContext(c: ConversationSummary) {
  if (c.listing) return c.listing.title;
  if (c.lease) return c.lease.unit.title;
  if (c.lead) {
    const r = c.lead.requirement;
    return `${r.propertyType} · ${r.purpose} · ${r.city}`;
  }
  return "Direct message";
}

export function ConversationInbox() {
  const { user, accessToken } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [listError, setListError] = useState<string | null>(null);
  const [threadError, setThreadError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      apiFetch<ConversationSummary[]>("/chat/conversations", { token: accessToken })
        .then((data) => {
          if (cancelled) return;
          setConversations(data);
          setListError(null);
          setSelectedId((prev) => prev ?? data[0]?.id ?? null);
        })
        .catch((err) => {
          if (!cancelled) setListError(err instanceof ApiError ? err.message : "Couldn't load conversations");
        });
    load();
    const interval = setInterval(load, LIST_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [accessToken]);

  useEffect(() => {
    if (!selectedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      return;
    }
    let cancelled = false;
    setThreadError(null);
    const load = () =>
      apiFetch<Message[]>(`/chat/conversations/${selectedId}/messages`, { token: accessToken })
        .then((msgs) => {
          if (cancelled) return;
          setMessages((prev) => {
            const byId = new Map(msgs.map((m) => [m.id, m]));
            for (const m of prev) if (!byId.has(m.id)) byId.set(m.id, m);
            return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          });
        })
        .catch((err) => {
          if (!cancelled) setThreadError(err instanceof ApiError ? err.message : "Couldn't load messages");
        });
    setMessages([]);
    load();
    const interval = setInterval(load, THREAD_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedId, accessToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !selectedId) return;
    const body = draft;
    setDraft("");
    try {
      const message = await apiFetch<Message>(`/chat/conversations/${selectedId}/messages`, {
        method: "POST",
        token: accessToken,
        body: { body },
      });
      setMessages((prev) => [...prev, message]);
      setThreadError(null);
    } catch (err) {
      setThreadError(err instanceof ApiError ? err.message : "Message failed to send");
    }
  }

  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <div className="surface-flat flex h-[calc(100vh-8rem)] overflow-hidden">
      <div className="flex w-72 flex-shrink-0 flex-col border-r border-flat-border">
        <div className="border-b border-flat-border px-4 py-3">
          <p className="font-display text-sm font-bold text-ink">Messages</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {listError && <p className="p-4 font-body text-xs text-ember">{listError}</p>}
          {conversations.length === 0 && !listError && (
            <p className="p-4 font-body text-xs text-ink-faint">No conversations yet.</p>
          )}
          {conversations.map((c) => {
            const last = c.messages[0];
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`flex w-full flex-col gap-0.5 border-b border-flat-border px-4 py-3 text-left ${
                  c.id === selectedId ? "bg-flat" : "hover:bg-flat/60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-body text-sm font-semibold text-ink">{conversationTitle(c, user?.id)}</p>
                  {last && (
                    <span className="shrink-0 font-body text-[10px] text-ink-faint">
                      {new Date(last.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="font-body text-[11px] text-ink-faint">{conversationContext(c)}</p>
                {last && (
                  <p className="truncate font-body text-xs text-ink-soft">
                    {last.aiGenerated ? "🤖 " : ""}
                    {last.body}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <IconChat size={28} className="text-ink-faint" />
            <p className="font-body text-sm text-ink-faint">Select a conversation to view messages.</p>
          </div>
        ) : (
          <>
            <div className="border-b border-flat-border px-4 py-3">
              <p className="font-body text-sm font-bold text-ink">{conversationTitle(selected, user?.id)}</p>
              <p className="font-body text-xs text-ink-faint">{conversationContext(selected)}</p>
            </div>

            {threadError && (
              <p className="px-4 pt-2 font-body text-xs text-ember">{threadError}</p>
            )}

            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {messages.length === 0 && <p className="font-body text-sm text-ink-faint">No messages yet — say hello.</p>}
              {messages.map((m) => {
                const mine = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                    {m.aiGenerated && (
                      <span className="mb-0.5 flex items-center gap-1 font-body text-[10px] font-bold uppercase tracking-wide text-teal">
                        <IconSparkles size={11} /> AI Assistant
                      </span>
                    )}
                    <div
                      className={`max-w-[75%] rounded-sm px-3 py-2 font-body text-sm ${
                        mine
                          ? m.aiGenerated
                            ? "bg-teal-soft text-teal"
                            : "bg-ember text-ember-ink"
                          : "bg-flat text-ink"
                      }`}
                    >
                      {m.body}
                    </div>
                    <span className="mt-0.5 font-body text-[10px] text-ink-faint">
                      {mine ? (m.aiGenerated ? "AI, on your behalf" : "You") : m.sender.name} ·{" "}
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={send} className="flex items-center gap-2 border-t border-flat-border px-4 py-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 rounded-sm border border-flat-border bg-canvas px-3 py-2 font-body text-sm text-ink outline-none placeholder:text-ink-faint focus:border-ember"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-ember text-ember-ink disabled:opacity-50"
              >
                <IconSend size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
