"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { IconClose, IconMic, IconMicOff, IconSend, IconSparkles, IconVolume, IconVolumeOff } from "@repo/icons/web";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface ListingResult {
  id: string;
  title: string;
  city: string;
  area?: string | null;
  price: string;
  purpose: string;
  propertyType: string;
  beds?: number | null;
  verified: boolean;
}

interface DealerResult {
  id: string;
  name: string;
  agencyName?: string | null;
  coverageCities: string[];
  ratingAvg: number;
  ratingCount: number;
}

interface ChatTurn {
  role: "user" | "model";
  text: string;
  listings?: ListingResult[];
  dealers?: DealerResult[];
}

interface SpeechRecognitionResultLike {
  results: { 0: { transcript: string }; isFinal: boolean }[];
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognitionLike)
    | null;
}

function formatPrice(price: string) {
  const n = Number(price);
  if (!Number.isFinite(n)) return price;
  return `PKR ${n.toLocaleString()}`;
}

export function AiAssistantWidget() {
  const { accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Feature detection depends on `window`, which isn't available during
    // SSR — this must run client-side only, in an effect, to avoid a
    // hydration mismatch between server and client output.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSpeechSupported(!!getSpeechRecognition());
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [turns.length, open]);

  function speak(text: string) {
    if (!speakReplies || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  async function sendMessage(message: string) {
    if (!message.trim() || sending) return;
    setError(null);
    setDraft("");
    const history = turns.map((t) => ({ role: t.role, text: t.text }));
    setTurns((prev) => [...prev, { role: "user", text: message }]);
    setSending(true);
    try {
      const result = await apiFetch<{
        reply: string;
        listings?: ListingResult[];
        dealers?: DealerResult[];
      }>("/ai/chat", {
        method: "POST",
        token: accessToken,
        body: { message, history },
      });
      setTurns((prev) => [
        ...prev,
        { role: "model", text: result.reply, listings: result.listings, dealers: result.dealers },
      ]);
      speak(result.reply);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The assistant didn't respond — try again.");
    } finally {
      setSending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(draft);
  }

  function toggleListening() {
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) sendMessage(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="surface-glass-strong flex h-[32rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-sm">
          <div className="flex items-center justify-between border-b border-flat-border px-4 py-3">
            <div className="flex items-center gap-2">
              <IconSparkles size={18} className="text-ember" />
              <p className="font-display text-sm font-bold text-ink">Manzil AI</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSpeakReplies((v) => !v)}
                aria-label={speakReplies ? "Mute voice replies" : "Speak replies aloud"}
                aria-pressed={speakReplies}
                className={`flex h-7 w-7 items-center justify-center rounded-sm ${speakReplies ? "text-teal" : "text-ink-faint"}`}
              >
                {speakReplies ? <IconVolume size={16} /> : <IconVolumeOff size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="flex h-7 w-7 items-center justify-center rounded-sm text-ink-faint hover:text-ink"
              >
                <IconClose size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {turns.length === 0 && (
              <p className="font-body text-sm text-ink-faint">
                Ask me to find a property, compare dealers, or check market prices — try &ldquo;3 bed houses for
                rent in Lahore under 80,000&rdquo;.
              </p>
            )}
            {turns.map((t, i) => (
              <div key={i} className={`flex flex-col ${t.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] rounded-sm px-3 py-2 font-body text-sm ${
                    t.role === "user" ? "bg-ember text-ember-ink" : "bg-flat text-ink"
                  }`}
                >
                  {t.text}
                </div>
                {t.listings && t.listings.length > 0 && (
                  <div className="mt-2 w-full space-y-2">
                    {t.listings.map((l) => (
                      <div key={l.id} className="rounded-sm border border-flat-border bg-canvas p-2.5">
                        <p className="font-body text-xs font-bold text-ink">{l.title}</p>
                        <p className="font-body text-[11px] text-ink-soft">
                          {l.area ? `${l.area}, ` : ""}
                          {l.city} · {l.propertyType} · {l.purpose}
                          {l.beds ? ` · ${l.beds} bed` : ""}
                        </p>
                        <p className="mt-0.5 font-body text-xs font-semibold text-teal">
                          {formatPrice(l.price)}
                          {l.verified ? " · Verified" : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {t.dealers && t.dealers.length > 0 && (
                  <div className="mt-2 w-full space-y-2">
                    {t.dealers.map((d) => (
                      <div key={d.id} className="rounded-sm border border-flat-border bg-canvas p-2.5">
                        <p className="font-body text-xs font-bold text-ink">
                          {d.name}
                          {d.agencyName ? ` · ${d.agencyName}` : ""}
                        </p>
                        <p className="font-body text-[11px] text-ink-soft">{d.coverageCities.join(", ")}</p>
                        <p className="mt-0.5 font-body text-xs font-semibold text-teal">
                          {d.ratingAvg.toFixed(1)} ★ ({d.ratingCount})
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {sending && <p className="font-body text-xs text-ink-faint">Thinking…</p>}
            {error && <p className="font-body text-xs text-ember">{error}</p>}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-flat-border px-3 py-3">
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                aria-label={listening ? "Stop voice input" : "Speak your question"}
                aria-pressed={listening}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${
                  listening ? "bg-ember text-ember-ink" : "bg-flat text-ink-soft"
                }`}
              >
                {listening ? <IconMicOff size={16} /> : <IconMic size={16} />}
              </button>
            )}
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={listening ? "Listening…" : "Ask about a property…"}
              disabled={sending}
              className="flex-1 rounded-sm border border-flat-border bg-canvas px-3 py-2 font-body text-sm text-ink outline-none placeholder:text-ink-faint focus:border-ember"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-ember text-ember-ink disabled:opacity-50"
            >
              <IconSend size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="shadow-ember-glow flex h-14 w-14 items-center justify-center rounded-pill bg-ember text-ember-ink"
      >
        {open ? <IconClose size={22} /> : <IconSparkles size={22} />}
      </button>
    </div>
  );
}
