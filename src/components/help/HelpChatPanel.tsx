import { Trash2, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { HelpMessageList } from "./HelpMessageList";
import { HelpMessageInput } from "./HelpMessageInput";
import { useHelpChat } from "./useHelpChat";
import { getSuggestions } from "./suggestionsByRol";

interface HelpChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpChatPanel({ open, onOpenChange }: HelpChatPanelProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { messages, isStreaming, send, clear } = useHelpChat();
  const suggestions = getSuggestions(profile?.rol);

  const lastUserVraag = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";

  const dienVerzoekIn = () => {
    const titel = lastUserVraag.trim().slice(0, 140);
    const beschrijving = [
      lastUserVraag.trim() ? `Vraag aan AI-hulp:\n${lastUserVraag.trim()}` : "",
      lastAssistant.trim() ? `\n\nAntwoord van AI-hulp:\n${lastAssistant.trim()}` : "",
    ]
      .join("")
      .trim();
    const params = new URLSearchParams({ type: "functieverzoek" });
    if (titel) params.set("titel", titel);
    if (beschrijving) params.set("beschrijving", beschrijving);
    navigate(`/feedback/nieuw?${params.toString()}`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <SheetTitle>Hulp nodig?</SheetTitle>
              <SheetDescription>Stel je vraag over mijnhuis.nu — ik wijs je de weg.</SheetDescription>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clear}
                disabled={isStreaming}
                aria-label="Wis gesprek"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1 p-4">
          <HelpMessageList
            messages={messages}
            isStreaming={isStreaming}
            onNavigate={() => onOpenChange(false)}
          />
        </ScrollArea>
        {lastUserVraag && !isStreaming && (
          <div className="border-t bg-muted/40 px-4 py-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={dienVerzoekIn}
            >
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="truncate">Functie nog niet beschikbaar? Dien een verzoek in</span>
            </Button>
          </div>
        )}
        <HelpMessageInput
          onSend={send}
          disabled={isStreaming}
          suggestions={suggestions}
          showSuggestions={messages.length === 0}
        />
      </SheetContent>
    </Sheet>
  );
}