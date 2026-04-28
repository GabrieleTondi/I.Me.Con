import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CTA } from "@/components/sections/CTA";
import { AboutHero } from "@/components/sections/about/AboutHero";
import { Mission } from "@/components/sections/about/Mission";
import { Values } from "@/components/sections/about/Values";

export default function ChiSiamo() {
  return (
    <main className="flex min-h-screen flex-col bg-brand-bg selection:bg-brand-accent/30 selection:text-white">
      <Header />
      <div className="flex-1">
        <AboutHero />
        <Mission />
        <Values />
        <CTA />
      </div>
      <Footer />
    </main>
  );
}
