import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Search, Mail, Phone, MapPin } from "lucide-react";

const Klanten = () => {
  const [search, setSearch] = useState("");

  const { data: klanten = [], isLoading } = useQuery({
    queryKey: ["klanten"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("klanten" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = klanten.filter((k: any) => {
    const q = search.toLowerCase();
    return !q || `${k.voornaam} ${k.achternaam} ${k.email || ""} ${k.plaats || ""}`.toLowerCase().includes(q);
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Klanten</h1>
          <p className="text-muted-foreground mt-1">Overzicht van alle klanten die een offerte hebben geaccepteerd</p>
        </div>
        <Badge variant="secondary" className="gap-1 self-start">
          <Users className="h-3.5 w-3.5" /> {klanten.length} klanten
        </Badge>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op naam, e-mail of plaats..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Laden...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Geen klanten gevonden</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Plaats</TableHead>
                    <TableHead>Sinds</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((k: any) => (
                    <TableRow key={k.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link to={`/klanten/${k.id}`} className="font-medium text-foreground hover:text-primary">
                          {k.voornaam} {k.achternaam}
                          {k.bedrijfsnaam && <span className="text-muted-foreground text-xs ml-2">({k.bedrijfsnaam})</span>}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 text-sm">
                          {k.email && <span className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{k.email}</span>}
                          {k.telefoon && <span className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{k.telefoon}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {k.plaats && <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3 w-3" />{k.plaats}</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(k.created_at)}</TableCell>
                      <TableCell>
                        <Link to={`/klanten/${k.id}`} className="text-sm text-primary hover:underline">Bekijk</Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Klanten;
