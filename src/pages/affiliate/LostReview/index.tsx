import { useMemo, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ArrowRight, Search, ExternalLink } from "lucide-react";
import { useIsLostReviewAdmin } from "@/hooks/affiliate/useIsLostReviewAdmin";
import {
  useLostLeads, useSetReviewBucket,
  BUCKET_VOLGORDE, BUCKET_LABEL, BUCKET_KLEUR,
  type LostReviewBucket, type LostLead,
} from "@/hooks/affiliate/useLostReview";
import { VERLOREN_CATEGORIEEN } from "@/components/affiliate/VerlorenRedenDialog";

const CATEGORIE_LABEL = Object.fromEntries(VERLOREN_CATEGORIEEN.map((c) => [c.value, c.label]));

export default function LostReviewPage() {
  const mag = useIsLostReviewAdmin();
  const navigate = useNavigate();
  const { data: leads = [], isLoading } = useLostLeads();
  const setBucket = useSetReviewBucket();
  const [zoek, setZoek] = useState("");

  const gefilterd = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) =>
      [l.bedrijfsnaam, l.contactpersoon, l.email, l.verloren_reden, l.eigenaar?.email]
        .filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [leads, zoek]);

  const perBucket = useMemo(() => {
    const m = new Map<LostReviewBucket, LostLead[]>();
    BUCKET_VOLGORDE.forEach((b) => m.set(b, []));
    for (const l of gefilterd) {
      const b = (l.review_bucket as LostReviewBucket) ?? "te_beoordelen";
      m.get(b)?.push(l);
    }
    return m;
  }, [gefilterd]);

  if (!mag) return <Navigate to="/affiliates" replace />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight">Verloren review</h1>
            <p className="text-sm text-muted-foreground">
              Beoordeel verloren leads en sorteer in vervolgbuckets. Toegang: superadmin + Bas.
            </p>
          </div>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek bedrijf, reden, eigenaar..."
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {BUCKET_VOLGORDE.map((b) => (
          <Card key={b} className="p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{BUCKET_LABEL[b]}</p>
            <p className="text-xl font-semibold tabular-nums">{perBucket.get(b)?.length ?? 0}</p>
          </Card>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Leads laden…</p>}

      {BUCKET_VOLGORDE.map((bucket) => {
        const items = perBucket.get(bucket) ?? [];
        if (items.length === 0) return null;
        return (
          <div key={bucket} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={BUCKET_KLEUR[bucket]}>{BUCKET_LABEL[bucket]}</Badge>
              <span className="text-xs text-muted-foreground">{items.length} leads</span>
            </div>
            <Card>
              <CardContent className="p-0 divide-y">
                {items.map((l) => {
                  const eig = l.eigenaar;
                  const eigNaam = eig
                    ? `${eig.voornaam ?? ""} ${eig.achternaam ?? ""}`.trim() || eig.email || "—"
                    : "—";
                  const verlorenDatum = l.verloren_op
                    ? new Date(l.verloren_op).toLocaleDateString("nl-NL")
                    : "—";
                  const cat = l.verloren_categorie ? CATEGORIE_LABEL[l.verloren_categorie] : null;
                  return (
                    <div key={l.id} className="flex items-start gap-3 p-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{l.bedrijfsnaam}</p>
                          {cat && <Badge variant="outline" className="text-[10px]">{cat}</Badge>}
                          {l.terug_in_pipeline_op && (
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                              Terug op {new Date(l.terug_in_pipeline_op).toLocaleDateString("nl-NL")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Verloren {verlorenDatum} · eigenaar {eigNaam}
                          {l.geschatte_waarde ? ` · € ${Number(l.geschatte_waarde).toLocaleString("nl-NL")}` : ""}
                        </p>
                        {l.verloren_reden && (
                          <p className="text-sm bg-muted/40 rounded p-2 line-clamp-3">
                            {l.verloren_reden}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select
                          value={(l.review_bucket as LostReviewBucket) ?? "te_beoordelen"}
                          onValueChange={(v) => setBucket.mutate({ id: l.id, bucket: v as LostReviewBucket })}
                        >
                          <SelectTrigger className="h-9 w-44">
                            <ArrowRight className="h-3 w-3 mr-1" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BUCKET_VOLGORDE.map((b) => (
                              <SelectItem key={b} value={b}>{BUCKET_LABEL[b]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/affiliates/leads/${l.id}`)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" /> Open
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        );
      })}

      {!isLoading && gefilterd.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Geen verloren leads.</CardContent></Card>
      )}
    </div>
  );
}