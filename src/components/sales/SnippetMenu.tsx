import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Mail, MessageCircle, Smartphone, FileText } from "lucide-react";
import { useSnippets, vulVariabelen, type SalesSnippet } from "@/hooks/sales/useSnippets";
import type { Temperatuur } from "@/lib/sales/temperatuur";
import type { SalesLead } from "@/hooks/sales/useSalesLeads";
import { toast } from "sonner";

interface Props {
  lead: SalesLead;
  eigenNaam?: string;
}

const KANAAL_ICON = { email: Mail, whatsapp: MessageCircle, sms: Smartphone };

export default function SnippetMenu({ lead, eigenNaam = "" }: Props) {
  const { data: snippets } = useSnippets();
  const [open, setOpen] = useState(false);
  const temperatuur = (lead.temperatuur ?? "koud") as Temperatuur;

  const passend = (snippets ?? []).filter((s) =>
    s.actief && (s.temperatuur == null || s.temperatuur === temperatuur),
  );

  const vars = {
    bedrijfsnaam: lead.bedrijfsnaam ?? "",
    contactpersoon: lead.contactpersoon ?? "",
    eigen_naam: eigenNaam,
    regio: lead.regio ?? "",
    branche: lead.branche ?? "",
  };

  const gebruik = (s: SalesSnippet) => {
    const body = vulVariabelen(s.body, vars);
    const onderwerp = vulVariabelen(s.onderwerp ?? "", vars);
    if (s.kanaal === "email") {
      const to = encodeURIComponent(lead.email ?? "");
      const sub = encodeURIComponent(onderwerp);
      const b = encodeURIComponent(body);
      window.open(`mailto:${to}?subject=${sub}&body=${b}`, "_blank");
    } else if (s.kanaal === "whatsapp") {
      const tel = (lead.telefoon ?? "").replace(/[^\d]/g, "");
      if (!tel) { toast.error("Geen telefoonnummer"); return; }
      window.open(`https://wa.me/${tel}?text=${encodeURIComponent(body)}`, "_blank");
    } else {
      void navigator.clipboard.writeText(body);
      toast.success("Snippet gekopieerd");
    }
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <FileText className="h-3.5 w-3.5" /> Snippet
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72">
        <DropdownMenuLabel className="text-xs">
          Passend bij temperatuur: {temperatuur}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {passend.length === 0 && (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            Nog geen snippets. Voeg toe via Sales › Snippets.
          </div>
        )}
        {passend.map((s) => {
          const Icon = KANAAL_ICON[s.kanaal as keyof typeof KANAAL_ICON] ?? FileText;
          return (
            <DropdownMenuItem key={s.id} onSelect={() => gebruik(s)} className="gap-2">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 truncate">{s.titel}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{s.kanaal}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}