import logoWhite from "@/assets/logo-white.png";
import logoPurple from "@/assets/logo-purple.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: "purple" | "white";
}

const Logo = ({ className = "", showText = true, variant = "purple" }: LogoProps) => {
  const logoSrc = variant === "white" ? logoWhite : logoPurple;

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
