import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useAffiliateNotifVoorkeuren,
  useUpsertAffiliateNotifVoorkeur,
  type AffiliateNotifVoorkeur,
} from "@/hooks/affiliate/useAffiliateNotifVoorkeuren";
import { AFFILIATE_NOTIF_CATEGORIEEN, TEMPERATUREN } from "./categorieen";

function defaultsVoor(categorie: string): Omit<AffiliateNotifVoorkeur, "user_id" | "id"> {
  return {
    categorie,
    in_app: true,
    email: false,
    browser: false,
    stiltijd_van: null,
    stiltijd_tot: null,
    temperaturen: ["koud", "lauw", "warm", "heet"],
  };
}

const AffiliateNotificatieVoorkeuren = () => {
  const { data: voorkeuren, isLoading } = useAffiliateNotifVoorkeuren();
  const upsert = useUpsertAffiliateNotifVoorkeur();

  // Lokale state per categorie zodat toggles direct reageren.
  const [state, setState] = useState<Record<string, Omit<AffiliateNotifVoorkeur, "user_id" | "id">>>({});

  useEffect(() => {
    if (!voorkeuren) return;
    const next: typeof state = {};
    for (const cat of AFFILIATE_NOTIF_CATEGORIEEN) {
      const bestaand = voorkeuren[cat.key];
      next[cat.key] = bestaand
        ? {
            categorie: bestaand.categorie,
            in_app: bestaand.in_app,
            email: bestaand.email,
            browser: bestaand.browser,
            stiltijd_van: bestaand.stiltijd_van,
            stiltijd_tot: bestaand.stiltijd_tot,
            temperaturen: bestaand.temperaturen ?? ["koud", "lauw", "warm", "heet"],
          }
        : defaultsVoor(cat.key);
    }
    setState(next);
  }, [voorkeuren]);

  const opslaan = async (categorie: string, patch: Partial<Omit<AffiliateNotifVoorkeur, "user_id" | "id">>) => {
    const huidig = state[categorie] ?? defaultsVoor(categorie);
    const next = { ...huidig, ...patch };
    setState((s) => ({ ...s, [categorie]: next }));
    try {
      await upsert.mutateAsync(next);
    } catch {
      // toast via hook
    }
  };

  const alleUitzetten = async () => {
    try {
      await Promise.all(
        AFFILIATE_NOTIF_CATEGORIEEN.map((c) =>
          upsert.mutateAsync({ ...(state[c.key] ?? defaultsVoor(c.key)), in_app: false, email: false, browser: false }),
        ),
      );
      toast.success("Alle notificaties uitgezet");
    } catch {
      /* handled */
    }
  };

  const kanaalCount = useMemo(() => {
    let n = 0;
    for (const c of Object.values(state)) {
      if (c.in_app) n++;
      if (c.email) n++;
      if (c.browser) n++;
    }
    return n;
  }, [state]);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/affiliates/instellingen"><ArrowLeft className="h-4 w-4 mr-1" /> Terug</Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" /> Notificatievoorkeuren
        </h1>
        <p className="text-sm text-muted-foreground">
          Kies per lead-type welk kanaal je gebruikt en op welke tijden je met rust gelaten wilt worden.
          {" "}<Badge variant="secondary">{kanaalCount} actieve kanalen</Badge>
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Voorkeuren laden…</div>
      ) : (
        <div className="space-y-3">
          {AFFILIATE_NOTIF_CATEGORIEEN.map((cat) => {
            const v = state[cat.key] ?? defaultsVoor(cat.key);
            return (
              <Card key={cat.key} className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{cat.titel}</CardTitle>
                  <p className="text-xs text-muted-foreground">{cat.omschrijving}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <ToggleRij label="In-app" value={v.in_app} onChange={(b) => opslaan(cat.key, { in_app: b })} />
                    <ToggleRij label="E-mail" value={v.email} onChange={(b) => opslaan(cat.key, { email: b })} />
                    <ToggleRij label="Browser" value={v.browser} onChange={(b) => opslaan(cat.key, { browser: b })} />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Alleen voor lead-temperatuur</Label>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {TEMPERATUREN.map((t) => {
                        const aan = v.temperaturen.includes(t.key);
                        return (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => {
                              const next = aan ? v.temperaturen.filter((x) => x !== t.key) : [...v.temperaturen, t.key];
                              opslaan(cat.key, { temperaturen: next.length ? next : [t.key] });
                            }}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${aan ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground hover:bg-muted"}`}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Stiltijd van</Label>
                      <Input
                        type="time"
                        value={v.stiltijd_van ?? ""}
                        onChange={(e) => opslaan(cat.key, { stiltijd_van: e.target.value || null })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Stiltijd tot</Label>
                      <Input
                        type="time"
                        value={v.stiltijd_tot ?? ""}
                        onChange={(e) => opslaan(cat.key, { stiltijd_tot: e.target.value || null })}
                      />
                    </div>
                  </div>
                  {v.stiltijd_van && v.stiltijd_tot && (
                    <p className="text-[11px] text-muted-foreground">
                      Tijdens {v.stiltijd_van}–{v.stiltijd_tot} ontvang je geen e-mail of browser-melding voor deze categorie. In-app blijft zichtbaar.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={alleUitzetten} disabled={upsert.isPending}>
              Alles uitzetten
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

function ToggleRij({ label, value, onChange }: { label: string; value: boolean; onChange: (b: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/40">
      <span className="text-sm">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </label>
  );
}

export default AffiliateNotificatieVoorkeuren;