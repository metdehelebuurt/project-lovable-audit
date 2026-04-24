import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, FileText, ClipboardList, Wrench, TrendingUp, LifeBuoy, type LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import type { VandaagRecentItem, RecentItemType } from "./useVandaagData";

const TYPE_ICON: Record<RecentItemType, LucideIcon> = {
  lead: TrendingUp, offerte: FileText, schouw: ClipboardList,
  installatie: Wrench, ticket: LifeBuoy,
};

const TYPE_LABEL: Record<RecentItemType, string> = {
  lead: "Lead", offerte: "Offerte", schouw: "Schouw",
  installatie: "Installatie", ticket: "Ticket",
};

export function VandaagRecentKaart({
  items, isLoading,
}: { items: VandaagRecentItem[]; isLoading: boolean }) {
  const navigate = useNavigate();

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Recent gewijzigd
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nog geen recente activiteit.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((it) => {
              const Icon = TYPE_ICON[it.type];
              return (
                <li key={`${it.type}-${it.id}`}>
                  <button
                    type="button"
                    onClick={() => navigate(it.url)}
                    className="w-full py-2.5 flex items-center gap-3 hover:bg-accent/50 -mx-2 px-2 rounded-lg transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{it.label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {TYPE_LABEL[it.type]} · {it.status}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(it.datum), { addSuffix: true, locale: nl })}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}