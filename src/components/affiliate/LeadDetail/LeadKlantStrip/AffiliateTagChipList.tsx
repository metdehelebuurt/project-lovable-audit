import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  tags: string[];
  disabled: boolean;
  onVerwijder: (tag: string) => void;
}

export function AffiliateTagChipList({ tags, disabled, onVerwijder }: Props) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="h-6 gap-1 pl-2 pr-1 text-xs">
          #{tag}
          <button
            type="button"
            aria-label={`Tag ${tag} verwijderen`}
            className="rounded-sm p-0.5 hover:bg-muted-foreground/20 disabled:pointer-events-none disabled:opacity-50"
            disabled={disabled}
            onClick={() => onVerwijder(tag)}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}