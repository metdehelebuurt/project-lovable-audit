import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Truck, ShieldCheck, Mail } from "lucide-react";
import {
  useInkoopInstellingen, useSaveInkoopInstellingen, type InkoopInstellingen,
} from "@/hooks/inkoop/useInkoopInstellingen";

interface Props { partnerId: string }

export default function InkoopInstellingenForm({ partnerId }: Props) {
  const { data, isLoading } = useInkoopInstellingen(partnerId);
  const save = useSaveInkoopInstellingen(partnerId);

  const [form, setForm] = useState<InkoopInstellingen | null>(null);

  useEffect(() => { if (data) setForm(data); }, [data]);

  if (isLoading || !form) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const update = <K extends keyof InkoopInstellingen>(key: K, value: InkoopInstellingen[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const updateAdres = (key: "straat" | "postcode" | "plaats" | "land", value: string) =>
    setForm((prev) => prev ? {
      ...prev,
      leveringsadres: { ...(prev.leveringsadres ?? {}), [key]: value },
    } : prev);

  const onSave = () => save.mutate(form);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5" /> Goedkeuringsregels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Wanneer is goedkeuring vereist?</Label>
            <Select
              value={form.goedkeuring_modus}
              onValueChange={(v) => update("goedkeuring_modus", v as InkoopInstellingen["goedkeuring_modus"])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="geen">Nooit — direct verzenden</SelectItem>
                <SelectItem value="drempel">Bij drempelbedrag</SelectItem>
                <SelectItem value="altijd">Altijd (4-ogen-principe)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Bij goedkeuring kan een andere gebruiker de order vrijgeven voordat hij naar de leverancier gaat.
            </p>
          </div>

          {form.goedkeuring_modus === "drempel" && (
            <div className="space-y-2 max-w-xs">
              <Label>Drempelbedrag (€, incl. BTW)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.goedkeuring_drempel_bedrag}
                onChange={(e) => update("goedkeuring_drempel_bedrag", parseFloat(e.target.value) || 0)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" /> Verzending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Verzendwijze</Label>
            <Select
              value={form.verzend_modus}
              onValueChange={(v) => update("verzend_modus", v as InkoopInstellingen["verzend_modus"])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="eigen_email">Vanuit eigen e-mail (Gmail/Outlook)</SelectItem>
                <SelectItem value="pdf_download">Alleen PDF downloaden</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              E-mailverzending gaat altijd vanuit de gekoppelde mailbox van de ingelogde gebruiker — nooit via een
              algemeen platform-adres.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t">
            <div>
              <Label>Vereist leveranciersbevestiging</Label>
              <p className="text-xs text-muted-foreground">
                Order blijft "verzonden" totdat de leverancier de leverdatum bevestigt.
              </p>
            </div>
            <Switch
              checked={form.vereist_leverancier_bevestiging}
              onCheckedChange={(v) => update("vereist_leverancier_bevestiging", v)}
            />
          </div>

          <div className="space-y-2">
            <Label>Standaard e-mailtekst (optioneel)</Label>
            <Textarea
              rows={4}
              value={form.standaard_email_template ?? ""}
              onChange={(e) => update("standaard_email_template", e.target.value || null)}
              placeholder="Beste {leverancier},&#10;&#10;Hierbij onze inkooporder als bijlage..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5" /> Logistiek & betaling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Automatische inkoopvoorstellen</Label>
              <p className="text-xs text-muted-foreground">
                Het systeem signaleert tekorten en lage voorraden en stelt orders voor.
              </p>
            </div>
            <Switch
              checked={form.auto_voorstellen}
              onCheckedChange={(v) => update("auto_voorstellen", v)}
            />
          </div>

          <div className="space-y-2 max-w-xs">
            <Label>Standaard betalingstermijn (dagen)</Label>
            <Input
              type="number"
              value={form.standaard_betalingstermijn_dagen}
              onChange={(e) => update("standaard_betalingstermijn_dagen", parseInt(e.target.value, 10) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label>Standaard leveringsadres</Label>
            <p className="text-xs text-muted-foreground">
              Wordt voorgesteld op nieuwe inkooporders. Per order overschrijfbaar.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Straat + nr.</Label>
                <Input
                  value={form.leveringsadres?.straat ?? ""}
                  onChange={(e) => updateAdres("straat", e.target.value)}
                  placeholder="Hoofdstraat 1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Plaats</Label>
                <Input
                  value={form.leveringsadres?.plaats ?? ""}
                  onChange={(e) => updateAdres("plaats", e.target.value)}
                  placeholder="Amsterdam"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Postcode</Label>
                <Input
                  value={form.leveringsadres?.postcode ?? ""}
                  onChange={(e) => updateAdres("postcode", e.target.value)}
                  placeholder="1011AB"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Land</Label>
                <Input
                  value={form.leveringsadres?.land ?? ""}
                  onChange={(e) => updateAdres("land", e.target.value)}
                  placeholder="Nederland"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Opslaan
        </Button>
      </div>
    </div>
  );
}
