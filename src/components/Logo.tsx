import logoWhite from "@/assets/logo.png";
import logoColored from "@/assets/logo-colored.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "colored" | "white";
}

const Logo = ({ className = "", showText = true, variant = "colored" }: LogoProps) => {
  const logoSrc = variant === "white" ? logoWhite : logoColored;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={logoSrc} alt="mijnhuis.nu logo" className="h-8 w-8 object-contain" />
      {showText && (
        <span className={`text-lg font-semibold ${variant === "white" ? "text-white" : "text-foreground"}`}>
          mijnhuis<span className="text-primary">.nu</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
