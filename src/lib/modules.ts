import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@/lib/permissions";

export interface ModuleDefinition {
  key: string;
  label: string;
  groep: string;
  defaultRoles: AppRole[];
  configurable: boolean; // false = niet instelbaar door partner_admin
}

/**
 * Centrale registry van alle modules in het platform.
 * `defaultRoles` = systeemstandaard wanneer er geen partner-instelling of override is.
 * `configurable: false` = altijd hardcoded (superadmin-functies, instellingen, gebruikersbeheer).
 */
export const MODULES: ModuleDefinition[] = [
  // Operationeel — instelbaar
  { key: "leads", label: "Leads", groep: "Relatiebeheer", defaultRoles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"], configurable: true },
  { key: "klanten", label: "Klanten", groep: "Relatiebeheer", defaultRoles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur"], configurable: true },
  { key: "berichten", label: "Berichten", groep: "Relatiebeheer", defaultRoles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur", "consument"], configurable: true },
  { key: "schouwen", label: "Schouwen", groep: "Werkproces", defaultRoles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur", "consument"], configurable: true },
  { key: "offertes", label: "Offertes", groep: "Werkproces", defaultRoles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "consument", "affiliate"], configurable: true },
  { key: "opdrachten", label: "Opdrachten", groep: "Werkproces", defaultRoles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"], configurable: true },
  { key: "installaties", label: "Installaties", groep: "Werkproces", defaultRoles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"], configurable: true },
  { key: "opleveringen", label: "Opleveringen", groep: "Werkproces", defaultRoles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"], configurable: true },
  { key: "helpdesk", label: "Helpdesk", groep: "Service", defaultRoles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"], configurable: true },
  { key: "planning", label: "Planning", groep: "Planning", defaultRoles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur", "consument"], configurable: true },
  { key: "producten", label: "Producten", groep: "Catalogus", defaultRoles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"], configurable: true },
  { key: "voorraad", label: "Voorraad", groep: "Logistiek", defaultRoles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "installateur"], configurable: true },
  { key: "inkoop", label: "Inkoop", groep: "Logistiek", defaultRoles: ["superadmin", "partner_admin", "backoffice"], configurable: true },
  { key: "inkoop_ontvangsten", label: "Inkoopontvangsten", groep: "Logistiek", defaultRoles: ["superadmin", "partner_admin", "backoffice", "partner_staff"], configurable: true },
  { key: "retouren", label: "Retouren (RMA)", groep: "Logistiek", defaultRoles: ["superadmin", "partner_admin", "backoffice", "partner_staff"], configurable: true },
  { key: "tools", label: "Tools", groep: "Tools", defaultRoles: ["superadmin", "partner_admin", "partner_staff", "adviseur"], configurable: true },
  { key: "energieadvies", label: "Energieadvies", groep: "Tools", defaultRoles: ["superadmin", "partner_admin", "partner_staff", "adviseur"], configurable: true },
  { key: "documenten", label: "Documenten", groep: "Catalogus", defaultRoles: ["superadmin", "partner_admin", "backoffice", "partner_staff", "adviseur", "installateur"], configurable: true },
  { key: "analytics", label: "Analytics", groep: "Inzicht", defaultRoles: ["superadmin", "partner_admin", "backoffice"], configurable: true },

  // Financieel — gesplitst per submodule, instelbaar
  { key: "financieel_verkoop", label: "Verkoopfacturen", groep: "Financieel", defaultRoles: ["superadmin", "partner_admin", "backoffice"], configurable: true },
  { key: "financieel_inkoop", label: "Inkoopfacturen", groep: "Financieel", defaultRoles: ["superadmin", "partner_admin", "backoffice"], configurable: true },
  { key: "financieel_pakbonnen", label: "Pakbonnen", groep: "Financieel", defaultRoles: ["superadmin", "partner_admin", "backoffice"], configurable: true },
  { key: "financieel_btw", label: "BTW-aangifte", groep: "Financieel", defaultRoles: ["superadmin", "partner_admin", "backoffice"], configurable: true },
  { key: "financieel_openstaand", label: "Openstaande posten", groep: "Financieel", defaultRoles: ["superadmin", "partner_admin", "backoffice"], configurable: true },
  { key: "leveranciers", label: "Leveranciers", groep: "Financieel", defaultRoles: ["superadmin", "partner_admin", "backoffice"], configurable: true },

  // Beheer — niet instelbaar (hardcoded rolcheck blijft)
  { key: "partners", label: "Partners", groep: "Beheer", defaultRoles: ["superadmin"], configurable: false },
  { key: "adviseurs", label: "Adviseurs", groep: "Beheer", defaultRoles: ["superadmin", "partner_admin"], configurable: false },
  { key: "gebruikers", label: "Gebruikers", groep: "Beheer", defaultRoles: ["superadmin", "partner_admin"], configurable: false },
  { key: "instellingen", label: "Instellingen", groep: "Beheer", defaultRoles: ["superadmin", "partner_admin", "partner_staff", "affiliate", "sales_manager"], configurable: false },
  { key: "affiliate_beheer", label: "Affiliate beheer", groep: "Beheer", defaultRoles: ["superadmin", "sales_manager"], configurable: false },
  { key: "admin_abonnementen", label: "Abonnementen-beheer", groep: "Beheer", defaultRoles: ["superadmin"], configurable: false },
];

export const MODULE_BY_KEY: Record<string, ModuleDefinition> =
  Object.fromEntries(MODULES.map(m => [m.key, m]));

export const CONFIGURABLE_MODULES = MODULES.filter(m => m.configurable);

export const CONFIGURABLE_ROLES: AppRole[] = ["backoffice", "partner_staff", "adviseur", "installateur"];

/** Bepaal of een rol standaard toegang heeft tot een module (zonder DB-config). */
export const heeftRolDefaultToegang = (rol: AppRole | null | undefined, moduleKey: string): boolean => {
  if (!rol) return false;
  const mod = MODULE_BY_KEY[moduleKey];
  if (!mod) return false;
  return mod.defaultRoles.includes(rol);
};

interface EffectieveModulesResult {
  moduleSet: Set<string>;
  isLoading: boolean;
}

/**
 * Berekent welke modules de ingelogde gebruiker effectief kan zien.
 * Cascade: user-override > partner-rolmatrix > systeemdefault.
 * Superadmin krijgt altijd alles.
 */
export function useEffectieveModules(): EffectieveModulesResult {
  const { profile } = useAuth();
  const rol = profile?.rol ?? null;
  const userId = profile?.id;
  const partnerId = profile?.partner_id;

  const { data, isLoading } = useQuery({
    queryKey: ["effectieve-modules", userId, partnerId],
    enabled: !!userId,
    queryFn: async () => {
      const [overridesRes, matrixRes, planRes] = await Promise.all([
        supabase.from("module_user_override").select("module_key, toegestaan").eq("user_id", userId!),
        partnerId
          ? supabase.from("module_rol_toegang").select("module_key, rol, toegestaan").eq("partner_id", partnerId)
          : Promise.resolve({ data: [], error: null }),
        partnerId
          ? supabase
              .from("abonnementen")
              .select("status, abonnement_plannen(modules)")
              .eq("partner_id", partnerId)
              .in("status", ["actief", "trial"])
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);
      const planModules = Array.isArray((planRes.data as { abonnement_plannen?: { modules?: unknown } } | null)?.abonnement_plannen?.modules)
        ? ((planRes.data as { abonnement_plannen: { modules: string[] } }).abonnement_plannen.modules)
        : null;
      return {
        overrides: (overridesRes.data ?? []) as Array<{ module_key: string; toegestaan: boolean }>,
        matrix: (matrixRes.data ?? []) as Array<{ module_key: string; rol: AppRole; toegestaan: boolean }>,
        planModules,
      };
    },
  });

  const moduleSet = new Set<string>();
  if (rol === "superadmin") {
    MODULES.forEach(m => moduleSet.add(m.key));
    return { moduleSet, isLoading: false };
  }

  const overrideMap = new Map<string, boolean>();
  (data?.overrides ?? []).forEach(o => overrideMap.set(o.module_key, o.toegestaan));
  const matrixMap = new Map<string, boolean>();
  (data?.matrix ?? []).filter(m => m.rol === rol).forEach(m => matrixMap.set(m.module_key, m.toegestaan));
  const planModuleSet = data?.planModules ? new Set(data.planModules) : null;

  for (const mod of MODULES) {
    if (overrideMap.has(mod.key)) {
      if (overrideMap.get(mod.key)) moduleSet.add(mod.key);
      continue;
    }
    // Plan-restrictie: configurabele modules die niet in het plan zitten worden geblokkeerd.
    // Niet-configurabele (Beheer) modules blijven beschikbaar voor de juiste rol.
    if (mod.configurable && planModuleSet && !planModuleSet.has(mod.key)) {
      continue;
    }
    if (mod.configurable && matrixMap.has(mod.key)) {
      if (matrixMap.get(mod.key)) moduleSet.add(mod.key);
      continue;
    }
    if (heeftRolDefaultToegang(rol, mod.key)) moduleSet.add(mod.key);
  }

  return { moduleSet, isLoading };
}
