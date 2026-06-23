import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Hand, Layers, Plus, Sparkles } from "lucide-react";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import { NieuweLeadDialog } from "@/components/affiliate/NieuweLeadDialog";
import KoudeLeadsZoekDialog from "@/components/affiliate/KoudeLeadsZoekDialog";
import { useAffiliateLeads, useClaimAffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";
import { useRealtimeAffiliateLeads } from "@/hooks/affiliate/useRealtimeAffiliateLeads";
import TemperatuurBadge from "@/components/sales/TemperatuurBadge";
import LeadScorePill from "@/components/sales/LeadScorePill";
import type { Temperatuur } from "@/lib/sales/temperatuur";
import { toast } from "sonner";

const AffiliatePool = () => {
  useRealtimeAffiliateLeads();
  const { data: pool = [], isLoading } = useAffiliateLeads("pool");
  const claim = useClaimAffiliateLead();
  const [selectie, setSelectie] = useState<Set<string>>(new Set());
  const [openNieuw, setOpenNieuw] = useState(false);
  const [openZoek, setOpenZoek] = useState(false);

  const toggle = (id: string) => setSelectie((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const toggleAll = () => setSelectie((s) => s.size === pool.length ? new Set() : new Set(pool.map((p) => p.id)));

  const bulkClaim = async () => {
    let gelukt = 0;
    for (const id of selectie) {
      try { await claim.mutateAsync(id); gelukt++; } catch { /* skip */ }
    }
    setSelectie(new Set());
    if (gelukt) toast.success(`${gelukt} leads geclaimd`);
  };

  return (
    <div className="p-6">
      <AffiliateSubnav />
      <div className="mb-4 flex items-end justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Leadpool</h1>
          <p className="text-sm text-muted-foreground">
            Claim leads uit de pool of voeg zelf een lead toe aan jouw pijplijn. {pool.length} in pool.
          </p>
        </div>
        <div className="flex gap-2">
          {selectie.size > 0 && (
            <Button variant="outline" onClick={bulkClaim} disabled={claim.isPending}>
              <Layers className="h-4 w-4 mr-1" /> {selectie.size} leads claimen
            </Button>
          )}
          <Button variant="outline" onClick={() => setOpenZoek(true)}>
            <Sparkles className="h-4 w-4 mr-1" /> Leads zoeken met AI
          </Button>
          <Button onClick={() => setOpenNieuw(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nieuwe lead
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={pool.length > 0 && selectie.size === pool.length} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>Bedrijf</TableHead>
              <TableHead>Temp</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Branche</TableHead>
              <TableHead>Regio</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Geschatte waarde</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={9} className="text-center py-6 text-muted-foreground">Laden...</TableCell></TableRow>}
            {!isLoading && pool.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Geen leads in de pool. Vraag de platformbeheerder om nieuwe leads toe te voegen.</TableCell></TableRow>}
            {pool.map((l) => (
              <TableRow key={l.id}>
                <TableCell><Checkbox checked={selectie.has(l.id)} onCheckedChange={() => toggle(l.id)} /></TableCell>
                <TableCell className="font-medium">{l.bedrijfsnaam}</TableCell>
                <TableCell><TemperatuurBadge temperatuur={(l.temperatuur ?? "koud") as Temperatuur} showLabel={false} /></TableCell>
                <TableCell><LeadScorePill lead={l as never} showLabel={false} /></TableCell>
                <TableCell>{l.branche ?? "—"}</TableCell>
                <TableCell>{l.regio ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{l.contactpersoon ?? l.telefoon ?? l.email ?? "—"}</TableCell>
                <TableCell>{l.geschatte_waarde ? `€${Number(l.geschatte_waarde).toLocaleString("nl-NL")}` : "—"}</TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => claim.mutate(l.id)} disabled={claim.isPending}>
                    <Hand className="h-4 w-4 mr-1" /> Claim
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <NieuweLeadDialog open={openNieuw} onOpenChange={setOpenNieuw} bestemming="pool" />
      <KoudeLeadsZoekDialog open={openZoek} onOpenChange={setOpenZoek} />
    </div>
  );
};

export default AffiliatePool;