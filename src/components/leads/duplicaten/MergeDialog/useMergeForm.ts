import { useMemo, useState, useEffect } from "react";
import { EIGENSCHAPPEN_FIELDS, LEAD_FIELDS, type LeadEigenschappen, type LeadLite } from "../types";

/** Welke kolom (a of b) wint per veld. */
export type Keuze = "a" | "b";

function isLeeg(v: unknown): boolean {
  return v === null || v === undefined || v === "";
}

function defaultKeuze(va: unknown, vb: unknown, fallback: Keuze): Keuze {
  if (isLeeg(va) && !isLeeg(vb)) return "b";
  if (!isLeeg(va) && isLeeg(vb)) return "a";
  return fallback;
}

export function useMergeForm(opts: {
  leadA: LeadLite;
  leadB: LeadLite;
  eigA: LeadEigenschappen | null;
  eigB: LeadEigenschappen | null;
}) {
  const { leadA, leadB, eigA, eigB } = opts;

  // Standaard: oudste lead = behoud-lead (meeste historie meestal daar)
  const initialKeep: "a" | "b" = new Date(leadA.created_at).getTime() <= new Date(leadB.created_at).getTime() ? "a" : "b";
  const [keepSide, setKeepSide] = useState<"a" | "b">(initialKeep);

  const initialLeadKeuzes = useMemo(() => {
    const out: Record<string, Keuze> = {};
    for (const f of LEAD_FIELDS) {
      out[f.key] = defaultKeuze(leadA[f.key], leadB[f.key], initialKeep);
    }
    return out;
  }, [leadA, leadB, initialKeep]);

  const initialEigKeuzes = useMemo(() => {
    const out: Record<string, Keuze> = {};
    for (const f of EIGENSCHAPPEN_FIELDS) {
      out[f.key] = defaultKeuze(eigA?.[f.key], eigB?.[f.key], initialKeep);
    }
    return out;
  }, [eigA, eigB, initialKeep]);

  const [leadKeuzes, setLeadKeuzes] = useState<Record<string, Keuze>>(initialLeadKeuzes);
  const [eigKeuzes, setEigKeuzes] = useState<Record<string, Keuze>>(initialEigKeuzes);

  useEffect(() => setLeadKeuzes(initialLeadKeuzes), [initialLeadKeuzes]);
  useEffect(() => setEigKeuzes(initialEigKeuzes), [initialEigKeuzes]);

  const keepLead = keepSide === "a" ? leadA : leadB;
  const mergeLead = keepSide === "a" ? leadB : leadA;

  function buildPayload() {
    const lead_values: Record<string, unknown> = {};
    for (const f of LEAD_FIELDS) {
      const winner = leadKeuzes[f.key];
      lead_values[f.key] = winner === "a" ? leadA[f.key] : leadB[f.key];
    }
    const eigenschappen_values: Record<string, unknown> = {};
    for (const f of EIGENSCHAPPEN_FIELDS) {
      const winner = eigKeuzes[f.key];
      const v = winner === "a" ? eigA?.[f.key] : eigB?.[f.key];
      eigenschappen_values[f.key] = v ?? null;
    }
    return {
      keep_lead_id: keepLead.id,
      merge_lead_id: mergeLead.id,
      lead_values,
      eigenschappen_values,
    };
  }

  return {
    keepSide, setKeepSide,
    keepLead, mergeLead,
    leadKeuzes, setLeadKeuzes,
    eigKeuzes, setEigKeuzes,
    buildPayload,
  };
}