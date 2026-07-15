import { db } from "../db";
import { ruolo, statoMediazione } from "../db/schema";

async function verify() {
  console.log("=== VERIFICA INTEGRITÀ DATABASE ED ESITO SEEDING ===");
  
  try {
    // 1. Verifica la presenza dei Ruoli
    const roles = await db.select().from(ruolo);
    console.log(`Ruoli trovati nel DB: ${roles.length}`);
    roles.forEach(r => console.log(` - [ID ${r.id}] ${r.nomeQualifica || r.nomeRuolo}`));

    const requiredRoles = ["Amministratore", "Mediatore", "Segreteria", "Utente Standard"];
    const foundRoleNames = roles.map(r => r.nomeRuolo);
    const missingRoles = requiredRoles.filter(role => !foundRoleNames.includes(role));

    if (missingRoles.length > 0) {
      console.error(`❌ ERRORE: Ruoli mancanti: ${missingRoles.join(", ")}`);
      process.exit(1);
    }
    console.log("✅ Tutti i ruoli necessari sono presenti nel database.");

    // 2. Verifica la presenza degli Stati Mediazione
    const states = await db.select().from(statoMediazione);
    console.log(`Stati di mediazione trovati nel DB: ${states.length}`);
    states.forEach(s => console.log(` - [${s.codice}] ${s.descrizione}`));

    const requiredStates = ["DA_ASSEGNARE", "IN_CORSO", "CONCILIATA", "NON_CONCILIATA", "ARCHIVIATA"];
    const foundStateCodes = states.map(s => s.codice);
    const missingStates = requiredStates.filter(code => !foundStateCodes.includes(code));

    if (missingStates.length > 0) {
      console.error(`❌ ERRORE: Stati mediazione mancanti: ${missingStates.join(", ")}`);
      process.exit(1);
    }
    console.log("✅ Tutti gli stati di mediazione necessari sono presenti nel database.");
    
    console.log("🎉 DATABASE INTEGRITY CHECK: SUCCESS\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERRORE durante la connessione/verifica del database:", error);
    process.exit(1);
  }
}

verify();
