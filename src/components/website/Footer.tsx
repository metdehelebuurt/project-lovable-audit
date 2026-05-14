import Logo from "@/components/Logo";
import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-foreground text-background/70 pt-16 pb-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid sm:grid-cols-2 gap-10 mb-12">
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
          <h4 className="text-background font-semibold mb-4">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Mail size={14} /> info@mijnhuis.nu
            </li>
             <li className="flex items-center gap-2">
               <Phone size={14} /> 085-8000272
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
