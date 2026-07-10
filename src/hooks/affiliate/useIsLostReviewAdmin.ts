import { useAuth } from "@/contexts/AuthContext";

/** Toegang tot de "Verloren review"-pagina: superadmin, sales_manager + bas@mijnhuis.nu. */
export function useIsLostReviewAdmin() {
  const { profile } = useAuth();
  if (!profile) return false;
  const rol = String(profile.rol ?? "");
  if (rol === "superadmin" || rol === "sales_manager") return true;
  return profile.email?.toLowerCase() === "bas@mijnhuis.nu";
}