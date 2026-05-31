export interface LatLng {
  lat: number;
  lng: number;
}

export type PaneelModus = "portret" | "landschap";

export interface Dakvlak {
  id: string;
  naam: string;
  polygon: LatLng[];
  orientatieDeg: number; // 0 = noord, 90 = oost
  hellingshoekDeg: number;
  modus: PaneelModus;
  margeMm: number;
}

export interface Paneel {
  id: string;
  dakvlakId: string;
  center: LatLng;
  rotatieDeg: number; // gelijk aan oriëntatie van dakvlak
  status: "auto" | "handmatig";
}

export interface PaneelProduct {
  id: string;
  naam: string;
  merk: string | null;
  breedteMm: number;
  lengteMm: number;
  wp: number;
}

export interface DaklayoutRecord {
  id: string;
  partner_id: string;
  gebruiker_id: string | null;
  schouw_id: string | null;
  lead_id: string | null;
  naam: string;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
  lat: number | null;
  lng: number | null;
  product_id: string | null;
  paneel_breedte_mm: number | null;
  paneel_lengte_mm: number | null;
  paneel_wp: number | null;
  dakvlakken: Dakvlak[];
  panelen: Paneel[];
  aantal_panelen: number;
  totaal_wp: number;
  snapshot_url: string | null;
  notities: string | null;
  created_at: string;
  updated_at: string;
}