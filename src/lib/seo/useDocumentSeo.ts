import { useEffect } from "react";

export interface SeoMeta {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: "website" | "product" | "article";
  jsonLd?: Record<string, unknown>;
}

const ATTR = "data-public-seo";

function setMeta(name: string, content: string, useProperty = false) {
  const selector = useProperty ? `meta[property="${name}"][${ATTR}]` : `meta[name="${name}"][${ATTR}]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    if (useProperty) el.setAttribute("property", name);
    else el.setAttribute("name", name);
    el.setAttribute(ATTR, "1");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  const selector = `link[rel="${rel}"][${ATTR}]`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    el.setAttribute(ATTR, "1");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(data: Record<string, unknown>) {
  const selector = `script[type="application/ld+json"][${ATTR}]`;
  let el = document.head.querySelector<HTMLScriptElement>(selector);
  if (!el) {
    el = document.createElement("script");
    el.setAttribute("type", "application/ld+json");
    el.setAttribute(ATTR, "1");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function clearAll() {
  document.head.querySelectorAll(`[${ATTR}]`).forEach((n) => n.remove());
}

export function useDocumentSeo(meta: SeoMeta | null) {
  useEffect(() => {
    if (!meta) return;
    const previousTitle = document.title;
    document.title = meta.title.slice(0, 60);

    if (meta.description) setMeta("description", meta.description.slice(0, 160));
    if (meta.canonical) setLink("canonical", meta.canonical);

    setMeta("og:title", meta.title, true);
    if (meta.description) setMeta("og:description", meta.description, true);
    if (meta.image) setMeta("og:image", meta.image, true);
    setMeta("og:type", meta.type ?? "website", true);
    if (meta.canonical) setMeta("og:url", meta.canonical, true);

    setMeta("twitter:card", meta.image ? "summary_large_image" : "summary");
    setMeta("twitter:title", meta.title);
    if (meta.description) setMeta("twitter:description", meta.description);
    if (meta.image) setMeta("twitter:image", meta.image);

    if (meta.jsonLd) setJsonLd(meta.jsonLd);

    return () => {
      document.title = previousTitle;
      clearAll();
    };
  }, [meta]);
}