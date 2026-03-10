import Navbar from "@/components/website/Navbar";
import HeroSection from "@/components/website/HeroSection";
import ServicesSection from "@/components/website/ServicesSection";
import HowItWorksSection from "@/components/website/HowItWorksSection";
import BenefitsSection from "@/components/website/BenefitsSection";
import TestimonialsSection from "@/components/website/TestimonialsSection";
import CTASection from "@/components/website/CTASection";
import Footer from "@/components/website/Footer";

const Home = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <ServicesSection />
    <HowItWorksSection />
    <BenefitsSection />
    <TestimonialsSection />
    <CTASection />
    <Footer />
  </div>
);

export default Home;
