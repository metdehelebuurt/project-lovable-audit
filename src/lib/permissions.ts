import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

/** Superadmin + partner_admin + backoffice — mogen administratie / financieel beheren */
export const ADMIN_TIER: AppRole[] = ["superadmin", "partner_admin", "backoffice"];

/** Alleen organisatie-beheerders (geen backoffice) — abonnement, huisstijl, gebruikersbeheer */
export const PARTNER_ADMIN_TIER: AppRole[] = ["superadmin", "partner_admin"];

/** Operationeel personeel breed (alle dagelijks werk) */
export const OPERATIONEEL: AppRole[] = [
  "superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur",
];

export const isAdminTier = (rol?: AppRole | null): boolean =>
  !!rol && ADMIN_TIER.includes(rol);

export const isPartnerAdminOrHigher = (rol?: AppRole | null): boolean =>
  !!rol && PARTNER_ADMIN_TIER.includes(rol);

export const canAccessFinance = (rol?: AppRole | null): boolean =>
  isAdminTier(rol);

export const canManageSuppliers = (rol?: AppRole | null): boolean =>
  isAdminTier(rol);

export const canManageUsers = (rol?: AppRole | null): boolean =>
  isPartnerAdminOrHigher(rol);

export const canSeeProductCost = (rol?: AppRole | null): boolean =>
  isAdminTier(rol) || rol === "partner_staff";

export const canSeeAllLeads = (rol?: AppRole | null): boolean =>
  !!rol && ["superadmin", "partner_admin", "backoffice", "partner_staff"].includes(rol);

export const canSeeAllOffertes = canSeeAllLeads;

export const canCreateSchouw = (rol?: AppRole | null): boolean =>
  !!rol && ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"].includes(rol);

export const canSeeAdviseursOverview = (rol?: AppRole | null): boolean =>
  isPartnerAdminOrHigher(rol);

export const isOperational = (rol?: AppRole | null): boolean =>
  !!rol && OPERATIONEEL.includes(rol);

export const ROL_LABEL: Record<AppRole, string> = {
  superadmin: "Platformbeheerder",
  partner_admin: "Organisatiebeheerder",
  backoffice: "Backoffice",
  partner_staff: "Medewerker",
  adviseur: "Energieadviseur",
  installateur: "Installateur",
  consument: "Consument",
  affiliate: "Affiliate",
};