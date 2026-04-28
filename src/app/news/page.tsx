import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CTA } from "@/components/sections/CTA";
import { NewsHero } from "@/components/sections/news/NewsHero";
import { NewsContainer } from "@/components/sections/news/NewsContainer";

export default function News() {
  return (
    <main className="flex min-h-screen flex-col selection:bg-brand-accent/30 selection:text-white">
      <Header />
      <div className="flex-1">
        <NewsHero />
        <NewsContainer />
        <CTA />
      </div>
      <Footer />
    </main>
  );
}
