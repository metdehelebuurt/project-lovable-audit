import { Button } from "@/components/ui/button";

interface Props {
  variabelen: ReadonlyArray<string>;
  onInsert: (placeholder: string) => void;
}

export function VariabelenPicker({ variabelen, onInsert }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {variabelen.map((v) => (
        <Button
          key={v}
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs font-mono"
          onClick={() => onInsert(`{{${v}}}`)}
        >
          {`{{${v}}}`}
        </Button>
      ))}
    </div>
  );
}
