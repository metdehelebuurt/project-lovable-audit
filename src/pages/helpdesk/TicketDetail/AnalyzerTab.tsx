import { useAuth } from "@/contexts/AuthContext";
import { FoutcodeAnalyzer } from "@/components/helpdesk/FoutcodeAnalyzer";
import { Troubleshooter } from "@/components/helpdesk/Troubleshooter";
import type { HelpdeskTicket } from "@/hooks/helpdesk/useTickets";

export default function AnalyzerTab({ ticket }: { ticket: HelpdeskTicket }) {
  const { user } = useAuth();
  if (!user) return <p className="text-sm text-muted-foreground">Niet ingelogd.</p>;

  return (
    <div className="space-y-4">
      <FoutcodeAnalyzer ticket={ticket} userId={user.id} />
      <Troubleshooter ticket={ticket} userId={user.id} />
    </div>
  );
}