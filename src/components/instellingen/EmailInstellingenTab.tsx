import EmailConfiguratie from "./EmailConfiguratie";
import EmailAccountsBeheer from "./EmailAccountsBeheer";
import EmailRoutingTabel from "./EmailRoutingTabel";
import EmailOnboardingChecklist from "./EmailOnboardingChecklist";

interface Props {
  partnerId: string;
}

/**
 * Wrapper voor de "E-mail" tab in Instellingen (alleen partner_admin).
 * Bundelt drie kaarten in vaste volgorde:
 *  1. Algemeen partner-postvak (SMTP + OAuth-koppeling)
 *  2. Gekoppelde mailboxen + welk account standaard is
 *  3. Routing per documenttype
 */
const EmailInstellingenTab = ({ partnerId }: Props) => {
  return (
    <div className="space-y-6">
      <EmailOnboardingChecklist partnerId={partnerId} />
      <div id="email-configuratie"><EmailConfiguratie partnerId={partnerId} /></div>
      <div id="email-accounts"><EmailAccountsBeheer partnerId={partnerId} /></div>
      <div id="email-routing"><EmailRoutingTabel partnerId={partnerId} /></div>
    </div>
  );
};

export default EmailInstellingenTab;