import { db } from "@/db";
import { mediazione } from "@/db/schema";
import { and, isNotNull } from "drizzle-orm";
import { getMediationDeadline } from "./deadline-utils";

export interface WarningEmailLog {
  recipient: string;
  subject: string;
  body: string;
}

export async function checkDeadlinesAndNotify(referenceDate?: Date): Promise<WarningEmailLog[]> {
  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);

  // Carichiamo le mediazioni con mediatore assegnato
  const mediations = await db.query.mediazione.findMany({
    where: isNotNull(mediazione.mediatoreId),
    with: {
      stato: true,
      mediatore: true,
    },
  });

  const sentLogs: WarningEmailLog[] = [];

  for (const med of mediations) {
    // Escludiamo se lo stato è già concluso
    const isConclusa = [
      "ACCORDO_RAGGIUNTO",
      "ASSENZA_CONVENUTO",
      "ASSENZA_CONVENUTO_PROPOSTA",
      "MANCATO_ACCORDO",
      "ESTINTO_ASSENZA_PARTI",
      "ARCHIVIATA",
    ].includes(med.stato.codice);

    if (isConclusa || !med.mediatore) {
      continue;
    }

    const deadlineDate = getMediationDeadline(med.dataInserimento, med.prorogata, med.scadenzaPersonalizzata);
    deadlineDate.setHours(0, 0, 0, 0);

    const daysRemaining = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Se mancano esattamente 10 giorni alla scadenza
    if (daysRemaining === 10) {
      const nowStr = new Date().toISOString();
      const subject = `[I.Me.Con] Sollecito Scadenza Procedura di Mediazione - ${med.protocollo}`;
      const body = `
========================================
[EMAIL SEND SIMULATION]
Timestamp: ${nowStr}
Sender: no-reply@imecon.it
Recipient: ${med.mediatore.email} (${med.mediatore.nomeCognome})
Subject: ${subject}
----------------------------------------
Gentile ${med.mediatore.nomeCognome},

Con la presente Le ricordiamo che la procedura di mediazione in oggetto sta per giungere alla scadenza legale.

Dettagli della procedura:
- Numero Protocollo: ${med.protocollo}
- Oggetto/Materia: ${med.oggetto}
- Data Inserimento: ${med.dataInserimento}
- Prorogata: ${med.prorogata ? "Sì (limite 12 mesi)" : "No (limite 6 mesi)"}${med.scadenzaPersonalizzata ? `\n- Scadenza Personalizzata: ${med.scadenzaPersonalizzata}` : ""}
- Giorni alla scadenza: 10 giorni

La preghiamo di concludere il procedimento registrandone l'esito o di richiedere un'eventuale proroga d'intesa con le parti se applicabile.

Questa è una comunicazione automatica da un indirizzo non monitorato (no-reply). Si prega di non rispondere a questo messaggio.

Cordiali saluti,
Istituto I.Me.Con.
========================================
`;
      console.log(body);
      sentLogs.push({
        recipient: med.mediatore.email,
        subject,
        body,
      });
    }
  }

  return sentLogs;
}
