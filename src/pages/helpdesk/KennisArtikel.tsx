import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Pencil, Save, X, Globe2, Archive, FileText, Loader2, Trash2, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useKennisArtikel, useUpdateKennisArtikel, type KennisArtikel } from "@/hooks/helpdesk/useKennisbank";

type Status = "concept" | "gepubliceerd" | "gearchiveerd";

interface OplossingStap {
  stap?: string;
  omschrijving?: string;
  zekerheid?: string;
  bronnen?: string;
}

/** Probeert oplossing als JSON-stappen te lezen; valt terug op platte tekst. */
function parseStappen(raw: string | null | undefined): OplossingStap[] | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const cleaned = arr.filter((s) => s && (s.stap || s.omschrijving));
    return cleaned.length > 0 ? (cleaned as OplossingStap[]) : null;
  } catch {
    return null;
  }
}

const STATUS_LABEL: Record<Status, string> = {
  concept: "Concept",
  gepubliceerd: "Gepubliceerd",
  gearchiveerd: "Gearchiveerd",
};

const STATUS_BADGE: Record<Status, string> = {
  concept: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  gepubliceerd: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  gearchiveerd: "bg-muted text-muted-foreground border-border",
};

type EditForm = Pick<
  KennisArtikel,
  "titel" | "samenvatting" | "probleem" | "oplossing" | "product_merk" |
  "product_categorie" | "product_type" | "foutcode" | "status"
>;

function toForm(a: KennisArtikel): EditForm {
  return {
    titel: a.titel,
    samenvatting: a.samenvatting ?? "",
    probleem: a.probleem ?? "",
    oplossing: a.oplossing ?? "",
    product_merk: a.product_merk ?? "",
    product_categorie: a.product_categorie ?? "",
    product_type: a.product_type ?? "",
    foutcode: a.foutcode ?? "",
    status: a.status,
  };
}

export default function KennisArtikel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: a, isLoading } = useKennisArtikel(id);
  const update = useUpdateKennisArtikel();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase.rpc("increment_kb_views", { _artikel_id: id }).then(() => {});
  }, [id]);

  useEffect(() => {
    if (a && !editing) setForm(toForm(a));
  }, [a, editing]);

  const stappen = useMemo(() => parseStappen(a?.oplossing), [a?.oplossing]);

  const canManage = useMemo(() => {
    if (!a || !profile) return false;
    if (profile.rol === "superadmin") return true;
    const sameTenant = profile.partner_id === a.partner_id;
    if (!sameTenant) return false;
    return (
      profile.rol === "partner_admin" ||
      profile.rol === "backoffice" ||
      a.gemaakt_door === profile.id
    );
  }, [a, profile]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Laden…</p>;
  if (!a) return <p className="text-sm text-muted-foreground">Artikel niet gevonden.</p>;

  const startEdit = () => {
    setForm(toForm(a));
    setEditing(true);
  };
  const cancelEdit = () => {
    setForm(toForm(a));
    setEditing(false);
  };

  const persist = async (patch: Partial<KennisArtikel>, successMsg: string) => {
    try {
      await update.mutateAsync({ id: a.id, ...patch });
      toast.success(successMsg);
      setEditing(false);
    } catch {
      /* error toast komt al uit de hook */
    }
  };

  const saveEdit = async () => {
    if (!form) return;
    if (!form.titel.trim()) {
      toast.error("Titel is verplicht");
      return;
    }
    await persist(
      {
        titel: form.titel.trim(),
        samenvatting: form.samenvatting?.trim() || null,
        probleem: form.probleem?.trim() || null,
        oplossing: form.oplossing?.trim() || null,
        product_merk: form.product_merk?.trim() || null,
        product_categorie: form.product_categorie?.trim() || null,
        product_type: form.product_type?.trim() || null,
        foutcode: form.foutcode?.trim() || null,
        status: form.status,
      },
      "Artikel opgeslagen",
    );
  };

  const publish = async () => {
    await persist(
      {
        status: "gepubliceerd",
        goedgekeurd_door: profile?.id ?? null,
        goedgekeurd_op: new Date().toISOString(),
      } as Partial<KennisArtikel>,
      "Artikel gepubliceerd voor intern gebruik",
    );
  };

  const archive = async () => {
    await persist({ status: "gearchiveerd" }, "Artikel gearchiveerd");
  };

  const backToConcept = async () => {
    await persist({ status: "concept" }, "Artikel teruggezet naar concept");
  };

  const verwijderen = async () => {
    const { error } = await supabase.from("helpdesk_kennis_artikelen").delete().eq("id", a.id);
    if (error) {
      toast.error(`Verwijderen mislukt: ${error.message}`);
      return;
    }
    toast.success("Artikel verwijderd");
    navigate("/helpdesk/kennisbank");
  };

  const status = a.status as Status;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button asChild variant="ghost" size="sm">
          <Link to="/helpdesk/kennisbank"><ArrowLeft className="h-4 w-4 mr-2" />Terug</Link>
        </Button>

        {canManage && !editing && (
          <div className="flex items-center gap-2 flex-wrap">
            {status !== "gepubliceerd" && (
              <Button size="sm" onClick={publish} disabled={update.isPending} className="gap-1.5">
                {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe2 className="h-4 w-4" />}
                Publiceren
              </Button>
            )}
            {status === "gepubliceerd" && (
              <Button size="sm" variant="outline" onClick={backToConcept} disabled={update.isPending} className="gap-1.5">
                <FileText className="h-4 w-4" /> Terug naar concept
              </Button>
            )}
            {status !== "gearchiveerd" && (
              <Button size="sm" variant="outline" onClick={archive} disabled={update.isPending} className="gap-1.5">
                <Archive className="h-4 w-4" /> Archiveren
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={startEdit} className="gap-1.5">
              <Pencil className="h-4 w-4" /> Bewerken
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive gap-1.5">
                  <Trash2 className="h-4 w-4" /> Verwijderen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Artikel verwijderen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Deze actie kan niet ongedaan worden gemaakt.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => { e.preventDefault(); verwijderen(); }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Verwijderen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {canManage && editing && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={cancelEdit} disabled={update.isPending} className="gap-1.5">
              <X className="h-4 w-4" /> Annuleren
            </Button>
            <Button size="sm" onClick={saveEdit} disabled={update.isPending} className="gap-1.5">
              {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Opslaan
            </Button>
          </div>
        )}
      </div>

      {/* Statusbalk */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={STATUS_BADGE[status]}>
          {status === "gepubliceerd" && <CheckCircle2 className="h-3 w-3 mr-1" />}
          {STATUS_LABEL[status]}
        </Badge>
        {a.ai_gegenereerd && <Badge variant="secondary">AI-gegenereerd</Badge>}
        {status === "gepubliceerd" && (
          <span className="text-xs text-muted-foreground">Zichtbaar voor je team binnen de helpdesk.</span>
        )}
        {status === "concept" && (
          <span className="text-xs text-muted-foreground">Alleen zichtbaar voor jou en beheerders tot je publiceert.</span>
        )}
      </div>

      {/* Lees- of bewerkweergave */}
      {!editing || !form ? (
        <>
          <div>
            <h1 className="text-2xl font-semibold">{a.titel}</h1>
            {a.samenvatting && <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{a.samenvatting}</p>}
          </div>

          {(a.product_merk || a.product_categorie || a.product_type || a.foutcode) && (
            <div className="flex flex-wrap gap-2">
              {a.product_merk && <Badge variant="secondary">{a.product_merk}</Badge>}
              {a.product_categorie && <Badge variant="secondary">{a.product_categorie}</Badge>}
              {a.product_type && <Badge variant="secondary">{a.product_type}</Badge>}
              {a.foutcode && <Badge variant="outline">Foutcode {a.foutcode}</Badge>}
            </div>
          )}

          {a.probleem && (
            <Card className="p-6">
              <h2 className="font-semibold mb-2">Probleem</h2>
              <p className="text-sm whitespace-pre-wrap">{a.probleem}</p>
            </Card>
          )}

          {a.oplossing && (
            <Card className="p-6">
              <h2 className="font-semibold mb-3">Oplossing</h2>
              {stappen ? (
                <ol className="space-y-4">
                  {stappen.map((s, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        {s.stap && <p className="text-sm font-medium text-foreground">{s.stap}</p>}
                        {s.omschrijving && <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{s.omschrijving}</p>}
                        {(s.zekerheid || s.bronnen) && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {s.zekerheid && <Badge variant="outline" className="text-[10px]">Zekerheid {s.zekerheid}</Badge>}
                            {s.bronnen && <Badge variant="secondary" className="text-[10px]">{s.bronnen}</Badge>}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{a.oplossing}</p>
              )}
            </Card>
          )}
        </>
      ) : (
        <Card className="p-6 space-y-4">
          <div>
            <Label className="text-xs">Titel</Label>
            <Input value={form.titel} onChange={(e) => setForm({ ...form, titel: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Samenvatting</Label>
            <Textarea
              rows={2}
              value={form.samenvatting ?? ""}
              onChange={(e) => setForm({ ...form, samenvatting: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Merk</Label>
              <Input value={form.product_merk ?? ""} onChange={(e) => setForm({ ...form, product_merk: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Categorie</Label>
              <Input value={form.product_categorie ?? ""} onChange={(e) => setForm({ ...form, product_categorie: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Input value={form.product_type ?? ""} onChange={(e) => setForm({ ...form, product_type: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Foutcode</Label>
              <Input value={form.foutcode ?? ""} onChange={(e) => setForm({ ...form, foutcode: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Probleem</Label>
            <Textarea
              rows={4}
              value={form.probleem ?? ""}
              onChange={(e) => setForm({ ...form, probleem: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">
              Oplossing
              {stappen && (
                <span className="ml-2 text-muted-foreground">
                  (let op: ruwe JSON met stappen — tekstueel bewerken vervangt de gestructureerde stappen)
                </span>
              )}
            </Label>
            <Textarea
              rows={8}
              value={form.oplossing ?? ""}
              onChange={(e) => setForm({ ...form, oplossing: e.target.value })}
              className="font-mono text-xs"
            />
          </div>
          <div className="max-w-xs">
            <Label className="text-xs">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v as Status })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="concept">Concept</SelectItem>
                <SelectItem value="gepubliceerd">Gepubliceerd (intern team)</SelectItem>
                <SelectItem value="gearchiveerd">Gearchiveerd</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}
    </div>
  );
}