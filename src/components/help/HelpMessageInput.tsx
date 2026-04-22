import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface HelpMessageInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  suggestions: string[];
  showSuggestions: boolean;
}

export function HelpMessageInput({ onSend, disabled, suggestions, showSuggestions }: HelpMessageInputProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const txt = value.trim();
    if (!txt) return;
    onSend(txt);
    setValue("");
  };

  return (
    <div className="flex flex-col gap-2 border-t bg-background p-3">
      {showSuggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSend(s)}
              disabled={disabled}
              className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Stel je vraag…"
          rows={2}
          disabled={disabled}
          className="min-h-[44px] resize-none text-sm"
        />
        <Button type="button" size="icon" onClick={submit} disabled={disabled || !value.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}