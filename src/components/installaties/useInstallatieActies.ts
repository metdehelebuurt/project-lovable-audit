import { toast } from "sonner";
import { useInstallatie } from "./useInstallatie";
import type { InstallatieStatus } from "./status";

export function useInstallatieActies(id: string | undefined) {
  const { update, refetch } = useInstallatie(id);

  const setStatus = async (status: InstallatieStatus, extra: Record<string, unknown> = {}) => {
    try {
      await update.mutateAsync({ status, ...extra });
      await refetch();
      toast.success("Status bijgewerkt");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Kon status niet bijwerken";
      toast.error(msg);
    }
  };

  const markeerOnderweg = () => setStatus("onderweg");

  const markeerGestart = () =>
    setStatus("in_uitvoering", { werkelijke_starttijd: new Date().toISOString() });

  const markeerPauze = () => setStatus("bevestigd");

  const gereedMelden = (notitie?: string) =>
    setStatus("gereed", {
      gereedmelding_op: new Date().toISOString(),
      gereedmelding_notitie: notitie?.trim() ? notitie : null,
      werkelijke_eindtijd: new Date().toISOString(),
    });

  const markeerAfgerond = () => setStatus("afgerond");

  return {
    setStatus,
    markeerOnderweg,
    markeerGestart,
    markeerPauze,
    gereedMelden,
    markeerAfgerond,
    isPending: update.isPending,
  };
}