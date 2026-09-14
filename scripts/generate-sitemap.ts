// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://app.mijnhuis.nu";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/functionaliteiten", changefreq: "monthly", priority: "0.9" },
  { path: "/prijzen", changefreq: "monthly", priority: "0.9" },
  { path: "/demo", changefreq: "monthly", priority: "0.8" },
  { path: "/proefperiode", changefreq: "monthly", priority: "0.8" },
  { path: "/kennismaking", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "yearly", priority: "0.6" },
  { path: "/over", changefreq: "yearly", priority: "0.5" },
  { path: "/klantverhalen", changefreq: "monthly", priority: "0.7" },
  { path: "/affiliate", changefreq: "monthly", priority: "0.6" },
  { path: "/juridisch", changefreq: "yearly", priority: "0.3" },
  { path: "/branches", changefreq: "monthly", priority: "0.8" },
  { path: "/branches/isolatie", changefreq: "monthly", priority: "0.8" },
  { path: "/branches/laadpalen", changefreq: "monthly", priority: "0.8" },
  { path: "/branches/thuisbatterijen", changefreq: "monthly", priority: "0.8" },
  { path: "/branches/warmtepompen", changefreq: "monthly", priority: "0.8" },
  { path: "/branches/zonnepanelen", changefreq: "monthly", priority: "0.8" },
  { path: "/oplossingen/schouw", changefreq: "monthly", priority: "0.8" },
  { path: "/oplossingen/offerte", changefreq: "monthly", priority: "0.8" },
  { path: "/oplossingen/lead", changefreq: "monthly", priority: "0.7" },
  { path: "/oplossingen/planning", changefreq: "monthly", priority: "0.7" },
  { path: "/oplossingen/monteursapp", changefreq: "monthly", priority: "0.7" },
  { path: "/oplossingen/oplevering", changefreq: "monthly", priority: "0.7" },
  { path: "/oplossingen/klantportaal", changefreq: "monthly", priority: "0.7" },
  { path: "/oplossingen/rapportage", changefreq: "monthly", priority: "0.7" },
  { path: "/kennisbank", changefreq: "weekly", priority: "0.7" },
  { path: "/kennisbank/load-balancing-laadpalen", changefreq: "yearly", priority: "0.5" },
  { path: "/kennisbank/nen-1010-veelgemaakte-fouten", changefreq: "yearly", priority: "0.5" },
  { path: "/kennisbank/offerte-in-vijf-minuten", changefreq: "yearly", priority: "0.5" },
  { path: "/kennisbank/overstappen-in-drie-weken", changefreq: "yearly", priority: "0.5" },
  { path: "/kennisbank/subsidies-2026-zon-pv", changefreq: "yearly", priority: "0.5" },
  { path: "/kennisbank/warmtepomp-inregelen-opleveren", changefreq: "yearly", priority: "0.5" },
];

function generateSitemap(list: SitemapEntry[]): string {
  const urls = list.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    "",
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
