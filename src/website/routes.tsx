import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import SiteLayout from "./SiteLayout";

const Affiliate = lazy(() => import("@/website/pages/Affiliate"));
const ArtikelLoadBalancingLaadpalen = lazy(() => import("@/website/pages/ArtikelLoadBalancingLaadpalen"));
const ArtikelNen1010VeelgemaakteFouten = lazy(() => import("@/website/pages/ArtikelNen1010VeelgemaakteFouten"));
const ArtikelOfferteInVijfMinuten = lazy(() => import("@/website/pages/ArtikelOfferteInVijfMinuten"));
const ArtikelOverstappenInDrieWeken = lazy(() => import("@/website/pages/ArtikelOverstappenInDrieWeken"));
const ArtikelSubsidies2026ZonPv = lazy(() => import("@/website/pages/ArtikelSubsidies2026ZonPv"));
const ArtikelWarmtepompInregelenOpleveren = lazy(() => import("@/website/pages/ArtikelWarmtepompInregelenOpleveren"));
const BrancheIsolatie = lazy(() => import("@/website/pages/BrancheIsolatie"));
const BrancheLaadpalen = lazy(() => import("@/website/pages/BrancheLaadpalen"));
const BrancheThuisbatterijen = lazy(() => import("@/website/pages/BrancheThuisbatterijen"));
const BrancheWarmtepompen = lazy(() => import("@/website/pages/BrancheWarmtepompen"));
const BrancheZonnepanelen = lazy(() => import("@/website/pages/BrancheZonnepanelen"));
const Branches = lazy(() => import("@/website/pages/Branches"));
const Contact = lazy(() => import("@/website/pages/Contact"));
const Demo = lazy(() => import("@/website/pages/Demo"));
const Functionaliteiten = lazy(() => import("@/website/pages/Functionaliteiten"));
const Home = lazy(() => import("@/website/pages/Home"));
const Inloggen = lazy(() => import("@/website/pages/Inloggen"));
const Juridisch = lazy(() => import("@/website/pages/Juridisch"));
const Kennisbank = lazy(() => import("@/website/pages/Kennisbank"));
const Kennismaking = lazy(() => import("@/website/pages/Kennismaking"));
const Succesverhalen = lazy(() => import("@/website/pages/Succesverhalen"));
const OplossingKlantportaal = lazy(() => import("@/website/pages/OplossingKlantportaal"));
const OplossingLead = lazy(() => import("@/website/pages/OplossingLead"));
const OplossingMonteursapp = lazy(() => import("@/website/pages/OplossingMonteursapp"));
const OplossingOfferte = lazy(() => import("@/website/pages/OplossingOfferte"));
const OplossingOplevering = lazy(() => import("@/website/pages/OplossingOplevering"));
const OplossingPlanning = lazy(() => import("@/website/pages/OplossingPlanning"));
const OplossingRapportage = lazy(() => import("@/website/pages/OplossingRapportage"));
const OplossingSchouw = lazy(() => import("@/website/pages/OplossingSchouw"));
const Over = lazy(() => import("@/website/pages/Over"));
const Prijzen = lazy(() => import("@/website/pages/Prijzen"));
const Proefperiode = lazy(() => import("@/website/pages/Proefperiode"));

export const websiteRoutes = (
  <Route
    element={
      <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
        <SiteLayout />
      </Suspense>
    }
  >
      <Route path="/affiliate" element={<Affiliate />} />
      <Route path="/kennisbank/load-balancing-laadpalen" element={<ArtikelLoadBalancingLaadpalen />} />
      <Route path="/kennisbank/nen-1010-veelgemaakte-fouten" element={<ArtikelNen1010VeelgemaakteFouten />} />
      <Route path="/kennisbank/offerte-in-vijf-minuten" element={<ArtikelOfferteInVijfMinuten />} />
      <Route path="/kennisbank/overstappen-in-drie-weken" element={<ArtikelOverstappenInDrieWeken />} />
      <Route path="/kennisbank/subsidies-2026-zon-pv" element={<ArtikelSubsidies2026ZonPv />} />
      <Route path="/kennisbank/warmtepomp-inregelen-opleveren" element={<ArtikelWarmtepompInregelenOpleveren />} />
      <Route path="/branches/isolatie" element={<BrancheIsolatie />} />
      <Route path="/branches/laadpalen" element={<BrancheLaadpalen />} />
      <Route path="/branches/thuisbatterijen" element={<BrancheThuisbatterijen />} />
      <Route path="/branches/warmtepompen" element={<BrancheWarmtepompen />} />
      <Route path="/branches/zonnepanelen" element={<BrancheZonnepanelen />} />
      <Route path="/branches" element={<Branches />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/functionaliteiten" element={<Functionaliteiten />} />
      <Route path="/" element={<Home />} />
      <Route path="/website-inloggen" element={<Inloggen />} />
      <Route path="/juridisch" element={<Juridisch />} />
      <Route path="/kennisbank" element={<Kennisbank />} />
      <Route path="/kennismaking" element={<Kennismaking />} />
      <Route path="/succesverhalen" element={<Succesverhalen />} />
      <Route path="/oplossingen/klantportaal" element={<OplossingKlantportaal />} />
      <Route path="/oplossingen/lead" element={<OplossingLead />} />
      <Route path="/oplossingen/monteursapp" element={<OplossingMonteursapp />} />
      <Route path="/oplossingen/offerte" element={<OplossingOfferte />} />
      <Route path="/oplossingen/oplevering" element={<OplossingOplevering />} />
      <Route path="/oplossingen/planning" element={<OplossingPlanning />} />
      <Route path="/oplossingen/rapportage" element={<OplossingRapportage />} />
      <Route path="/oplossingen/schouw" element={<OplossingSchouw />} />
      <Route path="/over" element={<Over />} />
      <Route path="/prijzen" element={<Prijzen />} />
      <Route path="/proefperiode" element={<Proefperiode />} />
  </Route>
);
