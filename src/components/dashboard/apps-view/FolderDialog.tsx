import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Pencil, Check } from "lucide-react";
import { appById } from "@/lib/dashboard/apps";
import { AppTile } from "./AppTile";
import type { LayoutItem } from "./layoutHelpers";

interface FolderDialogProps {
  folder: Extract<LayoutItem, { type: "folder" }> | null;
  badges: Record<string, number>;
  onClose: () => void;
  onRename: (folderId: string, naam: string) => void;
  onRemoveApp: (appId: string, folderId: string) => void;
}

export function FolderDialog({ folder, badges, onClose, onRename, onRemoveApp }: FolderDialogProps) {
  const navigate = useNavigate();
  const [bewerkNaam, setBewerkNaam] = useState(false);
  const [naam, setNaam] = useState(folder?.naam ?? "");

  if (!folder) return null;

  const apps = folder.apps.map((id) => appById(id)).filter(Boolean);

  const handleSaveNaam = () => {
    if (naam.trim()) onRename(folder.id, naam.trim());
    setBewerkNaam(false);
  };

  return (
    <Dialog open={!!folder} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {bewerkNaam ? (
              <>
                <Input
                  value={naam}
                  onChange={(e) => setNaam(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveNaam()}
                  className="h-8 max-w-[260px]"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleSaveNaam}>
                  <Check className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <span>{folder.naam}</span>
                <Button size="sm" variant="ghost" onClick={() => { setNaam(folder.naam); setBewerkNaam(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-4">
          {apps.map((app) => (
            app && (
              <AppTile
                key={app.id}
                app={app}
                badgeCount={badges[app.id] ?? 0}
                onClick={() => { navigate(app.url); onClose(); }}
                editMode={false}
              />
            )
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
          {apps.map((app) => app && (
            <Button
              key={`rm-${app.id}`}
              size="sm"
              variant="outline"
              onClick={() => onRemoveApp(app.id, folder.id)}
            >
              {app.label} uit map
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
