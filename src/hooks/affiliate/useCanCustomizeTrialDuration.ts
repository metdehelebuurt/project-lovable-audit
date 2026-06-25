import { useAuth } from "@/contexts/AuthContext";

/** Mag de huidige gebruiker de trial-duur aanpassen? Superadmin, sales_manager + bas@mijnhuis.nu. */
export function useCanCustomizeTrialDuration() {
  const { profile } = useAuth();
  if (!profile) return false;
  if (profile.rol === "superadmin" || profile.rol === "sales_manager") return true;
  return profile.email?.toLowerCase() === "bas@mijnhuis.nu";
}