import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";
import { useEmailAccounts } from "@/hooks/email/useEmailAccounts";
import { useEffect } from "react";

interface Props {
  userId: string | undefined;
  value: string | null;
  onChange: (accountId: string | null) => void;
  label?: string;
  className?: string;
}

export default function SenderPicker({ userId, value, onChange, label = "Verstuur vanaf", className }: Props) {
  const { data: accounts = [] } = useEmailAccounts(userId);

  // Bij eerste render standaard het primaire account kiezen.
  useEffect(() => {
    if (!value && accounts.length > 0) {
      const prim = accounts.find((a) => a.is_primair) ?? accounts[0];
      onChange(prim.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.length]);

  if (accounts.length <= 1) return null;

  return (
    <div className={className ?? "space-y-1"}>
      <Label className="text-xs">{label}</Label>
      <Select value={value ?? undefined} onValueChange={(v) => onChange(v)}>
        <SelectTrigger className="rounded-xl">
          <SelectValue placeholder="Kies e-mailadres" />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              <span className="flex items-center gap-2">
                {a.is_primair && <Star className="h-3 w-3 text-primary" />}
                <span>{a.label ? `${a.label} — ${a.email_adres}` : a.email_adres}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}