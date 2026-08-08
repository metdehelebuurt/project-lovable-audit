import { LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HelpButtonProps {
  onClick: () => void;
  className?: string;
}

export function HelpButton({ onClick, className }: HelpButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      aria-label="Hulp nodig"
      data-tour="app:hulp"
      size="icon"
      className={cn(
        "fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full shadow-lg",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        className,
      )}
    >
      <LifeBuoy className="h-5 w-5" />
    </Button>
  );
}