import type { AppDefinition } from "@/lib/dashboard/apps";

export type LayoutItem =
  | { id: string; type: "app" }
  | { id: string; type: "folder"; naam: string; apps: string[] };

export interface AppsLayout {
  items: LayoutItem[];
  favorieten: string[];
  verborgen: string[];
  widgetsZichtbaar: boolean;
}

export const LEGE_LAYOUT: AppsLayout = {
  items: [],
  favorieten: [],
  verborgen: [],
  widgetsZichtbaar: true,
};

/** Bereken een default-layout op basis van beschikbare apps voor de rol. */
export function defaultLayout(beschikbareApps: AppDefinition[]): AppsLayout {
  return {
    items: beschikbareApps.map((app) => ({ id: app.id, type: "app" })),
    favorieten: [],
    verborgen: [],
    widgetsZichtbaar: true,
  };
}

/** Voeg ontbrekende apps toe aan een bestaande layout (bv. nieuwe rol-rechten). */
export function syncMetBeschikbareApps(
  layout: AppsLayout,
  beschikbareApps: AppDefinition[],
): AppsLayout {
  const beschikbareIds = new Set(beschikbareApps.map((a) => a.id));
  const aanwezigeIds = new Set<string>();

  // Verwijder apps die niet meer beschikbaar zijn (rol gewijzigd)
  const items: LayoutItem[] = [];
  for (const item of layout.items) {
    if (item.type === "app") {
      if (beschikbareIds.has(item.id)) {
        items.push(item);
        aanwezigeIds.add(item.id);
      }
    } else {
      const apps = item.apps.filter((id) => beschikbareIds.has(id));
      apps.forEach((id) => aanwezigeIds.add(id));
      if (apps.length > 0) {
        items.push({ ...item, apps });
      }
    }
  }

  // Voeg nieuwe apps toe aan einde
  for (const app of beschikbareApps) {
    if (!aanwezigeIds.has(app.id) && !layout.verborgen.includes(app.id)) {
      items.push({ id: app.id, type: "app" });
    }
  }

  // Schoon favorieten/verborgen op
  const favorieten = layout.favorieten.filter((id) => beschikbareIds.has(id));
  const verborgen = layout.verborgen.filter((id) => beschikbareIds.has(id));

  return { ...layout, items, favorieten, verborgen };
}

/** Verplaats een item van index a naar index b in de items-array. */
export function moveItem(layout: AppsLayout, fromId: string, toId: string): AppsLayout {
  const fromIdx = layout.items.findIndex((i) => i.id === fromId);
  const toIdx = layout.items.findIndex((i) => i.id === toId);
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return layout;
  const items = [...layout.items];
  const [moved] = items.splice(fromIdx, 1);
  items.splice(toIdx, 0, moved);
  return { ...layout, items };
}

/** Maak een nieuwe map van twee app-tegels. */
export function maakFolder(layout: AppsLayout, app1Id: string, app2Id: string, naam = "Map"): AppsLayout {
  const app1Idx = layout.items.findIndex((i) => i.id === app1Id);
  const app2Idx = layout.items.findIndex((i) => i.id === app2Id);
  if (app1Idx === -1 || app2Idx === -1 || app1Id === app2Id) return layout;
  const items = [...layout.items];
  const folderId = `folder-${Date.now()}`;
  // Verwijder beide originele items
  const indices = [app1Idx, app2Idx].sort((a, b) => b - a);
  indices.forEach((idx) => items.splice(idx, 1));
  // Plaats folder op positie van het eerste item
  const targetIdx = Math.min(app1Idx, app2Idx);
  items.splice(targetIdx, 0, {
    id: folderId,
    type: "folder",
    naam,
    apps: [app1Id, app2Id],
  });
  return { ...layout, items };
}

/** Voeg een app toe aan een bestaande map. */
export function voegToeAanFolder(layout: AppsLayout, appId: string, folderId: string): AppsLayout {
  const appIdx = layout.items.findIndex((i) => i.id === appId);
  const folderIdx = layout.items.findIndex((i) => i.id === folderId);
  if (appIdx === -1 || folderIdx === -1) return layout;
  const folder = layout.items[folderIdx];
  if (folder.type !== "folder") return layout;
  if (folder.apps.includes(appId)) return layout;
  const items = [...layout.items];
  items.splice(appIdx, 1);
  const newFolderIdx = items.findIndex((i) => i.id === folderId);
  items[newFolderIdx] = { ...folder, apps: [...folder.apps, appId] };
  return { ...layout, items };
}

/** Haal een app uit een map. Lege mappen worden verwijderd. */
export function haalUitFolder(layout: AppsLayout, appId: string, folderId: string): AppsLayout {
  const folderIdx = layout.items.findIndex((i) => i.id === folderId);
  if (folderIdx === -1) return layout;
  const folder = layout.items[folderIdx];
  if (folder.type !== "folder") return layout;
  const apps = folder.apps.filter((id) => id !== appId);
  const items = [...layout.items];
  if (apps.length === 0) {
    items.splice(folderIdx, 1);
    items.push({ id: appId, type: "app" });
  } else if (apps.length === 1) {
    // Klap map open: vervang door losse app, en zet andere los achter
    items.splice(folderIdx, 1, { id: apps[0], type: "app" });
    items.push({ id: appId, type: "app" });
  } else {
    items[folderIdx] = { ...folder, apps };
    items.push({ id: appId, type: "app" });
  }
  return { ...layout, items };
}

export function hernoemFolder(layout: AppsLayout, folderId: string, naam: string): AppsLayout {
  const items = layout.items.map((item) =>
    item.id === folderId && item.type === "folder" ? { ...item, naam } : item,
  );
  return { ...layout, items };
}

export function toggleFavoriet(layout: AppsLayout, appId: string): AppsLayout {
  const isFav = layout.favorieten.includes(appId);
  return {
    ...layout,
    favorieten: isFav
      ? layout.favorieten.filter((id) => id !== appId)
      : [...layout.favorieten, appId],
  };
}

export function verbergApp(layout: AppsLayout, appId: string): AppsLayout {
  const items = layout.items
    .map((item) => {
      if (item.type === "folder") {
        return { ...item, apps: item.apps.filter((id) => id !== appId) };
      }
      return item;
    })
    .filter((item) => {
      if (item.type === "folder" && item.apps.length === 0) return false;
      if (item.type === "app" && item.id === appId) return false;
      return true;
    });
  return {
    ...layout,
    items,
    favorieten: layout.favorieten.filter((id) => id !== appId),
    verborgen: layout.verborgen.includes(appId) ? layout.verborgen : [...layout.verborgen, appId],
  };
}

export function toonApp(layout: AppsLayout, appId: string): AppsLayout {
  if (!layout.verborgen.includes(appId)) return layout;
  return {
    ...layout,
    items: [...layout.items, { id: appId, type: "app" }],
    verborgen: layout.verborgen.filter((id) => id !== appId),
  };
}
