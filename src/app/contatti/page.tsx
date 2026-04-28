import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ContactArea } from "@/components/sections/contact/ContactArea";

export default function Contatti() {
  return (
    <main className="flex min-h-screen flex-col selection:bg-brand-accent/30 selection:text-white">
      <Header />
      <div className="flex-1">
        <ContactArea />
      </div>
      <Footer />
    </main>
  );
}
