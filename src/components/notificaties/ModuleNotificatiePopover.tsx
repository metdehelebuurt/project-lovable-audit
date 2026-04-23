import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { Bell, Check, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useModuleNotificaties,
  markeerModuleGelezen,
  markeerNotificatieGelezen,
  detailUrlVoorEntiteit,
} from "@/hooks/useModuleNotificatieCounts";
import { useAuth } from "@/contexts/AuthContext";

interface ModuleNotificatiePopoverProps {
  entityType: string;
  moduleLabel: string;
  moduleUrl: string;
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * Toont een popover met de ongelezen notificaties van één module.
 * Klikken op een item navigeert naar het specifieke detail.
 */
export function ModuleNotificatiePopover({
  entityType,
  moduleLabel,
  moduleUrl,
  children,
  align = "end",
  side = "bottom",
}: ModuleNotificatiePopoverProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useModuleNotificaties(entityType);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["module-notificatie-counts"] });
    qc.invalidateQueries({ queryKey: ["module-notificaties"] });
  };

  const handleItemClick = async (id: string, entityId: string | null) => {
    await markeerNotificatieGelezen(id);
    invalidate();
    const url = detailUrlVoorEntiteit(entityType, entityId);
    navigate(url ?? moduleUrl);
  };

  const handleMarkAll = async () => {
    if (!user) return;
    await markeerModuleGelezen(user.id, entityType);
    invalidate();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} side={side} className="w-80 p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">{moduleLabel}</span>
            {items.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                {items.length}
              </span>
            )}
          </div>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleMarkAll}>
              <Check className="h-3 w-3 mr-1" />
              Alles gelezen
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="p-4 text-xs text-muted-foreground">Laden…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Geen ongelezen meldingen
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(n.id, n.entity_id)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground line-clamp-1">
                          {n.titel}
                        </p>
                        {n.bericht && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                            {n.bericht}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: nl })}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <div className="px-4 py-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs justify-center"
            onClick={() => navigate(moduleUrl)}
          >
            Open {moduleLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}