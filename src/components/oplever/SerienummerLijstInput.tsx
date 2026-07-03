import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Camera } from "lucide-react";
import SnPhotoScannerDialog from "@/components/serienummers/SnPhotoScannerDialog";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  legacySingle?: string;
  placeholder?: string;
  ariaLabel?: string;
  scanHint?: string | null;
}

/**
 * Lijst-input voor meerdere serienummers. Toont legacy enkel-veld
 * als eerste rij (read-only chip met "→ migreer" actie) zodat oude
 * rapporten zichtbaar blijven en eenvoudig overgezet kunnen worden.
 */
const SerienummerLijstInput = ({ value, onChange, legacySingle, placeholder, ariaLabel, scanHint }: Props) => {
  const [draft, setDraft] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const lijst = value ?? [];

  const voegToe = () => {
    const v = draft.trim();
    if (!v) return;
    if (lijst.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...lijst, v]);
    setDraft("");
  };

  const verwijder = (idx: number) => {
    const next = lijst.filter((_, i) => i !== idx);
    onChange(next);
  };

  const migreerLegacy = () => {
    if (!legacySingle) return;
    if (lijst.includes(legacySingle)) return;
    onChange([legacySingle, ...lijst]);
  };

  const toonLegacy = legacySingle && legacySingle.trim() && !lijst.includes(legacySingle);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder ?? "Scan of typ serienummer"}
          aria-label={ariaLabel ?? "Serienummer toevoegen"}
          onBlur={() => {
            if (draft.trim()) voegToe();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              voegToe();
            }
          }}
        />
        <Button type="button" size="sm" variant="outline" onClick={voegToe} disabled={!draft.trim()} aria-label="Serienummer toevoegen">
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setScanOpen(true)}
          aria-label="Scan serienummer via foto"
          title="Scan via foto"
        >
          <Camera className="h-4 w-4" />
        </Button>
      </div>

      {toonLegacy && (
        <div className="flex items-center justify-between text-xs bg-muted/50 rounded-md px-2 py-1">
          <span className="font-mono text-muted-foreground">{legacySingle} <span className="not-italic text-[10px] uppercase tracking-wide ml-2">legacy</span></span>
          <Button type="button" size="sm" variant="ghost" className="h-6 text-xs" onClick={migreerLegacy}>
            → toevoegen aan lijst
          </Button>
        </div>
      )}

      {lijst.length > 0 && (
        <ul className="space-y-1">
          {lijst.map((sn, idx) => (
            <li key={`${sn}-${idx}`} className="flex items-center gap-2 text-sm border rounded-md px-2 py-1">
              <span className="font-mono flex-1 truncate">{sn}</span>
              <Button type="button" size="sm" variant="ghost" onClick={() => verwijder(idx)} aria-label={`Verwijder ${sn}`}>
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <SnPhotoScannerDialog
        open={scanOpen}
        onOpenChange={setScanOpen}
        hint={scanHint ?? null}
        bestaandeSns={lijst}
        onBevestig={(bevestigd) => {
          const nieuw = bevestigd
            .map((b) => b.serienummer.trim())
            .filter((s) => s && !lijst.includes(s));
          if (nieuw.length > 0) onChange([...lijst, ...nieuw]);
        }}
      />
    </div>
  );
};

export default SerienummerLijstInput;