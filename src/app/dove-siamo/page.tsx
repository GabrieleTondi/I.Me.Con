import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CTA } from "@/components/sections/CTA";
import { LocationHero } from "@/components/sections/location/LocationHero";
import { OfficesMap } from "@/components/sections/location/OfficesMap";

export default function DoveSiamo() {
  return (
    <main className="flex min-h-screen flex-col selection:bg-brand-accent/30 selection:text-white">
      <Header />
      <div className="flex-1">
        <LocationHero />
        <OfficesMap />
        <CTA />
      </div>
      <Footer />
    </main>
  );
}
