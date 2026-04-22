import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInstallatie } from "@/components/installaties/useInstallatie";
import InstallatieHeader from "@/components/installaties/InstallatieHeader";
import InstallatiePlanningCard from "@/components/installaties/InstallatiePlanningCard";
import InstallatieKlantCard from "@/components/installaties/InstallatieKlantCard";
import InstallatieProductenCard from "@/components/installaties/InstallatieProductenCard";
import InstallatieNotitiesTab from "@/components/installaties/InstallatieNotitiesTab";
import InstallatieCommunicatieTab from "@/components/installaties/InstallatieCommunicatieTab";
import InstallatieHistorieTab from "@/components/installaties/InstallatieHistorieTab";
import InstallatieActieBalk from "@/components/installaties/InstallatieActieBalk";
import InstallatieTijdlijn from "@/components/installaties/InstallatieTijdlijn";
import InstallatieDocumentatieCard from "@/components/installaties/InstallatieDocumentatieCard";
import SerienummerEditor from "@/components/serienummers/SerienummerEditor";

const InstallatieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: installatie, isLoading, refetch } = useInstallatie(id);
  const [tab, setTab] = useState("overzicht");

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
      <InstallatieHeader installatie={installatie} onMaakOplevering={naarOplevering} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="producten">Producten</TabsTrigger>
          <TabsTrigger value="serienummers">Serienummers</TabsTrigger>
          <TabsTrigger value="notities">Notities</TabsTrigger>
          <TabsTrigger value="communicatie">Communicatie</TabsTrigger>
          <TabsTrigger value="historie">Historie</TabsTrigger>
        </TabsList>

        <TabsContent value="overzicht" className="space-y-4">
          <InstallatieActieBalk installatie={installatie} onMaakOplevering={naarOplevering} />
          <InstallatieTijdlijn installatie={installatie} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InstallatieKlantCard installatie={installatie} />
            <InstallatiePlanningCard installatie={installatie} onChanged={refetch} readOnly />
          </div>
          <InstallatieProductenCard installatie={installatie} onChanged={refetch} />
          <InstallatieDocumentatieCard installatieId={installatie.id} />
        </TabsContent>

        <TabsContent value="planning">
          <InstallatiePlanningCard installatie={installatie} onChanged={refetch} />
        </TabsContent>

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

        <TabsContent value="communicatie">
          <InstallatieCommunicatieTab installatie={installatie} onChanged={refetch} />
        </TabsContent>

        <TabsContent value="historie">
          <InstallatieHistorieTab installatieId={installatie.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstallatieDetail;