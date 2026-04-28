import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { CTA } from "@/components/sections/CTA";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-brand-bg selection:bg-brand-third/30 selection:text-white">
      <Header />
      <div className="flex-1">
        <Hero />
        <Stats />
        <CTA />
      </div>
      <Footer />
    </main>
  );
}
