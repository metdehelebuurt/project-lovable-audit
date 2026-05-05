import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FilterState } from "./useEmailLogs";

interface Props {
  value: FilterState;
  onChange: (next: FilterState) => void;
  typeOptions: string[];
  statusOptions: string[];
}

export function Filters({ value, onChange, typeOptions, statusOptions }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <Select value={value.range} onValueChange={(v) => onChange({ ...value, range: v as FilterState["range"] })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="24h">Laatste 24 uur</SelectItem>
          <SelectItem value="7d">Laatste 7 dagen</SelectItem>
          <SelectItem value="30d">Laatste 30 dagen</SelectItem>
          <SelectItem value="all">Alles</SelectItem>
        </SelectContent>
      </Select>
      <Select value={value.type} onValueChange={(v) => onChange({ ...value, type: v })}>
        <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle types</SelectItem>
          {typeOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={value.status} onValueChange={(v) => onChange({ ...value, status: v })}>
        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle statussen</SelectItem>
          {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Input
        placeholder="Zoek op e-mailadres…"
        value={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value })}
      />
    </div>
  );
}