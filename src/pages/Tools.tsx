import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Battery, Zap, ArrowRight, Globe, MessageSquare, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const adviesTools = [
  {
    title: "Energieadvies",
    description: "Uitgebreide wizard voor het opstellen van een energieadvies op basis van woningsituatie, verbruik en wensen.",
    icon: Zap,
    path: "/tools/energieadvies",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "Thuisbatterij Selector",
    description: "Selecteer de ideale thuisbatterij op basis van zonnepanelen, verbruik, contract en klantvoorkeuren.",
    icon: Battery,
    path: "/tools/thuisbatterij",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
];

const webTools = [
  {
    title: "Webtools beheer",
    description: "Maak en beheer embeddable contactformulieren en besparingscalculatoren voor uw website — in uw eigen huisstijl.",
    icon: Globe,
    path: "/tools/webtools",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

const ToolCard = ({ tool, onClick }: { tool: typeof adviesTools[0]; onClick: () => void }) => (
  <Card
    className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
    onClick={onClick}
  >
    <CardHeader className="pb-3">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${tool.bgColor}`}>
          <tool.icon className={`h-6 w-6 ${tool.color}`} />
        </div>
        <div className="flex-1">
          <CardTitle className="text-lg">{tool.title}</CardTitle>
          <CardDescription className="mt-1">{tool.description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <Button variant="ghost" className="rounded-[40px] gap-2 group-hover:text-primary transition-colors">
        Openen <ArrowRight className="h-4 w-4" />
      </Button>
    </CardContent>
  </Card>
);

const Tools = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Tools</h1>
        <p className="text-muted-foreground mt-1">Adviestools en webtools voor uw dagelijkse werkzaamheden</p>
      </div>

      <div>
        <h2 className="text-lg font-medium text-foreground mb-4">Adviestools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adviesTools.map(tool => (
            <ToolCard key={tool.path} tool={tool} onClick={() => navigate(tool.path)} />
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-lg font-medium text-foreground mb-4">Webtools</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Embeddable widgets voor uw website: contactformulieren en besparingscalculatoren die automatisch leads aanmaken.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {webTools.map(tool => (
            <ToolCard key={tool.path} tool={tool} onClick={() => navigate(tool.path)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tools;
