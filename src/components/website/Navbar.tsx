import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Hoe het werkt", href: "#hoe-het-werkt" },
  { label: "Voordelen", href: "#voordelen" },
  { label: "Prijzen", href: "/prijzen", isRoute: true },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href: string) => {
    setIsOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-card/95 backdrop-blur-md shadow-lg border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Logo />

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              (link as any).isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-colors ${
                    scrolled
                      ? "text-foreground/70 hover:text-primary"
                      : "text-background/70 hover:text-background"
                  }`}
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className={`text-sm font-medium transition-colors ${
                    scrolled
                      ? "text-foreground/70 hover:text-primary"
                      : "text-background/70 hover:text-background"
                  }`}
                >
                  {link.label}
                </button>
              )
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              asChild
              className={scrolled ? "" : "text-background hover:text-background hover:bg-background/10"}
            >
              <Link to="/login">Inloggen</Link>
            </Button>
            <Button
              className="rounded-pill px-6"
              asChild
            >
              <Link to="/signup">Gratis proberen</Link>
            </Button>
          </div>

          <button
            className={`md:hidden p-2 ${scrolled ? "text-foreground" : "text-background"}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-md border-b border-border animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="block w-full text-left py-2 px-3 rounded-lg text-foreground/70 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <Button variant="ghost" asChild className="justify-start">
                <Link to="/login">Inloggen</Link>
              </Button>
              <Button
                className="rounded-pill"
                asChild
              >
                <Link to="/signup">Gratis proberen</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
