import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { HelpButton } from "./HelpButton";
import { HelpChatPanel } from "./HelpChatPanel";

export function HelpAssistantWidget() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  // Niet tonen voor consumenten (zij gebruiken het publieke portaal).
  if (!profile || profile.rol === "consument") return null;

  return (
    <>
      <HelpButton onClick={() => setOpen(true)} />
      <HelpChatPanel open={open} onOpenChange={setOpen} />
    </>
  );
}