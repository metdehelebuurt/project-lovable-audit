import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "browser-notificaties-enabled";

function isSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

function readEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function useBrowserNotifications() {
  const supported = isSupported();
  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : "denied",
  );
  const [enabled, setEnabledState] = useState<boolean>(readEnabled());

  useEffect(() => {
    if (!supported) return;
    setPermission(Notification.permission);
  }, [supported]);

  const setEnabled = useCallback((value: boolean) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    setEnabledState(value);
  }, []);

  const request = useCallback(async (): Promise<NotificationPermission> => {
    if (!supported) return "denied";
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") setEnabled(true);
    return result;
  }, [supported, setEnabled]);

  const show = useCallback(
    (titel: string, opties?: NotificationOptions & { onClick?: () => void }) => {
      if (!supported) return;
      if (!readEnabled()) return;
      if (Notification.permission !== "granted") return;
      if (typeof document !== "undefined" && document.visibilityState === "visible" && !opties?.requireInteraction) {
        // Browser zou dit alsnog tonen, maar voorkomen dat actieve tab dubbele meldingen krijgt is wenselijk.
        // We tonen alsnog: gebruikers willen ook in actieve tab een melding.
      }
      try {
        const notif = new Notification(titel, {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          ...opties,
        });
        if (opties?.onClick) {
          notif.onclick = (e) => {
            e.preventDefault();
            window.focus();
            opties.onClick?.();
            notif.close();
          };
        }
      } catch {
        // stil falen — niet kritiek
      }
    },
    [supported],
  );

  return { supported, permission, enabled, setEnabled, request, show };
}