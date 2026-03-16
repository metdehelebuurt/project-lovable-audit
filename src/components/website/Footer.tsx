import Logo from "@/components/Logo";
import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-foreground text-background/70 pt-16 pb-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        <div>
          <div className="mb-4">
            <Logo variant="white" />
          </div>
          <p className="text-sm leading-relaxed">
            Het alles-in-één platform voor installateurs en adviseurs in de
            verduurzamingsbranche.
          </p>
        </div>

        <div>
          <h4 className="text-background font-semibold mb-4">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/features/offertes" className="hover:text-background transition-colors">Offertes op locatie</Link></li>
            <li><Link to="/features/digitale-schouwen" className="hover:text-background transition-colors">Digitale schouwen</Link></li>
            <li><Link to="/features/planning" className="hover:text-background transition-colors">Planning & agenda</Link></li>
            <li><Link to="/features/leadbeheer" className="hover:text-background transition-colors">Klant- & leadbeheer</Link></li>
            <li><Link to="/features/rapportages" className="hover:text-background transition-colors">Rapportages</Link></li>
            <li><Link to="/features/webtools" className="hover:text-background transition-colors">Webtools & widgets</Link></li>
            <li><Link to="/features/energieadvies" className="hover:text-background transition-colors">Energieadvies tools</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-background font-semibold mb-4">Bedrijf</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/over-ons" className="hover:text-background transition-colors">Over ons</Link></li>
            <li><Link to="/prijzen" className="hover:text-background transition-colors">Prijzen</Link></li>
            <li><Link to="/partners-worden" className="hover:text-background transition-colors">Partners worden</Link></li>
            <li><Link to="/partners-worden" className="hover:text-background transition-colors">Affiliate worden</Link></li>
            <li><Link to="/veelgestelde-vragen" className="hover:text-background transition-colors">Veelgestelde vragen</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-background font-semibold mb-4">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Mail size={14} /> info@mijnhuis.nu
            </li>
            <li className="flex items-center gap-2">
              <Phone size={14} /> 088 - 123 4567
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={14} /> Amsterdam, Nederland
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-background/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
        <p>© {new Date().getFullYear()} mijnhuis.nu — Alle rechten voorbehouden</p>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-background transition-colors">Privacy</Link>
          <Link to="/voorwaarden" className="hover:text-background transition-colors">Voorwaarden</Link>
          <Link to="/cookies" className="hover:text-background transition-colors">Cookies</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
