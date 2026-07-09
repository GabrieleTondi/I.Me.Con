import { db } from "./index";
import { ruolo, statoMediazione } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Inizio seeding del database...");

  // 1. Inserimento dei Ruoli di Sistema
  const roles = ["Amministratore", "Mediatore", "Segreteria", "Utente Standard"];
  for (const roleName of roles) {
    const existing = await db.query.ruolo.findFirst({
      where: eq(ruolo.nomeRuolo, roleName),
    });
    if (!existing) {
      await db.insert(ruolo).values({ nomeRuolo: roleName });
      console.log(`Ruolo creato: ${roleName}`);
    } else {
      console.log(`Ruolo esistente: ${roleName}`);
    }
  }

  // 2. Inserimento degli Stati Mediazione standard
  const states = [
    { codice: "DA_ASSEGNARE", descrizione: "In attesa di assegnazione mediatore" },
    { codice: "IN_CORSO", descrizione: "Procedimento in corso" },
    { codice: "CONCILIATA", descrizione: "Mediazione conclusa con accordo" },
    { codice: "NON_CONCILIATA", descrizione: "Mediazione conclusa senza accordo" },
    { codice: "ARCHIVIATA", descrizione: "Pratica archiviata" },
  ];

  for (const state of states) {
    const existing = await db.query.statoMediazione.findFirst({
      where: eq(statoMediazione.codice, state.codice),
    });
    if (!existing) {
      await db.insert(statoMediazione).values(state);
      console.log(`Stato creato: ${state.codice}`);
    } else {
      console.log(`Stato esistente: ${state.codice}`);
    }
  }

  console.log("Seeding completato con successo!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Errore durante il seeding:", err);
  process.exit(1);
});
