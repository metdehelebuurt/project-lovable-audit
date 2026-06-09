import { Info, ExternalLink } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  leerMeerLabel?: string;
  leerMeerUrl?: string;
  variant?: "info" | "tip" | "warning";
}

export const InfoCallout = ({ title, children, leerMeerLabel, leerMeerUrl, variant = "info" }: Props) => {
  const tone =
    variant === "warning"
      ? "border-warning/30 bg-warning/5 text-warning-foreground"
      : variant === "tip"
      ? "border-success/30 bg-success/5"
      : "border-primary/20 bg-primary/5";
  return (
    <div className={`rounded-xl border ${tone} p-3 flex gap-3`}>
      <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
      <div className="text-sm space-y-1">
        <p className="font-medium">{title}</p>
        <div className="text-muted-foreground">{children}</div>
        {leerMeerUrl && (
          <a
            href={leerMeerUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {leerMeerLabel || "Meer info"} <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
};

export default InfoCallout;