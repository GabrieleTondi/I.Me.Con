import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import { sendMediationNotifications } from "@/lib/notifications";

describe("Automated Notifications Helper", () => {
  const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
  const logFilePath = path.join(uploadDir, "notifications.log");

  beforeEach(async () => {
    // Ensure clean state by deleting the notification log before each test
    try {
      await fs.unlink(logFilePath);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  it("should generate and log no-reply notifications for Istante and Convenuto with residence and birth date", async () => {
    const details = {
      protocollo: "ADR-TEST-NOTIF-001",
      materia: "Controversia di Condominio",
      valore: "2500.00",
      descrizioneFatti: "Danni da infiltrazione d'acqua dall'appartamento sovrastante.",
      istante: {
        denominazione: "Mario Rossi",
        email: "mario.rossi@example.com",
        telefono: "+393331111111",
        dataNascita: "1980-05-10",
        indirizzoResidenza: "Via Roma 1",
        comuneResidenza: "Milano",
        capResidenza: "20100",
        provinciaResidenza: "MI",
      },
      convenuto: {
        denominazione: "Luigi Bianchi",
        email: "luigi.bianchi@example.com",
        telefono: "+393332222222",
        indirizzoResidenza: "Piazza Duomo 5",
        comuneResidenza: "Milano",
        capResidenza: "20121",
        provinciaResidenza: "MI",
      },
      avvocato: null,
    };

    await sendMediationNotifications(details);

    const logExists = await fs.access(logFilePath).then(() => true).catch(() => false);
    expect(logExists).toBe(true);

    const logContent = await fs.readFile(logFilePath, "utf-8");

    // Verify Email contents
    expect(logContent).toContain("Sender: no-reply@imecon.it");
    expect(logContent).toContain("Recipient: mario.rossi@example.com");
    expect(logContent).toContain("Recipient: luigi.bianchi@example.com");
    expect(logContent).toContain("Il Suo ruolo nella procedura: Istante");
    expect(logContent).toContain("Il Suo ruolo nella procedura: Convenuto");
    expect(logContent).toContain("Data di Nascita/Costituzione: 1980-05-10");
    expect(logContent).toContain("Residenza/Sede: Via Roma 1, 20100 Milano (MI)");
    expect(logContent).toContain("Residenza/Sede: Piazza Duomo 5, 20121 Milano (MI)");
    expect(logContent).toContain("Numero Protocollo: ADR-TEST-NOTIF-001");
    expect(logContent).toContain("Oggetto/Materia della lite: Controversia di Condominio");
    expect(logContent).toContain("Valore della controversia: € 2500.00");
    expect(logContent).toContain("no-reply");

    // Verify SMS contents
    expect(logContent).toContain("Sender: I.Me.Con. No-Reply");
    expect(logContent).toContain("Recipient: +393331111111");
    expect(logContent).toContain("Recipient: +393332222222");
    expect(logContent).toContain("Ruolo: Istante");
    expect(logContent).toContain("Ruolo: Convenuto");
    expect(logContent).toContain("presa in carico mediazione ADR-TEST-NOTIF-001");
  });

  it("should include Avvocato Istante in the notifications list if present", async () => {
    const details = {
      protocollo: "ADR-TEST-NOTIF-002",
      materia: "Contratto Commerciale",
      valore: "0.00", // Indeterminato
      descrizioneFatti: "Mancato adempimento termini contrattuali di fornitura merci.",
      istante: {
        denominazione: "Tech S.r.l.",
        email: "info@techsrl.com",
        telefono: null, // No SMS for istante
      },
      convenuto: {
        denominazione: "Global Corp",
        email: "legal@globalcorp.com",
        telefono: "+393334444444",
      },
      avvocato: {
        denominazione: "Avv. Francesco Neri",
        email: "francesco.neri@studiolegale.it",
      },
    };

    await sendMediationNotifications(details);

    const logContent = await fs.readFile(logFilePath, "utf-8");

    // Verify Avvocato email notification
    expect(logContent).toContain("Recipient: francesco.neri@studiolegale.it (Avv. Francesco Neri)");
    expect(logContent).toContain("Il Suo ruolo nella procedura: Avvocato Istante");
    expect(logContent).toContain("Numero Protocollo: ADR-TEST-NOTIF-002");
    expect(logContent).toContain("Valore della controversia: € Indeterminato");

    // Verify Tech S.r.l. got email but no SMS
    expect(logContent).toContain("Recipient: info@techsrl.com");
    expect(logContent).not.toContain("Recipient: null");

    // Verify Global Corp got email and SMS
    expect(logContent).toContain("Recipient: legal@globalcorp.com");
    expect(logContent).toContain("Recipient: +393334444444");
  });
});
