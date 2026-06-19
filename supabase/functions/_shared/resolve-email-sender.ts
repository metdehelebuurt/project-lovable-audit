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
    const { data: any1 } = await adminClient
      .from("email_accounts").select("*")
      .eq("partner_id", partnerId).eq("actief", true).is("user_id", null).maybeSingle();
    return any1;
  };
  const pickUserAccount = async (uid: string) => {
    const { data } = await adminClient
      .from("email_accounts").select("*").eq("user_id", uid).eq("actief", true).maybeSingle();
    return data;
  };

  let account: any | null = null;
  if (bron === "specifiek_account" && specifiekAccountId) {
    account = await pickAccountById(specifiekAccountId);
    if (!account) account = await pickPartnerDefault();
  } else if (bron === "gebruiker_persoonlijk" && userId) {
    account = await pickUserAccount(userId);
    if (!account) account = await pickPartnerDefault();
  } else {
    account = await pickPartnerDefault();
  }

  if (account) {
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