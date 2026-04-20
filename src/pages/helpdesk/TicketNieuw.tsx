import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateTicket } from "@/hooks/helpdesk/useTickets";

export default function TicketNieuw() {
  const nav = useNavigate();
  const { user, profile } = useAuth();
  const [params] = useSearchParams();
  const create = useCreateTicket();

  const [titel, setTitel] = useState("");
  const [omschrijving, setOmschrijving] = useState("");
  const [type, setType] = useState("vraag");
  const [prioriteit, setPrioriteit] = useState("normaal");
  const [kanaal, setKanaal] = useState("telefoon");
  const [productCategorie, setProductCategorie] = useState("");
  const [productMerk, setProductMerk] = useState("");
  const [foutcode, setFoutcode] = useState("");

  const bron = (params.get("bron") as "order" | "installatie" | "factuur" | "klant" | null) ?? "direct";
  const klantId = params.get("klant_id");
  const opdrachtId = params.get("opdracht_id");
  const installatieId = params.get("installatie_id");
  const factuurId = params.get("factuur_id");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.partner_id) return;
    const t = await create.mutateAsync({
      partner_id: profile.partner_id,
      gemaakt_door: user.id,
      titel,
      omschrijving: omschrijving || null,
      type,
      prioriteit,
      kanaal,
      bron_locatie: bron,
      klant_id: klantId,
      opdracht_id: opdrachtId,
      installatie_id: installatieId,
      factuur_id: factuurId,
      product_categorie: productCategorie || null,
      product_merk: productMerk || null,
      foutcode: foutcode || null,
    });
    nav(`/helpdesk/tickets/${t.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nieuw ticket</h1>
        <p className="text-sm text-muted-foreground">Leg een vraag, klacht, storing of service-bezoek vast</p>
      </div>

      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="titel">Titel *</Label>
              <Input id="titel" required value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Korte omschrijving" />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vraag">Vraag</SelectItem>
                  <SelectItem value="klacht">Klacht</SelectItem>
                  <SelectItem value="storing">Storing</SelectItem>
                  <SelectItem value="service_bezoek">Service-bezoek</SelectItem>
                  <SelectItem value="overig">Overig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioriteit</Label>
              <Select value={prioriteit} onValueChange={setPrioriteit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="laag">Laag</SelectItem>
                  <SelectItem value="normaal">Normaal</SelectItem>
                  <SelectItem value="hoog">Hoog</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kanaal</Label>
              <Select value={kanaal} onValueChange={setKanaal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="telefoon">Telefoon</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="webformulier">Webformulier</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                  <SelectItem value="monteur">Monteur</SelectItem>
                  <SelectItem value="overig">Overig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat">Productcategorie</Label>
              <Input id="cat" value={productCategorie} onChange={(e) => setProductCategorie(e.target.value)} placeholder="Bijv. thuisbatterij" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="merk">Merk</Label>
              <Input id="merk" value={productMerk} onChange={(e) => setProductMerk(e.target.value)} placeholder="Bijv. Enphase" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fc">Foutcode</Label>
              <Input id="fc" value={foutcode} onChange={(e) => setFoutcode(e.target.value)} placeholder="Optioneel" />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="oms">Omschrijving</Label>
              <Textarea id="oms" rows={5} value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} placeholder="Wat is er aan de hand?" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => nav("/helpdesk/tickets")}>Annuleren</Button>
            <Button type="submit" disabled={create.isPending || !titel}>
              {create.isPending ? "Bezig…" : "Ticket aanmaken"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}