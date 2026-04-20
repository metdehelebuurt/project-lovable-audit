import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function BijlageUpload({
  ticketId,
  partnerId,
  userId,
}: {
  ticketId: string;
  partnerId: string;
  userId: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [bezig, setBezig] = useState(false);
  const qc = useQueryClient();

  const upload = async (file: File) => {
    setBezig(true);
    try {
      const path = `${partnerId}/${ticketId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("helpdesk-media").upload(path, file);
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage.from("helpdesk-media").createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl ?? path;
      const { error: insErr } = await supabase.from("helpdesk_ticket_bijlagen").insert({
        ticket_id: ticketId,
        partner_id: partnerId,
        bestandsnaam: file.name,
        bestand_url: url,
        mime_type: file.type,
        bestand_grootte: file.size,
        geupload_door_id: userId,
      } as never);
      if (insErr) throw insErr;
      qc.invalidateQueries({ queryKey: ["helpdesk_bijlagen", ticketId] });
      toast.success("Bijlage geüpload");
    } catch (e) {
      toast.error(`Upload mislukt: ${(e as Error).message}`);
    } finally {
      setBezig(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={ref}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />
      <Button size="sm" variant="outline" onClick={() => ref.current?.click()} disabled={bezig}>
        {bezig ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
        Bijlage toevoegen
      </Button>
    </div>
  );
}