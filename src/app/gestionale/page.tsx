import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { mediazione } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { GestionaleClient } from "./GestionaleClient";

export default async function Page() {
  const user = await getCurrentUser();

  // Sicurezza: solo gli Amministratori possono accedere al gestionale
  if (!user || !user.ruoli.includes("Amministratore")) {
    redirect("/login");
  }

  const mediazioniList = await db.query.mediazione.findMany({
    orderBy: [desc(mediazione.id)],
    with: {
      stato: true,
      area: true,
      mediatore: true,
      soggetti: {
        with: {
          soggetto: true,
        },
      },
      documenti: true,
    },
  });

  const serializedMediazioni = mediazioniList.map((m) => ({
    id: m.id,
    protocollo: m.protocollo,
    oggetto: m.oggetto,
    valore: m.valore,
    dataInserimento: m.dataInserimento,
    stato: m.stato,
    area: m.area,
    mediatore: m.mediatore ? {
      id: m.mediatore.id,
      nomeCognome: m.mediatore.nomeCognome,
      email: m.mediatore.email,
    } : null,
    soggetti: m.soggetti.map((ms) => ({
      ruoloNellaLite: ms.ruoloNellaLite,
      soggetto: {
        id: ms.soggetto.id,
        tipoSoggetto: ms.soggetto.tipoSoggetto,
        denominazione: ms.soggetto.denominazione,
        codiceFiscalePiva: ms.soggetto.codiceFiscalePiva,
        email: ms.soggetto.email,
        telefono: ms.soggetto.telefono,
      },
    })),
    documenti: m.documenti.map((d) => ({
      id: d.id,
      nomeFile: d.nomeFile,
      nomeOriginale: d.nomeOriginale,
      tipoMime: d.tipoMime,
      dimensione: d.dimensione,
      dataCaricamento: d.dataCaricamento.toISOString(),
    })),
  }));

  return (
    <main className="flex min-h-screen flex-col bg-brand-bg selection:bg-brand-accent/30 selection:text-white">
      <Header />
      <div className="flex-1 pt-28 pb-16">
        <GestionaleClient initialMediazioni={serializedMediazioni} user={user} />
      </div>
      <Footer />
    </main>
  );
}
