import type { TourElementType, TourStep } from "./types";

const ROL_SELECTORS: Record<TourElementType, string> = {
  button: "button, [role='button'], a[href]",
  link: "a[href], [role='link']",
  input: "input, textarea, select, [contenteditable='true'], [role='combobox']",
  any: "button, a[href], input, textarea, select, [role='button'], [role='tab'], [role='menuitem']",
};

function zichtbaar(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  const style = window.getComputedStyle(el);
  return style.visibility !== "hidden" && style.display !== "none" && style.opacity !== "0";
}

function eersteZichtbare(nodes: Iterable<Element>): HTMLElement | null {
  for (const el of nodes) {
    if (el instanceof HTMLElement && zichtbaar(el)) return el;
  }
  return null;
}

function viaAnchor(anchor: string): HTMLElement | null {
  const escaped = anchor.replace(/"/g, '\\"');
  return eersteZichtbare(document.querySelectorAll(`[data-tour="${escaped}"]`));
}

function viaRoute(route: string): HTMLElement | null {
  const escaped = route.replace(/"/g, '\\"');
  return eersteZichtbare(document.querySelectorAll(`a[href="${escaped}"], a[href$="${escaped}"]`));
}

function tekstVanElement(el: Element): string {
  const label = el.getAttribute("aria-label") ?? "";
  return `${label} ${el.textContent ?? ""}`.toLowerCase().replace(/\s+/g, " ").trim();
}

function viaTekst(tekst: string, type: TourElementType): HTMLElement | null {
  const naald = tekst.toLowerCase().trim();
  if (!naald) return null;
  const kandidaten = Array.from(document.querySelectorAll(ROL_SELECTORS[type]));
  const exact = kandidaten.filter((el) => tekstVanElement(el) === naald);
  const bevat = kandidaten.filter((el) => tekstVanElement(el).includes(naald));
  const placeholder = type === "input"
    ? kandidaten.filter((el) => (el.getAttribute("placeholder") ?? "").toLowerCase().includes(naald))
    : [];
  return eersteZichtbare([...exact, ...bevat, ...placeholder]);
}

/**
 * Zoekt het element van een tutorialstap. Probeert achtereenvolgens het anker,
 * de zichtbare tekst en (voor navigatiestappen) de route als href.
 */
export function resolveTarget(step: TourStep): HTMLElement | null {
  if (step.anchor) {
    const viaAnker = viaAnchor(step.anchor);
    if (viaAnker) return viaAnker;
  }
  if (step.textMatch) {
    const viaLabel = viaTekst(step.textMatch, step.elementType ?? "any");
    if (viaLabel) return viaLabel;
  }
  if (step.route && step.wacht === "klik") return viaRoute(step.route);
  return null;
}
