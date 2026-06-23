import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Users, Eye, Pencil, Trash2, UserPlus } from "lucide-react";
import {
  useAgendaDelegaties,
  useCollegasZelfdePartner,
  useDeelAgendaMet,
  useWijzigDelegatieScope,
  useStopDelegatie,
  type DelegatieScope,
  type AgendaDelegatie,
} from "@/hooks/agenda/useAgendaDelegaties";

function naam(c?: AgendaDelegatie["collega"]) {
  if (!c) return "Onbekend";
  const v = [c.voornaam, c.achternaam].filter(Boolean).join(" ").trim();
  return v || c.email || "Onbekend";
}

function ScopeBadge({ scope }: { scope: DelegatieScope }) {
  if (scope === "plan") {
    return (
      <Badge variant="default" className="gap-1">
        <Pencil className="h-3 w-3" /> Plannen
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Eye className="h-3 w-3" /> Bekijken
    </Badge>
  );
}

export default function AgendaDelegaties() {
  const { data, isLoading } = useAgendaDelegaties();
  const { data: collegas = [] } = useCollegasZelfdePartner();
  const deel = useDeelAgendaMet();
  const wijzig = useWijzigDelegatieScope();
  const stop = useStopDelegatie();

  const [nieuweOntvanger, setNieuweOntvanger] = useState<string>("");
  const [nieuweScope, setNieuweScope] = useState<DelegatieScope>("view");

  const uitgaand = data?.uitgaand ?? [];
  const inkomend = data?.inkomend ?? [];
  const reedsGedeeldMet = new Set(uitgaand.map((d) => d.ontvanger_user_id));
  const beschikbareCollegas = collegas.filter((c) => !reedsGedeeldMet.has(c.id));

  const voegToe = () => {
    if (!nieuweOntvanger) return;
    deel.mutate(
      { ontvanger_user_id: nieuweOntvanger, scope: nieuweScope },
      { onSuccess: () => setNieuweOntvanger("") },
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Mijn agenda delen met collega's
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Geef collega's binnen je organisatie toegang tot jouw planning. Met <strong>Bekijken</strong> kunnen ze
            je agenda inzien; met <strong>Plannen</strong> kunnen ze ook afspraken namens jou aanmaken.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-end border rounded-lg p-3 bg-muted/30">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium">Collega</label>
              <Select value={nieuweOntvanger} onValueChange={setNieuweOntvanger}>
                <SelectTrigger>
                  <SelectValue placeholder={beschikbareCollegas.length ? "Kies een collega" : "Alle collega's al gedeeld"} />
                </SelectTrigger>
                <SelectContent>
                  {beschikbareCollegas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {[c.voornaam, c.achternaam].filter(Boolean).join(" ") || c.email}
                      {c.rol ? ` · ${c.rol}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:w-44">
              <label className="text-xs font-medium">Rechten</label>
              <Select value={nieuweScope} onValueChange={(v) => setNieuweScope(v as DelegatieScope)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Alleen bekijken</SelectItem>
                  <SelectItem value="plan">Bekijken + plannen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={voegToe} disabled={!nieuweOntvanger || deel.isPending} className="gap-2">
              <UserPlus className="h-4 w-4" /> Toevoegen
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Laden…</p>
          ) : uitgaand.length === 0 ? (
            <p className="text-sm text-muted-foreground">Je deelt je agenda nog niet met collega's.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {uitgaand.map((d) => (
                <li key={d.id} className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{naam(d.collega)}</p>
                    <p className="text-xs text-muted-foreground truncate">{d.collega?.email}</p>
                  </div>
                  <Select
                    value={d.scope}
                    onValueChange={(v) => wijzig.mutate({ id: d.id, scope: v as DelegatieScope })}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">Bekijken</SelectItem>
                      <SelectItem value="plan">Plannen</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Toegang voor ${naam(d.collega)} intrekken?`)) stop.mutate(d.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" /> Agenda's die ik mag inzien
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inkomend.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nog geen collega heeft zijn agenda met jou gedeeld.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {inkomend.map((d) => (
                <li key={d.id} className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{naam(d.collega)}</p>
                    <p className="text-xs text-muted-foreground truncate">{d.collega?.email}</p>
                  </div>
                  <ScopeBadge scope={d.scope} />
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            In de Planning kun je deze agenda's bovenop je eigen weergave inschakelen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}