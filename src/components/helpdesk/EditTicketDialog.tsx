import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateTicket, type HelpdeskTicket } from "@/hooks/helpdesk/useTickets";

type Props = {
  ticket: HelpdeskTicket;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export default function EditTicketDialog({ ticket, open, onOpenChange }: Props) {
  const update = useUpdateTicket();
  const [titel, setTitel] = useState(ticket.titel);
  const [omschrijving, setOmschrijving] = useState(ticket.omschrijving ?? "");
  const [type, setType] = useState(ticket.type);
  const [kanaal, setKanaal] = useState(ticket.kanaal);
  const [productCategorie, setProductCategorie] = useState(ticket.product_categorie ?? "");
  const [productMerk, setProductMerk] = useState(ticket.product_merk ?? "");
  const [productType, setProductType] = useState(ticket.product_type ?? "");
  const [installatiejaar, setInstallatiejaar] = useState<string>(
    ticket.product_installatiejaar?.toString() ?? "",
  );
  const [foutcode, setFoutcode] = useState(ticket.foutcode ?? "");
  const [geschatteDuur, setGeschatteDuur] = useState<string>(
    ticket.geschatte_duur_minuten?.toString() ?? "",
  );

  useEffect(() => {
    if (!open) return;
    setTitel(ticket.titel);
    setOmschrijving(ticket.omschrijving ?? "");
    setType(ticket.type);
    setKanaal(ticket.kanaal);
    setProductCategorie(ticket.product_categorie ?? "");
    setProductMerk(ticket.product_merk ?? "");
    setProductType(ticket.product_type ?? "");
    setInstallatiejaar(ticket.product_installatiejaar?.toString() ?? "");
    setFoutcode(ticket.foutcode ?? "");
    setGeschatteDuur(ticket.geschatte_duur_minuten?.toString() ?? "");
  }, [open, ticket]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await update.mutateAsync({
      id: ticket.id,
      titel: titel.trim(),
      omschrijving: omschrijving.trim() || null,
      type,
      kanaal,
      product_categorie: productCategorie.trim() || null,
      product_merk: productMerk.trim() || null,
      product_type: productType.trim() || null,
      product_installatiejaar: installatiejaar ? parseInt(installatiejaar, 10) : null,
      foutcode: foutcode.trim() || null,
      geschatte_duur_minuten: geschatteDuur ? parseInt(geschatteDuur, 10) : null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ticket bewerken</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titel">Titel</Label>
            <Input id="titel" value={titel} onChange={(e) => setTitel(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="omschrijving">Probleemomschrijving</Label>
            <Textarea id="omschrijving" rows={5} value={omschrijving} onChange={(e) => setOmschrijving(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vraag">Vraag</SelectItem>
                  <SelectItem value="storing">Storing</SelectItem>
                  <SelectItem value="klacht">Klacht</SelectItem>
                  <SelectItem value="onderhoud">Onderhoud</SelectItem>
                  <SelectItem value="garantie">Garantie</SelectItem>
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
                  <SelectItem value="portaal">Klantportaal</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cat">Productcategorie</Label>
              <Input id="cat" value={productCategorie} onChange={(e) => setProductCategorie(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merk">Merk</Label>
              <Input id="merk" value={productMerk} onChange={(e) => setProductMerk(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptype">Type / model</Label>
              <Input id="ptype" value={productType} onChange={(e) => setProductType(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jaar">Installatiejaar</Label>
              <Input id="jaar" type="number" min={1990} max={2100} value={installatiejaar} onChange={(e) => setInstallatiejaar(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fout">Foutcode</Label>
              <Input id="fout" value={foutcode} onChange={(e) => setFoutcode(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duur">Geschatte duur (minuten)</Label>
              <Input id="duur" type="number" min={0} value={geschatteDuur} onChange={(e) => setGeschatteDuur(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuleren</Button>
            <Button type="submit" disabled={update.isPending || !titel.trim()}>
              {update.isPending ? "Opslaan…" : "Opslaan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}