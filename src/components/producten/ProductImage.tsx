import { Package } from "lucide-react";

const brandLogos: Record<string, string> = {
  solaredge: "https://logo.clearbit.com/solaredge.com",
  enphase: "https://logo.clearbit.com/enphase.com",
  sma: "https://logo.clearbit.com/sma.de",
  huawei: "https://logo.clearbit.com/huawei.com",
  lg: "https://logo.clearbit.com/lg.com",
  samsung: "https://logo.clearbit.com/samsung.com",
  tesla: "https://logo.clearbit.com/tesla.com",
  byd: "https://logo.clearbit.com/byd.com",
  daikin: "https://logo.clearbit.com/daikin.com",
  trina: "https://logo.clearbit.com/trinasolar.com",
  "trina solar": "https://logo.clearbit.com/trinasolar.com",
  "canadian solar": "https://logo.clearbit.com/canadiansolar.com",
  jinko: "https://logo.clearbit.com/jinkosolar.com",
  "ja solar": "https://logo.clearbit.com/jasolar.com",
  longi: "https://logo.clearbit.com/longi.com",
  growatt: "https://logo.clearbit.com/growatt.com",
  fronius: "https://logo.clearbit.com/fronius.com",
  goodwe: "https://logo.clearbit.com/goodwe.com",
  fox: "https://logo.clearbit.com/foxessenergy.com",
  "fox ess": "https://logo.clearbit.com/foxessenergy.com",
  bosch: "https://logo.clearbit.com/bosch.com",
  vaillant: "https://logo.clearbit.com/vaillant.com",
  mitsubishi: "https://logo.clearbit.com/mitsubishielectric.com",
  panasonic: "https://logo.clearbit.com/panasonic.com",
  alfen: "https://logo.clearbit.com/alfen.com",
  "abb": "https://logo.clearbit.com/abb.com",
  wallbox: "https://logo.clearbit.com/wallbox.com",
};

function getBrandLogoUrl(merk: string | null): string | null {
  if (!merk) return null;
  const key = merk.toLowerCase().trim();
  return brandLogos[key] || null;
}

interface ProductImageProps {
  afbeeldingUrl: string | null;
  merk: string | null;
  naam: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
};

export default function ProductImage({ afbeeldingUrl, merk, naam, size = "sm" }: ProductImageProps) {
  const cls = sizeClasses[size];

  if (afbeeldingUrl) {
    return (
      <img
        src={afbeeldingUrl}
        alt={naam}
        className={`${cls} rounded-lg object-cover bg-muted`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
          (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
        }}
      />
    );
  }

  const logoUrl = getBrandLogoUrl(merk);
  if (logoUrl) {
    return (
      <div className={`${cls} rounded-lg bg-muted flex items-center justify-center p-1.5`}>
        <img
          src={logoUrl}
          alt={merk || ""}
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent) {
              parent.innerHTML = '';
              const span = document.createElement('span');
              span.className = 'text-xs font-bold text-muted-foreground';
              span.textContent = (merk || '?')[0].toUpperCase();
              parent.appendChild(span);
            }
          }}
        />
      </div>
    );
  }

  if (merk) {
    return (
      <div className={`${cls} rounded-lg bg-muted flex items-center justify-center`}>
        <span className="text-sm font-bold text-muted-foreground">{merk[0].toUpperCase()}</span>
      </div>
    );
  }

  return (
    <div className={`${cls} rounded-lg bg-muted flex items-center justify-center`}>
      <Package className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
