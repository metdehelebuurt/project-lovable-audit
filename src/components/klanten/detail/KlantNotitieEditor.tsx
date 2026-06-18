import { useEffect, useState } from "react";
import { MentionTextarea } from "@/components/shared/notes/MentionTextarea";
import { Button } from "@/components/ui/button";
import { processNoteMentions } from "@/lib/notes/processMentions";
import { Save } from "lucide-react";

interface Props {
  klantId: string;
  initialValue: string;
  klantNaam?: string;
  partnerId: string | null | undefined;
  senderId: string | null | undefined;
  onSave: (v: string) => Promise<void>;
}

export default function KlantNotitieEditor({ klantId, initialValue, klantNaam, partnerId, senderId, onSave }: Props) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => setValue(initialValue), [initialValue]);
  const dirty = value !== initialValue;

  const save = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      await onSave(value);
      await processNoteMentions({
        inhoud: value,
        resourceType: "klant",
        resourceId: klantId,
        resourceTitel: klantNaam,
        partnerId,
        senderId,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <MentionTextarea value={value} onChange={setValue} rows={4} placeholder="Notities over deze klant… gebruik @ om een collega te taggen" />
      <div className="flex justify-end">
        <Button size="sm" className="rounded-xl gap-1.5" disabled={!dirty || saving} onClick={save}>
          <Save className="h-3.5 w-3.5" /> {saving ? "Opslaan…" : "Opslaan"}
        </Button>
      </div>
    </div>
  );
}