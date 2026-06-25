import { AlertTriangle, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NL_TZ = "Europe/Amsterdam";
const browserTz = (() => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return NL_TZ; }
})();

function tzOffsetLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, timeZoneName: "shortOffset" })
      .formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch { return ""; }
}

function tzCity(tz: string): string {
  const last = tz.split("/").pop() ?? tz;
  return last.replace(/_/g, " ");
}

/**
 * Formatteer een wandklok-tijd (datum+tijd of datetime-local string) zoals die in
 * target-tijdzone zou klinken. Behandelt de input als wandklok in `sourceTz`.
 */
function convertWallClock(
  isoLocal: string,
  sourceTz: string,
  targetTz: string,
): string {
  if (!isoLocal) return "";
  // Behandel input "YYYY-MM-DDTHH:mm" als wandklok in sourceTz.
  // Truc: bouw een UTC-datum die zou matchen, door offset te corrigeren.
  try {
    const naive = new Date(`${isoLocal}:00`);
    if (Number.isNaN(naive.getTime())) return "";
    // Bepaal de offset van sourceTz op deze datum
    const sourceOffsetMin = getTzOffsetMinutes(naive, sourceTz);
    const browserOffsetMin = -naive.getTimezoneOffset();
    const correctedUtc = new Date(naive.getTime() - (sourceOffsetMin - browserOffsetMin) * 60_000);
    return new Intl.DateTimeFormat("nl-NL", {
      timeZone: targetTz, day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit",
    }).format(correctedUtc);
  } catch { return ""; }
}

function getTzOffsetMinutes(date: Date, tz: string): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const parts = dtf.formatToParts(date);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const asUtc = Date.UTC(
      get("year"), get("month") - 1, get("day"),
      get("hour"), get("minute"), get("second"),
    );
    return (asUtc - date.getTime()) / 60_000;
  } catch { return 0; }
}

interface Props {
  /** Datetime-local string `YYYY-MM-DDTHH:mm` (optioneel — banner toont ook zonder tijd) */
  moment?: string;
  /** Optioneel separaat datum (YYYY-MM-DD) + tijd (HH:mm) — gebruik óf moment, óf datum+tijd */
  datum?: string;
  tijd?: string;
  /** Compact (één regel) — voor in dialogs */
  compact?: boolean;
  className?: string;
}

export function TijdzoneBanner({ moment, datum, tijd, compact, className }: Props) {
  const { profile } = useAuth();
  const profileTz = (profile as { timezone?: string | null } | null)?.timezone || null;
  const userTz = profileTz || browserTz;
  const tzAfwijktVanNL = userTz !== NL_TZ;

  const isoLocal = moment || (datum && tijd ? `${datum}T${tijd}` : "");
  const nlTijd = isoLocal ? convertWallClock(isoLocal, userTz, NL_TZ) : "";

  return (
    <div
      className={[
        "rounded-md border text-xs",
        compact ? "px-2.5 py-2" : "p-3 space-y-1.5",
        tzAfwijktVanNL ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-muted/40",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        {tzAfwijktVanNL ? (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
        ) : (
          <Globe className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
        )}
        <div className="space-y-1 min-w-0">
          <div>
            Tijd in <span className="font-semibold">{tzCity(userTz)}</span>
            {tzOffsetLabel(userTz) && <span className="text-muted-foreground"> ({tzOffsetLabel(userTz)})</span>}
            {!profileTz && (
              <span className="text-muted-foreground"> — browser-tijdzone</span>
            )}
          </div>
          {tzAfwijktVanNL && nlTijd && (
            <div className="text-muted-foreground">
              <span className="font-medium text-foreground">In Nederland:</span> {nlTijd}
              <span className="text-muted-foreground"> ({tzOffsetLabel(NL_TZ)})</span>
            </div>
          )}
          {tzAfwijktVanNL && !nlTijd && (
            <div className="text-muted-foreground">
              Je werkt buiten Nederland — vul de tijd in zoals jij die wilt. Klant en collega's zien de afspraak in hun eigen tijdzone.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}