import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OnboardingVoorkeuren {
  taal?: string;
  tijdzone?: string;
  thema?: "light" | "dark" | "system";
  notif_email?: boolean;
  notif_inapp?: boolean;
}

export interface OnboardingUserData {
  voornaam: string;
  achternaam: string;
  telefoon: string;
  functie: string;
  avatar_url: string | null;
  handtekening_html: string | null;
  mfa_enabled: boolean;
  voorkeuren: OnboardingVoorkeuren;
}

export interface OnboardingPartnerData {
  bedrijfsnaam: string;
  kvk: string;
  btw_nummer: string;
  adres: string;
  postcode: string;
  plaats: string;
  logo_url: string | null;
  hoofdkleur: string;
}

export interface OnboardingState {
  loading: boolean;
  user: OnboardingUserData;
  partner: OnboardingPartnerData | null;
  hasEmailAccount: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  saveUser: (patch: Partial<OnboardingUserData>) => Promise<void>;
  savePartner: (patch: Partial<OnboardingPartnerData>) => Promise<void>;
  markVoltooid: () => Promise<void>;
  markOvergeslagen: () => Promise<void>;
}

const DEFAULT_USER: OnboardingUserData = {
  voornaam: "", achternaam: "", telefoon: "", functie: "",
  avatar_url: null, handtekening_html: null, mfa_enabled: false,
  voorkeuren: { taal: "nl", tijdzone: "Europe/Amsterdam", thema: "system", notif_email: true, notif_inapp: true },
};

export function useOnboardingState(): OnboardingState {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<OnboardingUserData>(DEFAULT_USER);
  const [partner, setPartner] = useState<OnboardingPartnerData | null>(null);
  const [hasEmailAccount, setHasEmailAccount] = useState(false);

  const isAdmin = profile?.rol === "partner_admin" || profile?.rol === "superadmin";

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    const { data: u } = await supabase
      .from("users")
      .select("voornaam, achternaam, telefoon, functie, avatar_url, handtekening_html, mfa_enabled, voorkeuren")
      .eq("id", profile.id).maybeSingle();
    if (u) {
      const v = (u as any).voorkeuren || {};
      setUser({
        voornaam: u.voornaam || "",
        achternaam: u.achternaam || "",
        telefoon: u.telefoon || "",
        functie: (u as any).functie || "",
        avatar_url: (u as any).avatar_url || null,
        handtekening_html: (u as any).handtekening_html || null,
        mfa_enabled: !!(u as any).mfa_enabled,
        voorkeuren: { ...DEFAULT_USER.voorkeuren, ...v },
      });
    }

    const { data: acc } = await supabase
      .from("email_accounts").select("id").eq("user_id", profile.id).eq("actief", true).maybeSingle();
    setHasEmailAccount(!!acc);

    if (isAdmin && profile.partner_id) {
      const { data: p } = await supabase
        .from("partners")
        .select("bedrijfsnaam, kvk, btw_nummer, adres, postcode, plaats, logo_url, hoofdkleur")
        .eq("id", profile.partner_id).maybeSingle();
      if (p) {
        setPartner({
          bedrijfsnaam: (p as any).bedrijfsnaam || "",
          kvk: (p as any).kvk || "",
          btw_nummer: (p as any).btw_nummer || "",
          adres: (p as any).adres || "",
          postcode: (p as any).postcode || "",
          plaats: (p as any).plaats || "",
          logo_url: (p as any).logo_url || null,
          hoofdkleur: (p as any).hoofdkleur || "#7c3aed",
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profile?.id]);

  const saveUser = async (patch: Partial<OnboardingUserData>) => {
    if (!profile) return;
    const merged = { ...user, ...patch };
    setUser(merged);
    const dbPatch: Record<string, unknown> = {};
    if (patch.voornaam !== undefined) dbPatch.voornaam = patch.voornaam;
    if (patch.achternaam !== undefined) dbPatch.achternaam = patch.achternaam;
    if (patch.telefoon !== undefined) dbPatch.telefoon = patch.telefoon || null;
    if (patch.functie !== undefined) dbPatch.functie = patch.functie || null;
    if (patch.avatar_url !== undefined) dbPatch.avatar_url = patch.avatar_url;
    if (patch.handtekening_html !== undefined) dbPatch.handtekening_html = patch.handtekening_html;
    if (patch.mfa_enabled !== undefined) dbPatch.mfa_enabled = patch.mfa_enabled;
    if (patch.voorkeuren !== undefined) dbPatch.voorkeuren = { ...user.voorkeuren, ...patch.voorkeuren };
    if (Object.keys(dbPatch).length === 0) return;
    await supabase.from("users").update(dbPatch).eq("id", profile.id);
  };

  const savePartner = async (patch: Partial<OnboardingPartnerData>) => {
    if (!profile?.partner_id || !partner) return;
    const merged = { ...partner, ...patch };
    setPartner(merged);
    await supabase.from("partners").update(patch as any).eq("id", profile.partner_id);
  };

  const markVoltooid = async () => {
    if (!profile) return;
    await supabase.from("users").update({ onboarding_voltooid_op: new Date().toISOString() } as any).eq("id", profile.id);
  };

  const markOvergeslagen = async () => {
    if (!profile) return;
    await supabase.from("users").update({ onboarding_overgeslagen_op: new Date().toISOString() } as any).eq("id", profile.id);
  };

  return { loading, user, partner, hasEmailAccount, isAdmin, refresh: load, saveUser, savePartner, markVoltooid, markOvergeslagen };
}