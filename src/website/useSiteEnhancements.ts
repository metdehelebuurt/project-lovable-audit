import { useEffect } from "react";

/** Toont reveal-secties zodra ze in beeld komen (zoals in het ontwerp). */
function useReveal(pathname: string) {
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(".mh-reveal.mh-hidden"),
    );
    if (nodes.length === 0) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.remove("mh-hidden"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const delay = Number(el.dataset.rv ?? 0) * 70;
          window.setTimeout(() => el.classList.remove("mh-hidden"), delay);
          observer.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [pathname]);
}

function toggleAccordion(button: HTMLElement) {
  const open = button.getAttribute("aria-expanded") === "true";
  const panel = button.nextElementSibling as HTMLElement | null;
  const chevron = button.querySelector<HTMLElement>("span[aria-hidden]");
  button.setAttribute("aria-expanded", open ? "false" : "true");
  if (panel) panel.style.maxHeight = open ? "0px" : "600px";
  if (chevron) chevron.style.transform = open ? "none" : "rotate(45deg)";
}

/** Laat de uitklapbare vragen werken. */
function useAccordions(pathname: string) {
  useEffect(() => {
    const handler = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLElement>("button[aria-expanded]");
      if (!button || button.getAttribute("aria-haspopup") === "true") return;
      toggleAccordion(button);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [pathname]);
}

export function useSiteEnhancements(pathname: string) {
  useReveal(pathname);
  useAccordions(pathname);
}
