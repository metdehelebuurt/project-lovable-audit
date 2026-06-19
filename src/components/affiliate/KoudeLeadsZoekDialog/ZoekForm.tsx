import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { BRANCHE_OPTIES, type ZoekFormState } from "./types";

interface Props {
  form: ZoekFormState;
  setForm: (updater: (prev: ZoekFormState) => ZoekFormState) => void;
  onZoek: () => void;
  isLoading: boolean;
}

function buildSuggestie(branches: string[], regio: string) {
  if (branches.length === 0) return "";
  const branche = branches[0];
  const base = `installateur ${branche}`;
  return regio.trim() ? `${base} ${regio.trim()}` : base;
}

export function ZoekForm({ form, setForm, onZoek, isLoading }: Props) {
  const toggleBranche = (b: string) => {
    setForm((p) => {
      const has = p.branches.includes(b);
      const branches = has ? p.branches.filter((x) => x !== b) : [...p.branches, b];
      const autoQuery = !p.query || p.query === buildSuggestie(p.branches, p.regio);
      return {
        ...p,
        branches,
        query: autoQuery ? buildSuggestie(branches, p.regio) : p.query,
      };
    });
  };

  const canSubmit =
    !isLoading &&
    ((form.modus === "search" && form.query.trim().length >= 3) ||
      (form.modus === "scrape" && /^https?:\/\//i.test(form.url.trim())));

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Gegevens komen uit openbare bronnen. Controleer altijd of je dit bedrijf mag benaderen
        volgens AVG en spam-wetgeving.
      </div>

      <div className="space-y-2">
        <Label>Branches</Label>
        <div className="flex flex-wrap gap-3">
          {BRANCHE_OPTIES.map((b) => (
            <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={form.branches.includes(b)} onCheckedChange={() => toggleBranche(b)} />
              <span className="capitalize">{b}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="regio">Regio / plaats (optioneel)</Label>
          <Input
            id="regio"
            value={form.regio}
            placeholder="bijv. Limburg of Eindhoven"
            onChange={(e) =>
              setForm((p) => {
                const regio = e.target.value;
                const autoQuery = !p.query || p.query === buildSuggestie(p.branches, p.regio);
                return { ...p, regio, query: autoQuery ? buildSuggestie(p.branches, regio) : p.query };
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="limit">Aantal resultaten</Label>
          <Select
            value={String(form.limit)}
            onValueChange={(v) => setForm((p) => ({ ...p, limit: Number(v) }))}
          >
            <SelectTrigger id="limit"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Bron</Label>
        <RadioGroup
          value={form.modus}
          onValueChange={(v) => setForm((p) => ({ ...p, modus: v as ZoekFormState["modus"] }))}
          className="flex gap-4"
        >
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <RadioGroupItem value="search" /> Web-zoekopdracht
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <RadioGroupItem value="scrape" /> Specifieke website
          </label>
        </RadioGroup>
      </div>

      {form.modus === "search" ? (
        <div className="space-y-1">
          <Label htmlFor="query">Zoekopdracht</Label>
          <Textarea
            id="query"
            rows={2}
            value={form.query}
            placeholder="bijv. installateur warmtepompen Brabant"
            onChange={(e) => setForm((p) => ({ ...p, query: e.target.value }))}
          />
        </div>
      ) : (
        <div className="space-y-1">
          <Label htmlFor="url">Website-URL</Label>
          <Input
            id="url"
            type="url"
            value={form.url}
            placeholder="https://branchegids.nl/zonnepanelen"
            onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Bestemming na import</Label>
        <RadioGroup
          value={form.bestemming}
          onValueChange={(v) => setForm((p) => ({ ...p, bestemming: v as ZoekFormState["bestemming"] }))}
          className="flex gap-4"
        >
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <RadioGroupItem value="pool" /> Koude leads pool
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <RadioGroupItem value="mine" /> Mijn pijplijn
          </label>
        </RadioGroup>
      </div>

      <div className="flex justify-end">
        <Button onClick={onZoek} disabled={!canSubmit} className="gap-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Zoeken
        </Button>
      </div>
    </div>
  );
}