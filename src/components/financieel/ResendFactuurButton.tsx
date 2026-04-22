import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import FactuurEmailDialog from "./FactuurEmailDialog";

interface ResendFactuurButtonProps {
  doc: {
    id: string;
    documentnummer: string;
    partner_id: string;
    type?: string;
    factuur_subtype?: string;
  };
  defaultTo: string;
  variant?: "icon" | "outline" | "ghost";
  size?: "sm" | "default";
  label?: string;
  onSent?: () => void;
}

/**
 * Herbruikbare knop voor "Opnieuw versturen" van een verstuurde factuur/creditnota/pakbon.
 * Opent intern de FactuurEmailDialog met isResend=true, zodat onderwerp/body als
 * herinnering worden voorgevuld en de actie correct in de historie wordt gelogd.
 */
export default function ResendFactuurButton({
  doc, defaultTo, variant = "outline", size = "sm", label, onSent,
}: ResendFactuurButtonProps) {
  const [open, setOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      {variant === "icon" ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          title="Opnieuw versturen"
          aria-label="Factuur opnieuw versturen"
        >
          <Send className="h-4 w-4" />
        </Button>
      ) : (
        <Button variant={variant} size={size} onClick={handleClick}>
          <Send className="h-4 w-4 mr-2" />
          {label ?? "Opnieuw versturen"}
        </Button>
      )}
      <FactuurEmailDialog
        open={open}
        onOpenChange={setOpen}
        doc={doc}
        defaultTo={defaultTo}
        isResend={true}
        onSent={onSent}
      />
    </>
  );
}
