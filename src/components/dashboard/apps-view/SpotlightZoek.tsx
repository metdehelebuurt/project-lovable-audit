import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from "@/components/ui/command";
import type { AppDefinition } from "@/lib/dashboard/apps";

interface SpotlightZoekProps {
  apps: AppDefinition[];
}

export function SpotlightZoek({ apps }: SpotlightZoekProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const open$: typeof setOpen = setOpen;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3.5 py-1.5 text-xs text-muted-foreground hover:border-border hover:text-foreground transition-colors"
        aria-label="Open snelzoeken (Ctrl+K)"
      >
        <span>Zoek apps...</span>
        <kbd className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={open$}>
        <CommandInput placeholder="Type om een app te vinden..." />
        <CommandList>
          <CommandEmpty>Geen apps gevonden.</CommandEmpty>
          <CommandGroup heading="Apps">
            {apps.map((app) => {
              const Icon = app.icon;
              return (
                <CommandItem
                  key={app.id}
                  value={`${app.label} ${app.synoniemen?.join(" ") ?? ""} ${app.categorie}`}
                  onSelect={() => { navigate(app.url); setOpen(false); }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{app.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground capitalize">{app.categorie}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
