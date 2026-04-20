import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen } from "lucide-react";
import { useKennisArtikelen } from "@/hooks/helpdesk/useKennisbank";

export default function Kennisbank() {
  const [zoek, setZoek] = useState("");
  const { data: artikelen = [], isLoading } = useKennisArtikelen({ zoekterm: zoek || undefined });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kennisbank</h1>
        <p className="text-sm text-muted-foreground">Naslagwerk opgebouwd uit opgeloste tickets</p>
      </div>

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Zoek probleem, foutcode of merk" value={zoek} onChange={(e) => setZoek(e.target.value)} className="pl-9" />
        </div>
      </Card>

      {isLoading && <p className="text-sm text-muted-foreground">Laden…</p>}
      {!isLoading && artikelen.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Nog geen artikelen</p>
          <p className="text-sm text-muted-foreground">Bij elke opgeloste ticket bouwt AI je kennisbank verder uit.</p>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {artikelen.map((a) => (
          <Link key={a.id} to={`/helpdesk/kennisbank/${a.id}`}>
            <Card className="p-4 h-full hover:border-primary transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-medium leading-tight">{a.titel}</h3>
                {a.status !== "gepubliceerd" && <Badge variant="outline" className="text-xs">{a.status}</Badge>}
              </div>
              {a.samenvatting && <p className="text-sm text-muted-foreground line-clamp-3">{a.samenvatting}</p>}
              <div className="flex flex-wrap gap-1 mt-3">
                {a.product_merk && <Badge variant="secondary" className="text-xs">{a.product_merk}</Badge>}
                {a.product_categorie && <Badge variant="secondary" className="text-xs">{a.product_categorie}</Badge>}
                {a.foutcode && <Badge variant="outline" className="text-xs">code {a.foutcode}</Badge>}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}