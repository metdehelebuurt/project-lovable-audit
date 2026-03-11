import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_MS = 5 * 60 * 1000; // Show warning 5 min before

export function SessionTimeout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);

  const handleLogout = useCallback(async () => {
    await signOut();
    toast.info("Sessie verlopen — u bent automatisch uitgelogd");
    navigate("/login");
  }, [signOut, navigate]);

  const resetTimer = useCallback(() => {
    setShowWarning(false);
  }, []);

  useEffect(() => {
    if (!user) return;

    let warningTimer: ReturnType<typeof setTimeout>;
    let logoutTimer: ReturnType<typeof setTimeout>;

    const startTimers = () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      setShowWarning(false);
      warningTimer = setTimeout(() => setShowWarning(true), TIMEOUT_MS - WARNING_MS);
      logoutTimer = setTimeout(handleLogout, TIMEOUT_MS);
    };

    startTimers();

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    const handler = () => startTimers();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      events.forEach(e => window.removeEventListener(e, handler));
    };
  }, [user, handleLogout]);

  if (!user) return null;

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sessie verloopt binnenkort</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Uw sessie verloopt over 5 minuten wegens inactiviteit. Klik op "Doorgaan" om uw sessie te verlengen.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={handleLogout} className="rounded-pill">Uitloggen</Button>
          <Button onClick={resetTimer} className="rounded-pill">Doorgaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
