import { supabase } from "@/integrations/supabase/client";

type ErrorBron = "frontend" | "edge_function" | "client_unhandled" | "client_promise";
type ErrorNiveau = "error" | "warning" | "info" | "fatal";

interface LogPayload {
  bericht: string;
  bron?: ErrorBron;
  niveau?: ErrorNiveau;
  stacktrace?: string;
  context?: Record<string, unknown>;
  edge_function_naam?: string;
  route?: string;
  status_code?: number;
}

let lastSent = 0;
const MIN_INTERVAL_MS = 200;

/** Stuur een error naar de centrale logging. Faalt nooit hard. */
export async function logError(payload: LogPayload): Promise<void> {
  try {
    const now = Date.now();
    if (now - lastSent < MIN_INTERVAL_MS) {
      // Simpele rate-limit per tab om log-storms te voorkomen
      await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS));
    }
    lastSent = Date.now();

    const route = typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined;

    await supabase.functions.invoke("log-error", {
      body: {
        bericht: payload.bericht.slice(0, 4000),
        bron: payload.bron ?? "frontend",
        niveau: payload.niveau ?? "error",
        stacktrace: payload.stacktrace?.slice(0, 16000),
        context: payload.context ?? {},
        edge_function_naam: payload.edge_function_naam,
        route: payload.route ?? route,
        status_code: payload.status_code,
      },
    });
  } catch {
    // Niet hard falen — anders krijgen we recursie
  }
}

let installed = false;
/** Installeer globale window error / unhandledrejection handlers. */
export function installGlobalErrorLogging(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    void logError({
      bron: "client_unhandled",
      niveau: "error",
      bericht: event.message ?? "Onbekende client error",
      stacktrace: event.error?.stack,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const bericht = reason instanceof Error ? reason.message : String(reason ?? "Unhandled promise rejection");
    const stack = reason instanceof Error ? reason.stack : undefined;
    void logError({
      bron: "client_promise",
      niveau: "error",
      bericht,
      stacktrace: stack,
    });
  });
}

/** Wrapper rond supabase.functions.invoke die fouten automatisch logt. */
export async function invokeFunctionLogged<T = unknown>(
  name: string,
  options?: Parameters<typeof supabase.functions.invoke>[1],
): Promise<{ data: T | null; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke<T>(name, options);
  if (error) {
    void logError({
      bron: "edge_function",
      niveau: "error",
      bericht: `Edge function "${name}" faalde: ${error.message}`,
      stacktrace: (error as Error & { stack?: string }).stack,
      edge_function_naam: name,
      context: { name },
    });
  }
  return { data: (data as T | null) ?? null, error: error as Error | null };
}