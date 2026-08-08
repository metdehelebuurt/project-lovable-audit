/** Gedeelde typen voor de interactieve AI-tutorials. */

export type TourWacht = "klik" | "invoer" | "lezen";
export type TourElementType = "button" | "link" | "input" | "any";

export interface TourStep {
  id: string;
  /** Route waar de stap zich afspeelt. Leeg = huidige pagina. */
  route?: string;
  /** Anker-id uit de registry (data-tour attribuut). */
  anchor?: string;
  /** Zichtbare tekst van het element, gebruikt als er geen anker is. */
  textMatch?: string;
  elementType?: TourElementType;
  titel: string;
  uitleg: string;
  wacht: TourWacht;
}

export interface TourPlan {
  titel: string;
  samenvatting: string;
  stappen: TourStep[];
}
