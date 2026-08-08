import type { Rect } from "./useElementWatcher";

const PADDING = 6;

/** Dimt de pagina en laat één element oplichten. Vangt geen kliks af. */
export function TourSpotlight({ rect }: { rect: Rect | null }) {
  if (!rect) {
    return <div className="pointer-events-none fixed inset-0 z-[90] bg-foreground/30" aria-hidden />;
  }
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[90] rounded-lg ring-2 ring-primary transition-all duration-200"
      style={{
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
        boxShadow: "0 0 0 9999px hsl(var(--foreground) / 0.45)",
      }}
    />
  );
}
