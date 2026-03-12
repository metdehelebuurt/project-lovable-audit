const Logo = ({ className = "", showText = true }: {className?: string;showText?: boolean;}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4L4 18H10V34H18V26H22V34H30V18H36L20 4Z" fill="hsl(242, 67%, 62%)" />
        <path d="M14 18H26V22H14V18Z" fill="white" opacity="0.6" />
        <path d="M18 22H22V26H18V22Z" fill="white" opacity="0.4" />
        <path d="M20 4L4 18H10L20 9L30 18H36L20 4Z" fill="hsl(242, 67%, 55%)" />
      </svg>
      {showText &&
      <span className="text-lg font-semibold text-primary-foreground">
          mijnhuis<span className="text-primary">.nu</span>
        </span>
      }
    </div>);

};

export default Logo;