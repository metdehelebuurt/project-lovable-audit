// Centrale resolver: bepaalt vanaf welke mailbox een bericht verstuurd moet
// worden op basis van email_routing_config + email_accounts + partners.
//
// Gebruikt door alle uitgaande e-mail edge functions zodat de routing-keuze
// (vast partner-adres / persoonlijke mailbox / specifiek account) op één plek
// bepaald wordt.

export type DocumentType =
  | "offerte" | "orderbevestiging" | "factuur" | "herinnering"
  | "chat_klant" | "chat_lead" | "notificatie" | "algemeen";

export type Bron = "partner_default" | "gebruiker_persoonlijk" | "specifiek_account";

export interface ResolvedSender {
  method: "oauth" | "smtp";
  account: any | null;       // email_accounts row als OAuth
  fromEmail: string;
  fromNaam: string;
  partner: any;
  routingBron: Bron;
  resolvedAccountId: string | null;
}

export class EmailSenderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function resolveEmailSender(
  adminClient: any,
  partnerId: string,
  documentType: DocumentType,
  userId?: string | null,
  preferredAccountId?: string | null,
): Promise<ResolvedSender> {
  const { data: partner, error: partnerErr } = await adminClient
    .from("partners")
    .select("naam, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted, afzender_email, afzender_naam, email_provider")
    .eq("id", partnerId).single();
  if (partnerErr || !partner) {
    throw new EmailSenderError("Organisatiegegevens niet gevonden", 404);
  }

  // Routing-regel ophalen (val terug op partner_default als niets geconfigureerd)
  const { data: routing } = await adminClient
    .from("email_routing_config")
    .select("bron, email_account_id")
    .eq("partner_id", partnerId)
    .eq("document_type", documentType)
    .maybeSingle();

  const bron: Bron = (routing?.bron as Bron) || "partner_default";
  const specifiekAccountId: string | null = routing?.email_account_id ?? null;

  const pickAccountById = async (id: string) => {
    const { data } = await adminClient
      .from("email_accounts").select("*").eq("id", id).eq("actief", true).maybeSingle();
    return data;
  };
  const pickPartnerDefault = async () => {
    // Eerst expliciet gemarkeerde default, anders eerste actieve van partner
    const { data: def } = await adminClient
      .from("email_accounts").select("*")
      .eq("partner_id", partnerId).eq("actief", true).eq("is_default_voor_partner", true).maybeSingle();
    if (def) return def;
    // Eerst een organisatie-account (zonder user_id) als die er is
    const { data: org } = await adminClient
      .from("email_accounts").select("*")
      .eq("partner_id", partnerId).eq("actief", true).is("user_id", null)
      .limit(1).maybeSingle();
    if (org) return org;
    // Laatste redmiddel: eerste actieve account van partner (ook persoonlijk)
    const { data: any1 } = await adminClient
      .from("email_accounts").select("*")
      .eq("partner_id", partnerId).eq("actief", true)
      .order("created_at", { ascending: true })
      .limit(1).maybeSingle();
    return any1;
  };
  const pickUserAccount = async (uid: string) => {
    // Prefer primair, val terug op recentst gebruikt.
    const { data: prim } = await adminClient
      .from("email_accounts").select("*")
      .eq("user_id", uid).eq("actief", true).eq("is_primair", true)
      .maybeSingle();
    if (prim) return prim;
    const { data: any1 } = await adminClient
      .from("email_accounts").select("*")
      .eq("user_id", uid).eq("actief", true)
      .order("laatst_gebruikt_op", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1).maybeSingle();
    return any1;
  };

  let account: any | null = null;
  // Expliciete keuze door de gebruiker (bijv. "verstuur vanaf …") gaat vóór routing.
  if (preferredAccountId) {
    account = await pickAccountById(preferredAccountId);
  }
  if (!account && bron === "specifiek_account" && specifiekAccountId) {
    account = await pickAccountById(specifiekAccountId);
    if (!account) account = await pickPartnerDefault();
  } else if (!account && bron === "gebruiker_persoonlijk" && userId) {
    account = await pickUserAccount(userId);
    if (!account) account = await pickPartnerDefault();
  } else if (!account) {
    account = await pickPartnerDefault();
  }

  if (account) {
    // Laatst-gebruikt timestamp bijwerken (best effort, non-blocking).
    void adminClient.from("email_accounts")
      .update({ laatst_gebruikt_op: new Date().toISOString() })
      .eq("id", account.id);
    return {
      method: "oauth",
      account,
      fromEmail: account.email_adres,
      fromNaam: partner.afzender_naam || partner.naam,
      partner,
      routingBron: bron,
      resolvedAccountId: account.id,
    };
  }

  if (!partner.smtp_host || !partner.afzender_email) {
    throw new EmailSenderError(
      "Geen mailbox beschikbaar. Configureer Gmail/Outlook of vul SMTP in onder Instellingen → E-mail.",
      400,
    );
  }

  return {
    method: "smtp",
    account: null,
    fromEmail: partner.afzender_email,
    fromNaam: partner.afzender_naam || partner.naam,
    partner,
    routingBron: bron,
    resolvedAccountId: null,
  };
}