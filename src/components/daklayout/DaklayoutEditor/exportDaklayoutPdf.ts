import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { Dakvlak, Paneel, PaneelProduct } from "../types";

interface ExportInput {
  mapEl: HTMLElement;
  naam: string;
  adres: string;
  product: PaneelProduct | null;
  dakvlakken: Dakvlak[];
  panelen: Paneel[];
}

const A4_W = 210;
const A4_H = 297;
const MARGIN = 15;
const DISCLAIMER =
  "Deze daklayout is een visuele schatting op basis van satellietbeelden en kan afwijken van de werkelijke daksituatie. Definitieve plaatsing wordt bepaald tijdens de schouw door een vakkundige installateur.";

export async function exportDaklayoutPdf(input: ExportInput): Promise<Blob> {
  const { mapEl, naam, adres, product, dakvlakken, panelen } = input;
  const canvas = await html2canvas(mapEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });
  const imgData = canvas.toDataURL("image/jpeg", 0.92);

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  pdf.setFontSize(16);
  pdf.text(naam || "Daklayout", MARGIN, MARGIN);
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(adres || "", MARGIN, MARGIN + 6);
  pdf.setTextColor(0);

  // Satellietafbeelding
  const imgW = A4_W - 2 * MARGIN;
  const imgH = (canvas.height * imgW) / canvas.width;
  const maxImgH = 140;
  const renderH = Math.min(imgH, maxImgH);
  const renderW = (canvas.width * renderH) / canvas.height;
  pdf.addImage(imgData, "JPEG", MARGIN, MARGIN + 12, Math.min(renderW, imgW), renderH);

  let y = MARGIN + 12 + renderH + 8;

  // Samenvatting
  pdf.setFontSize(12);
  pdf.text("Samenvatting", MARGIN, y);
  y += 6;
  pdf.setFontSize(10);
  const totaalWp = panelen.length * (product?.wp ?? 0);
  const rows = [
    ["Aantal dakvlakken", String(dakvlakken.length)],
    ["Aantal panelen", String(panelen.length)],
    ["Paneel", product ? `${product.naam} (${product.wp} Wp)` : "—"],
    ["Totaal vermogen", `${totaalWp.toLocaleString("nl-NL")} Wp`],
    ["Geschatte opbrengst", `${Math.round(totaalWp * 0.95).toLocaleString("nl-NL")} kWh/jaar (indicatief)`],
  ];
  rows.forEach(([k, v]) => {
    pdf.text(`${k}:`, MARGIN, y);
    pdf.text(v, MARGIN + 55, y);
    y += 5;
  });

  // Dakvlak-tabel
  if (dakvlakken.length > 0) {
    y += 4;
    pdf.setFontSize(12);
    pdf.text("Dakvlakken", MARGIN, y);
    y += 5;
    pdf.setFontSize(9);
    pdf.text("Naam", MARGIN, y);
    pdf.text("Oriëntatie", MARGIN + 40, y);
    pdf.text("Helling", MARGIN + 75, y);
    pdf.text("Modus", MARGIN + 100, y);
    pdf.text("Panelen", MARGIN + 130, y);
    y += 4;
    dakvlakken.forEach((dv) => {
      const aantal = panelen.filter((p) => p.dakvlakId === dv.id).length;
      pdf.text(dv.naam, MARGIN, y);
      pdf.text(`${dv.orientatieDeg}°`, MARGIN + 40, y);
      pdf.text(`${dv.hellingshoekDeg}°`, MARGIN + 75, y);
      pdf.text(dv.modus, MARGIN + 100, y);
      pdf.text(String(aantal), MARGIN + 130, y);
      y += 4;
      if (y > A4_H - 30) {
        pdf.addPage();
        y = MARGIN;
      }
    });
  }

  // Disclaimer onderaan
  const disclaimerY = A4_H - 18;
  pdf.setFontSize(8);
  pdf.setTextColor(120);
  const lines = pdf.splitTextToSize(DISCLAIMER, A4_W - 2 * MARGIN);
  pdf.text(lines, MARGIN, disclaimerY);

  return pdf.output("blob");
}