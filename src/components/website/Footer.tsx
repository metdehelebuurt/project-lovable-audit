import Logo from "@/components/Logo";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => (
  <footer className="bg-foreground text-background/70 pt-16 pb-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        {/* Brand */}
        <div>
          <div className="mb-4 [&_svg_path]:fill-background/80 [&_span]:text-background/90 [&_.text-primary]:text-primary">
            <Logo />
          </div>
          <p className="text-sm leading-relaxed">
            Het platform voor duurzame woningverbeteringen. Van advies tot
            installatie, wij regelen het.
          </p>
        </div>

        {/* Diensten */}
        <div>
          <h4 className="text-background font-semibold mb-4">Diensten</h4>
          <ul className="space-y-2 text-sm">
            <li>Zonnepanelen</li>
            <li>Warmtepompen</li>
            <li>Isolatie</li>
            <li>Thuisbatterij</li>
            <li>Laadpaal</li>
          </ul>
        </div>

        {/* Bedrijf */}
        <div>
          <h4 className="text-background font-semibold mb-4">Bedrijf</h4>
          <ul className="space-y-2 text-sm">
            <li>Over ons</li>
            <li>Hoe het werkt</li>
            <li>Partners worden</li>
            <li>Veelgestelde vragen</li>
          </ul>
        </div>

        {/* Contact */}
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
          <span className="hover:text-background cursor-pointer">Privacy</span>
          <span className="hover:text-background cursor-pointer">Voorwaarden</span>
          <span className="hover:text-background cursor-pointer">Cookies</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
