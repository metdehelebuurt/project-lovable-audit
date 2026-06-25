import { useAuth } from "@/contexts/AuthContext";

/** Mag de huidige gebruiker de trial-duur aanpassen? Superadmin + bas@mijnhuis.nu. */
export function useCanCustomizeTrialDuration() {
  const { profile } = useAuth();
  if (!profile) return false;
  if (profile.rol === "superadmin") return true;
  return profile.email?.toLowerCase() === "bas@mijnhuis.nu";
}