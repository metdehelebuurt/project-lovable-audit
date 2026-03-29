import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Star, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface EmailTemplate {
  id: string;
  naam: string;
  onderwerp: string;
  html_body: string;
  type: string;
  standaard: boolean;
  created_at: string;
  updated_at: string;
}

const defaultTemplate = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <h2 style="color:#1a1a2e;">{{bedrijfsnaam}}</h2>
  <p>Beste {{klant_naam}},</p>
  <p>Hierbij ontvangt u onze offerte met nummer <strong>{{offertenummer}}</strong>.</p>
  <p>Totaalbedrag: <strong>{{totaal_bedrag}}</strong></p>
  <p>Geldig tot: {{geldig_tot}}</p>
  <p>Neem gerust contact met ons op als u vragen heeft.</p>
  <p>Met vriendelijke groet,<br/><strong>{{bedrijfsnaam}}</strong></p>
</div>`;

const EmailTemplates = () => {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    naam: "",
    onderwerp: "",
    html_body: defaultTemplate,
    type: "offerte",
    standaard: false,
  });

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("email_templates")
      .select("*")
      .order("created_at", { ascending: false });
    setTemplates((data as unknown as EmailTemplate[]) || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.naam.trim() || !form.onderwerp.trim()) {
      toast.error("Naam en onderwerp zijn verplicht");
      return;
    }
    if (!profile?.partner_id) return;

    if (editingId) {
      const { error } = await supabase
        .from("email_templates")
        .update({
          naam: form.naam,
          onderwerp: form.onderwerp,
          html_body: form.html_body,
          type: form.type,
          standaard: form.standaard,
        })
        .eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Template bijgewerkt");
    } else {
      const { error } = await supabase
        .from("email_templates")
        .insert({
          partner_id: profile.partner_id,
          naam: form.naam,
          onderwerp: form.onderwerp,
          html_body: form.html_body,
          type: form.type,
          standaard: form.standaard,
        });
      if (error) { toast.error(error.message); return; }
      toast.success("Template aangemaakt");
    }

    // If set as default, unset others
    if (form.standaard && editingId) {
      await supabase
        .from("email_templates")
        .update({ standaard: false })
        .neq("id", editingId)
        .eq("type", form.type);
    }

    setDialogOpen(false);
    resetForm();
    loadTemplates();
  };

  const handleEdit = (t: EmailTemplate) => {
    setEditingId(t.id);
    setForm({
      naam: t.naam,
      onderwerp: t.onderwerp,
      html_body: t.html_body,
      type: t.type,
      standaard: t.standaard,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("email_templates").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Template verwijderd");
    loadTemplates();
  };

  const handlePreview = (html: string) => {
    setPreviewHtml(
      html
        .replace(/{{bedrijfsnaam}}/g, "Uw Bedrijf")
        .replace(/{{klant_naam}}/g, "Jan de Vries")
        .replace(/{{offertenummer}}/g, "OF-2024-0001")
        .replace(/{{totaal_bedrag}}/g, "€ 5.250,00")
        .replace(/{{geldig_tot}}/g, "15 april 2024")
    );
    setPreviewOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ naam: "", onderwerp: "", html_body: defaultTemplate, type: "offerte", standaard: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Beheer uw e-mailtemplates voor offertes en andere berichten. Gebruik variabelen zoals
          <code className="bg-muted px-1 mx-1 rounded text-xs">{"{{klant_naam}}"}</code> voor dynamische content.
        </p>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Nieuwe template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Template bewerken" : "Nieuwe e-mailtemplate"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Naam</Label>
                  <Input value={form.naam} onChange={(e) => setForm({ ...form, naam: e.target.value })} placeholder="bijv. Offerte standaard" className="mt-1" />
                </div>
                <div>
                  <Label>Onderwerp</Label>
                  <Input value={form.onderwerp} onChange={(e) => setForm({ ...form, onderwerp: e.target.value })} placeholder="bijv. Offerte {{offertenummer}}" className="mt-1" />
                </div>
              </div>
              <div>
                <Label>HTML-body</Label>
                <Textarea
                  value={form.html_body}
                  onChange={(e) => setForm({ ...form, html_body: e.target.value })}
                  rows={14}
                  className="mt-1 font-mono text-xs"
                  placeholder="Schrijf uw HTML e-mailtemplate..."
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch checked={form.standaard} onCheckedChange={(v) => setForm({ ...form, standaard: v })} />
                  <Label>Standaard template voor offertes</Label>
                </div>
                <Button variant="outline" size="sm" onClick={() => handlePreview(form.html_body)} className="gap-2">
                  <Eye className="h-3.5 w-3.5" />Voorbeeld
                </Button>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Beschikbare variabelen:</p>
                <p><code>{"{{klant_naam}}"}</code> · <code>{"{{offertenummer}}"}</code> · <code>{"{{totaal_bedrag}}"}</code> · <code>{"{{geldig_tot}}"}</code> · <code>{"{{bedrijfsnaam}}"}</code></p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Annuleren</Button>
                <Button onClick={handleSave}>{editingId ? "Bijwerken" : "Opslaan"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Voorbeeld</DialogTitle></DialogHeader>
          <div className="border rounded-xl p-4" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </DialogContent>
      </Dialog>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Onderwerp</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Standaard</TableHead>
                <TableHead>Aangemaakt</TableHead>
                <TableHead className="w-[100px]">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Laden...</TableCell></TableRow>
              ) : templates.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nog geen templates. Maak er een aan om offertemails aan te passen.
                </TableCell></TableRow>
              ) : (
                templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.naam}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{t.onderwerp}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{t.type}</Badge></TableCell>
                    <TableCell>
                      {t.standaard && (
                        <Badge className="bg-amber-100 text-amber-800 gap-1"><Star className="h-3 w-3" />Standaard</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(t.created_at), "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handlePreview(t.html_body)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTemplates;
