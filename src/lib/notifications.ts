import fs from "fs/promises";
import path from "path";

export interface Participant {
  denominazione: string;
  email: string | null;
  telefono?: string | null;
  role: string;
  dataNascita?: string | null;
  indirizzoResidenza?: string | null;
  comuneResidenza?: string | null;
  capResidenza?: string | null;
  provinciaResidenza?: string | null;
}

export interface MediationDetails {
  protocollo: string;
  materia: string;
  valore: string;
  descrizioneFatti: string;
  istante: {
    denominazione: string;
    email: string;
    telefono?: string | null;
    dataNascita?: string | null;
    indirizzoResidenza?: string | null;
    comuneResidenza?: string | null;
    capResidenza?: string | null;
    provinciaResidenza?: string | null;
  };
  convenuto: {
    denominazione: string;
    email: string;
    telefono?: string | null;
    dataNascita?: string | null;
    indirizzoResidenza?: string | null;
    comuneResidenza?: string | null;
    capResidenza?: string | null;
    provinciaResidenza?: string | null;
  };
  avvocato?: { denominazione: string; email: string } | null;
}

export async function sendMediationNotifications(details: MediationDetails) {
  const participants: Participant[] = [
    {
      denominazione: details.istante.denominazione,
      email: details.istante.email,
      telefono: details.istante.telefono,
      role: "Istante",
      dataNascita: details.istante.dataNascita,
      indirizzoResidenza: details.istante.indirizzoResidenza,
      comuneResidenza: details.istante.comuneResidenza,
      capResidenza: details.istante.capResidenza,
      provinciaResidenza: details.istante.provinciaResidenza,
    },
    {
      denominazione: details.convenuto.denominazione,
      email: details.convenuto.email,
      telefono: details.convenuto.telefono,
      role: "Convenuto",
      dataNascita: details.convenuto.dataNascita,
      indirizzoResidenza: details.convenuto.indirizzoResidenza,
      comuneResidenza: details.convenuto.comuneResidenza,
      capResidenza: details.convenuto.capResidenza,
      provinciaResidenza: details.convenuto.provinciaResidenza,
    },
  ];

  if (details.avvocato) {
    participants.push({
      denominazione: details.avvocato.denominazione,
      email: details.avvocato.email,
      role: "Avvocato Istante",
    });
  }

  const logEntries: string[] = [];
  const nowStr = new Date().toISOString();

  for (const p of participants) {
    // 1. Email Send simulation (No-Reply)
    if (p.email) {
      const emailContent = `
========================================
[EMAIL SEND SIMULATION]
Timestamp: ${nowStr}
Sender: no-reply@imecon.it
Recipient: ${p.email} (${p.denominazione})
Subject: [I.Me.Con] Conferma Presa in Carico Procedura di Mediazione - ${details.protocollo}
----------------------------------------
Gentile ${p.denominazione},

Con la presente Le confermiamo l'effettiva presa in carico della richiesta di mediazione da parte dell'Istituto I.Me.Con.

Dettagli della procedura:
- Numero Protocollo: ${details.protocollo}
- Il Suo ruolo nella procedura: ${p.role}${p.dataNascita ? `\n- Data di Nascita/Costituzione: ${p.dataNascita}` : ""}${p.indirizzoResidenza ? `\n- Residenza/Sede: ${p.indirizzoResidenza}, ${p.capResidenza || ""} ${p.comuneResidenza || ""} (${p.provinciaResidenza || ""})` : ""}
- Oggetto/Materia della lite: ${details.materia}
- Valore della controversia: € ${details.valore === "0.00" ? "Indeterminato" : details.valore}

Descrizione dei fatti:
${details.descrizioneFatti}

Questa è una comunicazione automatica da un indirizzo non monitorato (no-reply). Si prega di non rispondere a questo messaggio.

Cordiali saluti,
Istituto I.Me.Con.
========================================
`;
      console.log(emailContent);
      logEntries.push(emailContent);
    }

    // 2. SMS Send simulation (No-Reply)
    if (p.telefono) {
      const smsContent = `
========================================
[SMS SEND SIMULATION]
Timestamp: ${nowStr}
Sender: I.Me.Con. No-Reply
Recipient: ${p.telefono} (${p.denominazione})
----------------------------------------
I.Me.Con. No-Reply: Conferma presa in carico mediazione ${details.protocollo}. Ruolo: ${p.role}. Oggetto: ${details.materia}. Valore: EUR ${details.valore === "0.00" ? "Indeterminato" : details.valore}. Questa è una notifica automatica, si prega di non rispondere.
========================================
`;
      console.log(smsContent);
      logEntries.push(smsContent);
    }
  }

  // Write notifications to a local log file for testing verification
  try {
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
    const logFilePath = path.join(uploadDir, "notifications.log");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.appendFile(logFilePath, logEntries.join("\n") + "\n", "utf-8");
  } catch (err) {
    console.error("Failed to write notifications to log file:", err);
  }
}
