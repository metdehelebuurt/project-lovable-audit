import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Hand } from "lucide-react";
import { AffiliateSubnav } from "@/components/affiliate/AffiliateSubnav";
import { useAffiliateLeads, useClaimAffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";

const AffiliatePool = () => {
  const { data: pool = [], isLoading } = useAffiliateLeads("pool");
  const claim = useClaimAffiliateLead();

  return (
    <div className="p-6">
      <AffiliateSubnav />
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Koude leads pool</h1>
        <p className="text-sm text-muted-foreground">Claim leads om ze toe te voegen aan jouw pijplijn. {pool.length} beschikbaar.</p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bedrijf</TableHead>
              <TableHead>Branche</TableHead>
              <TableHead>Regio</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Geschatte waarde</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Laden...</TableCell></TableRow>}
            {!isLoading && pool.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Geen leads in de pool. Vraag de platformbeheerder om nieuwe leads toe te voegen.</TableCell></TableRow>}
            {pool.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.bedrijfsnaam}</TableCell>
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
    </div>
  );
};

export default AffiliatePool;