import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Trash2, Search, ClipboardList, Eye, PlayCircle, CalendarPlus, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Schouw = Database["public"]["Tables"]["schouwen"]["Row"];
type SchouwCategorie = Database["public"]["Enums"]["schouw_categorie"];
type SchouwStatus = Database["public"]["Enums"]["schouw_status"];

const categorieLabels: Record<SchouwCategorie, string> = {
  zonnepanelen: "Zonnepanelen", warmtepomp: "Warmtepomp",
  isolatie_dak: "Isolatie dak", isolatie_muur: "Isolatie muur",
  isolatie_vloer: "Isolatie vloer", hr_glas: "HR++ glas",
  ventilatie: "Ventilatie", thuisbatterij: "Thuisbatterij",
};

const statusLabels: Record<SchouwStatus, string> = {
  gepland: "Gepland", uitgevoerd: "Uitgevoerd", geannuleerd: "Geannuleerd",
};

const statusColors: Record<SchouwStatus, string> = {
  gepland: "bg-primary/10 text-primary",
  uitgevoerd: "bg-success-light text-success",
  geannuleerd: "bg-error-light text-error",
};

const Schouwen = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [categorieFilter, setCategorieFilter] = useState("alle");
  const queryClient = useQueryClient();

  const isSuperadmin = profile?.rol === "superadmin";
  const isAdmin = profile?.rol === "partner_admin" || profile?.rol === "partner_staff";
  const canDelete = isSuperadmin || isAdmin;
  const canCreate = isSuperadmin || isAdmin || profile?.rol === "adviseur";

  const { data: schouwen = [], isLoading } = useQuery({
    queryKey: ["schouwen"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schouwen").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schouwen").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schouwen"] });
      toast.success("Schouw verwijderd");
    },
    onError: (err: Error) => toast.error("Fout", { description: err.message }),
  });

  const filtered = schouwen.filter(s => {
    const matchSearch = `${s.schouw_nummer} ${s.consument_naam ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "alle" || s.status === statusFilter;
    const matchCat = categorieFilter === "alle" || s.categorie === categorieFilter;
    return matchSearch && matchStatus && matchCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Schouwen</h1>
          <p className="text-muted-foreground mt-1 text-sm">Woninginspecties inplannen en uitvoeren</p>
        </div>
        {canCreate && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/schouwen/snelstart")} className="rounded-pill gap-2">
              <Zap className="h-4 w-4" /> <span className="hidden sm:inline">Direct starten</span><span className="sm:hidden">Start</span>
            </Button>
            <Button onClick={() => navigate("/schouwen/nieuw")} className="rounded-pill gap-2">
              <CalendarPlus className="h-4 w-4" /> <span className="hidden sm:inline">Schouw inplannen</span><span className="sm:hidden">Inplannen</span>
            </Button>
          </div>
        )}
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Zoek schouwen..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
            </div>
            <Select value={categorieFilter} onValueChange={setCategorieFilter}>
              <SelectTrigger className="w-48 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle categorieën</SelectItem>
                {(Object.keys(categorieLabels) as SchouwCategorie[]).map(c => (
                  <SelectItem key={c} value={c}>{categorieLabels[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle statussen</SelectItem>
                {(Object.keys(statusLabels) as SchouwStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Laden...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Geen schouwen gevonden</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nummer</TableHead>
                      <TableHead>Klant</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(s => (
                      <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate(`/schouwen/${s.id}`)}>
                        <TableCell className="font-mono text-sm">{s.schouw_nummer}</TableCell>
                        <TableCell className="font-medium">{s.consument_naam || "—"}</TableCell>
                        <TableCell><Badge variant="outline">{categorieLabels[s.categorie]}</Badge></TableCell>
                        <TableCell>{new Date(s.geplande_datum).toLocaleDateString("nl-NL")}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[s.status]}>{statusLabels[s.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {s.status === "gepland" && canCreate && (
                              <Button variant="default" size="sm" className="rounded-pill gap-1 h-8" onClick={(e) => { e.stopPropagation(); navigate(`/schouwen/${s.id}/uitvoeren`); }}>
                                <PlayCircle className="h-3.5 w-3.5" /> Starten
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/schouwen/${s.id}`); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Schouw verwijderen</AlertDialogTitle>
                                    <AlertDialogDescription>Weet je zeker dat je schouw {s.schouw_nummer} wilt verwijderen?</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteMutation.mutate(s.id)} className="bg-destructive text-destructive-foreground">Verwijderen</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filtered.map(s => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-border p-4 bg-card cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => navigate(`/schouwen/${s.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{s.consument_naam || s.schouw_nummer}</p>
                        <p className="text-xs font-mono text-muted-foreground">{s.schouw_nummer}</p>
                      </div>
                      <Badge className={`${statusColors[s.status]} ml-2 flex-shrink-0`}>{statusLabels[s.status]}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <Badge variant="outline" className="text-xs">{categorieLabels[s.categorie]}</Badge>
                      <span>{new Date(s.geplande_datum).toLocaleDateString("nl-NL")}</span>
                    </div>
                    <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                      {s.status === "gepland" && canCreate && (
                        <Button variant="default" size="sm" className="rounded-pill gap-1 h-8" onClick={() => navigate(`/schouwen/${s.id}/uitvoeren`)}>
                          <PlayCircle className="h-3.5 w-3.5" /> Starten
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/schouwen/${s.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Schouw verwijderen</AlertDialogTitle>
                              <AlertDialogDescription>Weet je zeker dat je schouw {s.schouw_nummer} wilt verwijderen?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuleren</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(s.id)} className="bg-destructive text-destructive-foreground">Verwijderen</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Schouwen;
