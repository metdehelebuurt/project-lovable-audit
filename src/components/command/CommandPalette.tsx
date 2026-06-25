import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator,
} from "@/components/ui/command";
import { useAuth } from "@/contexts/AuthContext";
import { getAlleNavItems } from "@/lib/navigation/navigationModel";
import { useGlobaleZoek, type ZoekResultaat } from "./useGlobaleZoek";
import {
  Plus, Users, UserCheck2, FileText, ClipboardCheck, Wrench, ClipboardList,
  Search, ArrowRight,
} from "lucide-react";

const typeLabels: Record<ZoekResultaat["type"], string> = {
  lead: "Lead",
  klant: "Klant",
  offerte: "Offerte",
  opdracht: "Order",
  installatie: "Installatie",
};

const typeIcons: Record<ZoekResultaat["type"], any> = {
  lead: Users, klant: UserCheck2, offerte: FileText, opdracht: ClipboardCheck, installatie: Wrench,
};

/** Globale ⌘K palette: snelle acties, navigatie en zoek over entiteiten. */
export function CommandPalette() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Open via ⌘K / Ctrl+K
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

  // Reset query bij sluiten
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const { data: zoekResultaten = [], isFetching } = useGlobaleZoek(query);
  const navItems = getAlleNavItems(profile?.rol, profile?.extra_rollen ?? []);
  const rol = profile?.rol;

  const ga = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  const snelleActies: Array<{ id: string; label: string; url: string; rollen: string[] }> = [
    { id: "nieuwe-lead", label: "Nieuwe lead", url: "/leads?nieuw=1",
      rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"] },
    { id: "nieuwe-klant", label: "Nieuwe klant", url: "/klanten?nieuw=1",
      rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"] },
    { id: "nieuwe-offerte", label: "Nieuwe offerte", url: "/offertes/nieuw",
      rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"] },
    { id: "nieuwe-schouw", label: "Nieuwe schouw", url: "/schouwen/nieuw",
      rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"] },
    { id: "nieuwe-installatie", label: "Nieuwe installatie", url: "/installaties/nieuw",
      rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff"] },
    { id: "nieuwe-afspraak", label: "Nieuwe afspraak", url: "/planning?nieuw=1",
      rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"] },
    { id: "nieuw-ticket", label: "Nieuw helpdesk-ticket", url: "/helpdesk/tickets/nieuw",
      rollen: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"] },
  ];

  const beschikbareActies = snelleActies.filter((a) => !rol || a.rollen.includes(rol));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Zoek leads, klanten, offertes... of typ een commando"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {query.length === 0
            ? "Begin te typen om te zoeken."
            : isFetching ? "Zoeken..." : "Geen resultaten gevonden."}
        </CommandEmpty>

        {/* Zoekresultaten — enkel wanneer er gezocht wordt */}
        {query.length >= 2 && zoekResultaten.length > 0 && (
          <>
            <CommandGroup heading="Zoekresultaten">
              {zoekResultaten.map((r) => {
                const Icon = typeIcons[r.type];
                return (
                  <CommandItem
                    key={`${r.type}-${r.id}`}
                    value={`${r.type} ${r.label} ${r.sublabel ?? ""}`}
                    onSelect={() => ga(r.url)}
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{r.label}</div>
                      {r.sublabel && (
                        <div className="text-[11px] text-muted-foreground truncate">{r.sublabel}</div>
                      )}
                    </div>
                    <span className="ml-2 text-[10px] uppercase text-muted-foreground">{typeLabels[r.type]}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {beschikbareActies.length > 0 && (
          <>
            <CommandGroup heading="Snelle acties">
              {beschikbareActies.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`actie ${a.label}`}
                  onSelect={() => ga(a.url)}
                >
                  <Plus className="mr-2 h-4 w-4 text-primary" />
                  <span>{a.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {navItems.length > 0 && (
          <CommandGroup heading="Ga naar">
            {navItems.map((it) => {
              const Icon = it.icon;
              return (
                <CommandItem
                  key={it.id}
                  value={`ga ${it.label} ${(it.synoniemen ?? []).join(" ")}`}
                  onSelect={() => ga(it.url)}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{it.label}</span>
                  <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground/50" />
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/** Knop in de header die de palette opent en ⌘K toont. */
export function CommandPaletteTrigger() {
  const open = () => {
    // Dispatcht hetzelfde keyboard-event waar CommandPalette op luistert.
    const evt = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
    window.dispatchEvent(evt);
  };
  return (
    <button
      type="button"
      onClick={open}
      className="hidden md:inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3.5 py-1.5 text-xs text-muted-foreground hover:border-border hover:text-foreground transition-colors min-w-[220px]"
      aria-label="Open snelzoeken (Ctrl+K)"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="flex-1 text-left">Zoek of spring naar...</span>
      <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
    </button>
  );
}