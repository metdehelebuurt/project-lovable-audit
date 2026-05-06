import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { FeatureGate } from "@/components/abonnementen/FeatureGate";
import { useMerken } from "./useMerken";
import { MerkRow } from "./MerkRow";

const MerkenBeheer = () => {
  const { merken, loading, create, update, remove, uploadLogo } = useMerken();
  const [nieuw, setNieuw] = useState("");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Merkenbeheer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Beheer de merkenpagina's die op je website verschijnen via de Productcatalogus-widget.
        </p>
      </header>

      <FeatureGate feature="webshop_module">
        <div className="flex gap-2 max-w-md">
          <Input
            placeholder="Naam van het merk"
            value={nieuw}
            onChange={(e) => setNieuw(e.target.value)}
            maxLength={80}
          />
          <Button
            onClick={() => {
              create(nieuw);
              setNieuw("");
            }}
            disabled={!nieuw.trim()}
            className="rounded-[40px] gap-1.5"
          >
            <Plus className="h-4 w-4" /> Toevoegen
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : merken.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">
            Nog geen merken toegevoegd.
          </p>
        ) : (
          <div className="space-y-3">
            {merken.map((m) => (
              <MerkRow
                key={m.id}
                merk={m}
                onUpdate={(patch) => update(m.id, patch)}
                onUploadLogo={(file) => uploadLogo(m.id, file)}
                onDelete={() => remove(m.id)}
              />
            ))}
          </div>
        )}
      </FeatureGate>
    </div>
  );
};

export default MerkenBeheer;