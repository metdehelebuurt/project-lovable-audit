import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEffectieveModules } from "@/lib/modules";

export interface HelpMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_HISTORY = 20;
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/help-assistant`;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

function storageKey(userId: string | undefined): string {
  return `help-chat:${userId ?? "anon"}`;
}

function loadHistory(userId: string | undefined): HelpMessage[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-MAX_HISTORY);
  } catch {
    return [];
  }
}

function saveHistory(userId: string | undefined, messages: HelpMessage[]): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(messages.slice(-MAX_HISTORY)));
  } catch {
    // localStorage kan vol zijn — negeer
  }
}

interface ParseState {
  buffer: string;
}

function extractDeltas(state: ParseState, chunk: string): { deltas: string[]; done: boolean } {
  state.buffer += chunk;
  const deltas: string[] = [];
  let done = false;
  let nlIdx: number;
  while ((nlIdx = state.buffer.indexOf("\n")) !== -1) {
    let line = state.buffer.slice(0, nlIdx);
    state.buffer = state.buffer.slice(nlIdx + 1);
    if (line.endsWith("\r")) line = line.slice(0, -1);
    if (!line || line.startsWith(":") || !line.startsWith("data: ")) continue;
    const json = line.slice(6).trim();
    if (json === "[DONE]") {
      done = true;
      break;
    }
    try {
      const parsed = JSON.parse(json);
      const txt = parsed.choices?.[0]?.delta?.content;
      if (typeof txt === "string" && txt) deltas.push(txt);
    } catch {
      // partial JSON — terugleggen en wachten op meer
      state.buffer = `${line}\n${state.buffer}`;
      break;
    }
  }
  return { deltas, done };
}

export function useHelpChat() {
  const { profile } = useAuth();
  const { moduleSet } = useEffectieveModules();
  const userId = profile?.id;
  const [messages, setMessages] = useState<HelpMessage[]>(() => loadHistory(userId));
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages(loadHistory(userId));
  }, [userId]);

  useEffect(() => {
    saveHistory(userId, messages);
  }, [userId, messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMsg: HelpMessage = { role: "user", content: trimmed };
      const next = [...messages, userMsg];
      setMessages(next);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let assistantText = "";
      const upsert = (delta: string) => {
        assistantText += delta;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantText } : m));
          }
          return [...prev, { role: "assistant", content: assistantText }];
        });
      };

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: next,
            rol: profile?.rol ?? "partner_staff",
            module_keys: Array.from(moduleSet),
          }),
        });

        if (resp.status === 429) {
          toast.error("Even druk, probeer het zo opnieuw.");
          setMessages(messages);
          return;
        }
        if (resp.status === 402) {
          toast.error("AI-tegoed op. Neem contact op met je beheerder.");
          setMessages(messages);
          return;
        }
        if (!resp.ok || !resp.body) {
          toast.error("Kon geen antwoord ophalen.");
          setMessages(messages);
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        const state: ParseState = { buffer: "" };
        let streamDone = false;
        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          const { deltas, done: sseDone } = extractDeltas(state, decoder.decode(value, { stream: true }));
          for (const d of deltas) upsert(d);
          if (sseDone) streamDone = true;
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.error("help-chat error", e);
          toast.error("Er ging iets mis. Probeer het opnieuw.");
          setMessages(messages);
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, profile?.rol, moduleSet],
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
  }, []);

  return { messages, isStreaming, send, clear };
}