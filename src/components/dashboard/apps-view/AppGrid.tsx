import { useState } from "react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import { SortableContext, useSortable, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import { appById, type AppDefinition } from "@/lib/dashboard/apps";
import { AppTile } from "./AppTile";
import { FolderTile } from "./FolderTile";
import type { AppsLayout, LayoutItem } from "./layoutHelpers";
import { moveItem, maakFolder, voegToeAanFolder } from "./layoutHelpers";

interface AppGridProps {
  layout: AppsLayout;
  setLayout: (updater: (prev: AppsLayout) => AppsLayout) => void;
  badges: Record<string, number>;
  editMode: boolean;
  onOpenFolder: (folder: Extract<LayoutItem, { type: "folder" }>) => void;
  onToggleFavoriet: (appId: string) => void;
  onHide: (appId: string) => void;
}

function SortableTile({ item, badges, editMode, onOpen, onToggleFavoriet, onHide, isFavoriet }: {
  item: LayoutItem; badges: Record<string, number>; editMode: boolean;
  onOpen: () => void; onToggleFavoriet?: () => void; onHide?: () => void; isFavoriet?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  if (item.type === "folder") {
    return (
      <FolderTile
        ref={setNodeRef}
        folder={item}
        editMode={editMode}
        onClick={onOpen}
        dragHandleProps={{ ...attributes, ...listeners }}
        style={style}
        isDragging={isDragging}
      />
    );
  }
  const app = appById(item.id);
  if (!app) return null;
  return (
    <AppTile
      ref={setNodeRef}
      app={app}
      badgeCount={badges[item.id] ?? 0}
      editMode={editMode}
      isFavoriet={isFavoriet}
      onClick={onOpen}
      onToggleFavoriet={onToggleFavoriet}
      onHide={onHide}
      dragHandleProps={{ ...attributes, ...listeners }}
      style={style}
      isDragging={isDragging}
    />
  );
}

export function AppGrid({ layout, setLayout, badges, editMode, onOpenFolder, onToggleFavoriet, onHide }: AppGridProps) {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const overItem = layout.items.find((i) => i.id === overId);
    const activeItem = layout.items.find((i) => i.id === activeId);
    if (!overItem || !activeItem) return;

    // Drop app op bestaande folder => toevoegen aan folder
    if (overItem.type === "folder" && activeItem.type === "app") {
      setLayout((prev) => voegToeAanFolder(prev, activeId, overId));
      return;
    }
    // Drop app op andere app => maak nieuwe folder (alleen in edit mode)
    if (editMode && overItem.type === "app" && activeItem.type === "app") {
      setLayout((prev) => maakFolder(prev, activeId, overId, "Nieuwe map"));
      return;
    }
    // Anders: herorden
    setLayout((prev) => moveItem(prev, activeId, overId));
  };

  const activeItem = activeId ? layout.items.find((i) => i.id === activeId) : null;
  const activeApp = activeItem?.type === "app" ? appById(activeItem.id) : null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={layout.items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-6">
          {layout.items.map((item) => (
            <SortableTile
              key={item.id}
              item={item}
              badges={badges}
              editMode={editMode}
              isFavoriet={item.type === "app" && layout.favorieten.includes(item.id)}
              onOpen={() => {
                if (item.type === "folder") return onOpenFolder(item);
                const app = appById(item.id);
                if (app) navigate(app.url);
              }}
              onToggleFavoriet={item.type === "app" ? () => onToggleFavoriet(item.id) : undefined}
              onHide={item.type === "app" ? () => onHide(item.id) : undefined}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeApp && <AppTile app={activeApp} badgeCount={badges[activeApp.id] ?? 0} isOverlay />}
        {activeItem?.type === "folder" && <FolderTile folder={activeItem} isOverlay />}
      </DragOverlay>
    </DndContext>
  );
}
