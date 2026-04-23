import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  geescaleerd: Array<{ id: string; ticketnummer: string; titel: string }>;
  installaties_komend: Array<{ id: string; installatienummer: string | null; consument_naam: string | null; geplande_startdatum: string | null }>;
  offertes_oud: Array<{ id: string; offertenummer: string; klant_naam: string | null; created_at: string | null }>;
  facturen_vervallen: Array<{ id: string; documentnummer: string; totaal_bedrag: number; vervaldatum: string | null }>;
}

export default function AandachtKaart(props: Props) {
  const navigate = useNavigate();
  const totaal = props.geescaleerd.length + props.installaties_komend.length + props.offertes_oud.length + props.facturen_vervallen.length;

  const Section = ({ title, children, count }: { title: string; children: React.ReactNode; count: number }) => (
    count === 0 ? null : (
      <div className="space-y-1">
        <p className="text-[10px] uppercase font-semibold tracking-wide text-muted-foreground">{title} · {count}</p>
        {children}
      </div>
    )
  );

  const Row = ({ label, sub, onClick }: { label: string; sub: string; onClick: () => void }) => (
    <button onClick={onClick} className="w-full text-left p-2 rounded-lg hover:bg-muted/40 flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-1">{label}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">{sub}</p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );

  return (
    <Card className="rounded-2xl border-0 shadow-sm h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning-foreground" /> Aandacht ({totaal})</CardTitle>
      </CardHeader>
      <CardContent className="pt-2 space-y-3 max-h-[60vh] overflow-y-auto">
        {totaal === 0 ? (
          <p className="text-xs text-muted-foreground">Niets vereist actie 🎉</p>
        ) : null}

        <Section title="Geëscaleerde tickets" count={props.geescaleerd.length}>
          {props.geescaleerd.map(t => <Row key={t.id} label={t.titel} sub={t.ticketnummer} onClick={() => navigate(`/helpdesk/tickets/${t.id}`)} />)}
        </Section>

        <Section title="Installaties komende week" count={props.installaties_komend.length}>
          {props.installaties_komend.map(i => <Row key={i.id} label={i.consument_naam ?? "Installatie"} sub={`${i.installatienummer ?? ""} · ${i.geplande_startdatum ?? ""}`} onClick={() => navigate(`/installaties/${i.id}`)} />)}
        </Section>

        <Section title="Offertes >7 dagen open" count={props.offertes_oud.length}>
          {props.offertes_oud.map(o => <Row key={o.id} label={o.klant_naam ?? "Klant"} sub={o.offertenummer} onClick={() => navigate(`/offertes/${o.id}`)} />)}
        </Section>

        <Section title="Vervallen facturen" count={props.facturen_vervallen.length}>
          {props.facturen_vervallen.map(f => <Row key={f.id} label={f.documentnummer} sub={`€ ${f.totaal_bedrag.toFixed(2)} · ${f.vervaldatum ?? ""}`} onClick={() => navigate(`/financieel/${f.id}`)} />)}
        </Section>
      </CardContent>
    </Card>
  );
}