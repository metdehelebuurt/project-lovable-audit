import { BarChart3, Save, CalendarClock, Flame, Euro, Rocket, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_LABEL, STATUS_VOLGORDE, type AffiliateLeadStatus } from "@/lib/affiliate/leadStatus";
import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { TrialStartenButton } from "../../TrialStartenButton";
import TagsInput from "@/components/sales/TagsInput";

const TEMP_OPTIES = [
  { value: "koud", label: "Koud" },
  { value: "lauw", label: "Lauw" },
  { value: "warm", label: "Warm" },
  { value: "heet", label: "Heet" },
];

interface Props {
  lead: AffiliateLead;
  status: AffiliateLeadStatus;
  setStatus: (s: AffiliateLeadStatus) => void;
  temperatuur: string;
  setTemperatuur: (t: string) => void;
  waarde: string;
  setWaarde: (w: string) => void;
  volgendeActie: string;
  setVolgendeActie: (v: string) => void;
  tags: string[];
  setTags: (t: string[]) => void;
  isPending: boolean;
  onOpslaan: () => void;
  gewonnenPartnerId: string | null;
}

export function SalesCard({
  lead, status, setStatus, temperatuur, setTemperatuur, waarde, setWaarde,
  volgendeActie, setVolgendeActie, tags, setTags, isPending, onOpslaan, gewonnenPartnerId,
}: Props) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 min-w-0">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-md text-emerald-700 bg-emerald-50">
          <BarChart3 className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold">Sales</h3>
      </div>

      <div className="space-y-2.5">
        <div>
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as AffiliateLeadStatus)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_VOLGORDE.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Flame className="h-3 w-3" /> Temp.
            </Label>
            <Select value={temperatuur} onValueChange={setTemperatuur}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEMP_OPTIES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Euro className="h-3 w-3" /> Waarde
            </Label>
            <Input type="number" value={waarde} onChange={(e) => setWaarde(e.target.value)} className="h-9" />
          </div>
        </div>

        <div>
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <CalendarClock className="h-3 w-3" /> Volgende actie
          </Label>
          <Input type="date" value={volgendeActie} onChange={(e) => setVolgendeActie(e.target.value)} className="h-9" />
        </div>

        <div>
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <Tag className="h-3 w-3" /> Tags
          </Label>
          <TagsInput
            waarde={tags}
            onWijzig={setTags}
            placeholder="Bijv. beurs2026, koudebellen…"
          />
        </div>

        <Button onClick={onOpslaan} disabled={isPending} className="w-full" size="sm">
          <Save className="h-4 w-4 mr-2" /> Opslaan
        </Button>
      </div>

      {!gewonnenPartnerId && (
        <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-3 space-y-2">
          <p className="text-xs font-medium flex items-center gap-1.5 text-primary">
            <Rocket className="h-3.5 w-3.5" /> Klaar voor trial?
          </p>
          <TrialStartenButton lead={lead} size="sm" />
        </div>
      )}
    </div>
  );
}