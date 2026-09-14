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
        const zichtbaar = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLElement);
        zichtbaar.forEach((el, index) => {
          window.setTimeout(() => el.classList.remove("mh-hidden"), index * 90);
          observer.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
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
