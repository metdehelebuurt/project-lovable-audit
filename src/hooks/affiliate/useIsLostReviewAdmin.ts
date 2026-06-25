import { useAuth } from "@/contexts/AuthContext";

/** Toegang tot de "Verloren review"-pagina: superadmin + bas@mijnhuis.nu. */
export function useIsLostReviewAdmin() {
  const { profile } = useAuth();
  if (!profile) return false;
  if (profile.rol === "superadmin") return true;
  return profile.email?.toLowerCase() === "bas@mijnhuis.nu";
}