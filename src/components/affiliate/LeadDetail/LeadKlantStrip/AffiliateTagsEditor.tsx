import { useState, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AffiliateTagChipList } from "./AffiliateTagChipList";
import { voegAffiliateTagsToe, verwijderAffiliateTag } from "./tag-utils";

interface Props {
  tags: string[];
  disabled?: boolean;
  onWijzig: (tags: string[]) => void | Promise<void>;
}

export function AffiliateTagsEditor({ tags, disabled = false, onWijzig }: Props) {
  const [invoer, setInvoer] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const canSubmit = invoer.trim().length > 0 && !disabled && !isSaving;

  const wijzigTags = async (volgendeTags: string[]) => {
    setIsSaving(true);
    try {
      await onWijzig(volgendeTags);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToevoegen = () => {
    const volgendeTags = voegAffiliateTagsToe(tags, invoer);
    if (!volgendeTags) return;
    setInvoer("");
    void wijzigTags(volgendeTags);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" && event.key !== ",") return;
    event.preventDefault();
    handleToevoegen();
  };

  const handleVerwijder = (tag: string) => {
    void wijzigTags(verwijderAffiliateTag(tags, tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={invoer}
          disabled={disabled || isSaving}
          onChange={(event) => setInvoer(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nieuwe tag"
          className="h-9"
        />
        <Button type="button" size="sm" variant="outline" disabled={!canSubmit} onClick={handleToevoegen}>
          <Plus className="mr-1.5 h-4 w-4" /> Toevoegen
        </Button>
      </div>
      <AffiliateTagChipList tags={tags} disabled={disabled || isSaving} onVerwijder={handleVerwijder} />
    </div>
  );
}