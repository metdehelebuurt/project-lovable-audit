import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/website/Navbar";
import Footer from "@/components/website/Footer";
import HeroV2 from "@/components/website/v2/HeroV2";
import TrustBar from "@/components/website/v2/TrustBar";
import ProblemSection from "@/components/website/v2/ProblemSection";
import PillarsSection from "@/components/website/v2/PillarsSection";
import BranchSwitcher from "@/components/website/v2/BranchSwitcher";
import CaseStudySection from "@/components/website/v2/CaseStudySection";
import CTAV2 from "@/components/website/v2/CTAV2";
import { useDocumentSeo } from "@/lib/seo/useDocumentSeo";

const Home = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  useDocumentSeo({
    title: "mijnhuis.nu — Software voor de verduurzamingsbranche",
    description:
      "Eén Nederlands platform voor leads, schouwen, offertes, planning en klantportaal. Voor installateurs van zonnepanelen, warmtepompen, thuisbatterijen en isolatie.",
    canonical: "https://mijnhuis.nu/",
    type: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "mijnhuis.nu",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "120" },
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroV2 />
      <TrustBar />
      <ProblemSection />
      <PillarsSection />
      <BranchSwitcher />
      <CaseStudySection />
      <CTAV2 />
      <Footer />
    </div>
  );
};

export default Home;
