import { useMemo, useState } from "react";
import { useModuleNotificatieCounts } from "@/hooks/useModuleNotificatieCounts";
import { useAppsLayout } from "./useAppsLayout";
import { AppGrid } from "./AppGrid";
import { WelkomBlok } from "./WelkomBlok";
import { WidgetsRow } from "./WidgetsRow";
import { EditModeBar } from "./EditModeBar";
import { AlleAppsDrawer } from "./AlleAppsDrawer";
import { FolderDialog } from "./FolderDialog";
import { SpotlightZoek } from "./SpotlightZoek";
import { toggleFavoriet, verbergApp, toonApp, hernoemFolder, haalUitFolder, type LayoutItem } from "./layoutHelpers";
import { appById } from "@/lib/dashboard/apps";
import { AppTile } from "./AppTile";
import { useNavigate } from "react-router-dom";

interface AppsViewProps {
  rightSlot?: React.ReactNode;
}

export function AppsView({ rightSlot }: AppsViewProps) {
  const navigate = useNavigate();
  const { layout, setLayout, beschikbareApps, hydrated } = useAppsLayout();
  const { data: counts = {} } = useModuleNotificatieCounts();
  const [editMode, setEditMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openFolder, setOpenFolder] = useState<Extract<LayoutItem, { type: "folder" }> | null>(null);

  // Bouw badge-map per app-id op basis van entity_type uit notificaties
  const badges = useMemo(() => {
    const map: Record<string, number> = {};
    for (const app of beschikbareApps) {
      if (app.badgeEntiteit) {
        map[app.id] = counts[app.badgeEntiteit] ?? 0;
      }
    }
    return map;
  }, [beschikbareApps, counts]);

  const favorietenApps = layout.favorieten
    .map((id) => appById(id))
    .filter((a): a is NonNullable<ReturnType<typeof appById>> => !!a);

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-muted/50 rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 md:grid-cols-6 xl:grid-cols-8 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-3xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative -mx-4 -my-4 sm:-mx-6 sm:-my-6 px-4 py-6 sm:px-6 sm:py-8 min-h-[calc(100vh-8rem)]"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at top, hsl(var(--primary) / 0.06), transparent 60%), radial-gradient(ellipse at bottom right, hsl(var(--primary) / 0.04), transparent 50%)",
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <WelkomBlok />
        <div className="flex items-center gap-2 flex-wrap">
          <SpotlightZoek apps={beschikbareApps} />
          <EditModeBar
            editMode={editMode}
            onToggle={() => setEditMode((v) => !v)}
            onOpenAlleApps={() => setDrawerOpen(true)}
          />
          {rightSlot}
        </div>
      </div>

      {layout.widgetsZichtbaar && !editMode && (
        <div className="mb-8">
          <WidgetsRow />
        </div>
      )}

      {favorietenApps.length > 0 && (
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground/70 font-semibold mb-3">
            Favorieten
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-6">
            {favorietenApps.map((app) => (
              <AppTile
                key={`fav-${app.id}`}
                app={app}
                badgeCount={badges[app.id] ?? 0}
                isFavoriet
                onClick={() => navigate(app.url)}
                onToggleFavoriet={() => setLayout((prev) => toggleFavoriet(prev, app.id))}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground/70 font-semibold mb-3">
          Alle apps
        </p>
        <AppGrid
          layout={layout}
          setLayout={setLayout}
          badges={badges}
          editMode={editMode}
          onOpenFolder={(f) => setOpenFolder(f)}
          onToggleFavoriet={(id) => setLayout((prev) => toggleFavoriet(prev, id))}
          onHide={(id) => setLayout((prev) => verbergApp(prev, id))}
        />
      </div>

      <AlleAppsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        apps={beschikbareApps}
        verborgenIds={layout.verborgen}
        onShow={(id) => setLayout((prev) => toonApp(prev, id))}
        onHide={(id) => setLayout((prev) => verbergApp(prev, id))}
      />

      <FolderDialog
        folder={openFolder}
        badges={badges}
        onClose={() => setOpenFolder(null)}
        onRename={(folderId, naam) => setLayout((prev) => hernoemFolder(prev, folderId, naam))}
        onRemoveApp={(appId, folderId) => {
          setLayout((prev) => haalUitFolder(prev, appId, folderId));
          setOpenFolder(null);
        }}
      />
    </div>
  );
}
