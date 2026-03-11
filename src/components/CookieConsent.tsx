import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card border-t border-border shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          Wij gebruiken cookies om uw ervaring te verbeteren. Door gebruik te maken van onze website gaat u akkoord met ons cookiebeleid.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={decline} className="rounded-pill">
            Weigeren
          </Button>
          <Button size="sm" onClick={accept} className="rounded-pill">
            Accepteren
          </Button>
        </div>
      </div>
    </div>
  );
}
