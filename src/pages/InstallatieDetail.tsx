import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInstallatie } from "@/components/installaties/useInstallatie";
import { useAuth } from "@/contexts/AuthContext";
import InstallatieHeader from "@/components/installaties/InstallatieHeader";
import InstallatiePlanningCard from "@/components/installaties/InstallatiePlanningCard";
import InstallatieKlantCard from "@/components/installaties/InstallatieKlantCard";
import InstallatieProductenCard from "@/components/installaties/InstallatieProductenCard";
import InstallatieSchouwCard from "@/components/installaties/InstallatieSchouwCard";
import InstallatieWoninggegevensTab from "@/components/installaties/InstallatieWoninggegevensTab";
import InstallatieNotitiesTab from "@/components/installaties/InstallatieNotitiesTab";
import InstallatieCommunicatieTab from "@/components/installaties/InstallatieCommunicatieTab";
import InstallatieHistorieTab from "@/components/installaties/InstallatieHistorieTab";
import InstallatieGereedheidsCard from "@/components/installaties/InstallatieGereedheidsCard";
import InstallatieWerkvoorbereidingTab from "@/components/installaties/InstallatieWerkvoorbereidingTab";
import WaarschuwingBalk from "@/components/installaties/WaarschuwingBalk";
import EntiteitHistorieTab from "@/components/historie/EntiteitHistorieTab";
import InstallatieActieBalk from "@/components/installaties/InstallatieActieBalk";
import InstallatieTijdlijn from "@/components/installaties/InstallatieTijdlijn";
import InstallatieDocumentatieCard from "@/components/installaties/InstallatieDocumentatieCard";
import SerienummerEditor from "@/components/serienummers/SerienummerEditor";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import RetourDialog from "@/components/retouren/RetourDialog";

const InstallatieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: installatie, isLoading, refetch } = useInstallatie(id);
  const [tab, setTab] = useState("overzicht");
  const [retourOpen, setRetourOpen] = useState(false);
  const isInstallateur = profile?.rol === "installateur";

  if (isLoading) return <div className="p-6 text-muted-foreground">Laden...</div>;
  if (!installatie) return <div className="p-6 text-muted-foreground">Installatie niet gevonden</div>;

  const naarOplevering = () => {
    const params = new URLSearchParams({ installatie: installatie.id });
    if (installatie.klant_id) params.set("klant", installatie.klant_id);
    if (installatie.installateur_id) params.set("monteur", installatie.installateur_id);
    navigate(`/opleveringen/nieuw?${params.toString()}`);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <InstallatieHeader installatie={installatie} onMaakOplevering={naarOplevering} onChanged={refetch} />
      <WaarschuwingBalk installatie={installatie} />
      {!isInstallateur && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setRetourOpen(true)} className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> Retour aanmelden
          </Button>
        </div>
      )}
      {isInstallateur && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => navigate(`/installaties/${installatie.id}/werk`)} className="gap-1.5">
            Werkscherm openen
          </Button>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
          <TabsTrigger value="woning">Woninggegevens</TabsTrigger>
          {!isInstallateur && <TabsTrigger value="planning">Planning</TabsTrigger>}
          {!isInstallateur && <TabsTrigger value="werkvoorbereiding">Werkvoorbereiding</TabsTrigger>}
          <TabsTrigger value="producten">Producten</TabsTrigger>
          <TabsTrigger value="serienummers">Serienummers</TabsTrigger>
          <TabsTrigger value="notities">Notities</TabsTrigger>
          {!isInstallateur && <TabsTrigger value="communicatie">Communicatie</TabsTrigger>}
          <TabsTrigger value="historie">Historie</TabsTrigger>
        </TabsList>

        <TabsContent value="overzicht" className="space-y-4">
          <InstallatieActieBalk installatie={installatie} onMaakOplevering={naarOplevering} />
          <InstallatieGereedheidsCard installatie={installatie} />
          <InstallatieTijdlijn installatie={installatie} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InstallatieKlantCard installatie={installatie} />
            <InstallatiePlanningCard installatie={installatie} onChanged={refetch} readOnly />
          </div>
          <InstallatieSchouwCard installatie={installatie} />
          <InstallatieProductenCard installatie={installatie} onChanged={refetch} />
          <InstallatieDocumentatieCard installatieId={installatie.id} />
        </TabsContent>

        <TabsContent value="woning">
          <InstallatieWoninggegevensTab installatie={installatie} />
        </TabsContent>

        {!isInstallateur && (
          <TabsContent value="planning">
            <InstallatiePlanningCard installatie={installatie} onChanged={refetch} />
          </TabsContent>
        )}

        {!isInstallateur && (
          <TabsContent value="werkvoorbereiding">
            <InstallatieWerkvoorbereidingTab installatie={installatie} />
          </TabsContent>
        )}

        <TabsContent value="producten">
          <InstallatieProductenCard installatie={installatie} onChanged={refetch} />
        </TabsContent>

        <TabsContent value="serienummers">
          <SerienummerEditor
            installatieId={installatie.id}
            partnerId={installatie.partner_id}
            opdrachtId={installatie.opdracht_id ?? null}
            klantId={installatie.klant_id ?? null}
            regels={(installatie.producten as any[] | undefined)?.map((p) => ({
              omschrijving: p.omschrijving ?? p.naam ?? "",
              aantal: Number(p.aantal ?? 1),
            })) ?? []}
          />
        </TabsContent>

        <TabsContent value="notities">
          <InstallatieNotitiesTab installatieId={installatie.id} partnerId={installatie.partner_id} />
        </TabsContent>

        {!isInstallateur && (
          <TabsContent value="communicatie">
            <InstallatieCommunicatieTab installatie={installatie} onChanged={refetch} />
          </TabsContent>
        )}

        <TabsContent value="historie" className="space-y-4">
          <InstallatieHistorieTab installatieId={installatie.id} />
          <EntiteitHistorieTab entiteitType="installatie" entiteitId={installatie.id} titel="Volledige tijdlijn" />
        </TabsContent>
      </Tabs>

      <RetourDialog
        open={retourOpen}
        onOpenChange={setRetourOpen}
        defaultType="klant_retour"
        context={{
          installatie_id: installatie.id,
          opdracht_id: installatie.opdracht_id ?? undefined,
          klant_id: installatie.klant_id ?? undefined,
          suggestRegels: (installatie.producten as any[] | undefined)?.map((p) => ({
            omschrijving: p.omschrijving ?? p.naam ?? "",
            aantal: Number(p.aantal ?? 1),
          })),
        }}
      />
    </div>
  );
};

export default InstallatieDetail;