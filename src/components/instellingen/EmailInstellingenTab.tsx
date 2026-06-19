import EmailConfiguratie from "./EmailConfiguratie";
import EmailAccountsBeheer from "./EmailAccountsBeheer";
import EmailRoutingTabel from "./EmailRoutingTabel";

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
      <EmailConfiguratie partnerId={partnerId} />
      <EmailAccountsBeheer partnerId={partnerId} />
      <EmailRoutingTabel partnerId={partnerId} />
    </div>
  );
};

export default EmailInstellingenTab;