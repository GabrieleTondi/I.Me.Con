"use server";

import { db } from "@/db";
import { mediazione, soggetto, mediazioneSoggetto, documento, statoMediazione, area } from "@/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";
import { sendMediationNotifications } from "@/lib/notifications";

// 1. Schema di validazione Zod per i dati testuali della richiesta di mediazione
const mediationSchema = z.object({
  // Sezione 1: Dati della Controversia (qui verranno allegati i documenti)
  areaId: z.coerce.number().int().positive("Seleziona una sede competente"),
  materia: z.string().min(2, "Seleziona la materia o oggetto della lite").max(200),
  valore: z.string().default("0.00"),
  valoreIndeterminato: z.enum(["true", "false"]).default("false"),
  descrizioneFatti: z.string().min(10, "Inserisci una descrizione di almeno 10 caratteri").max(5000, "Descrizione troppo lunga"),

  // Sezione 2: Dati Istante
  istanteTipo: z.enum(["PF", "PG"], { error: "Tipo istante non valido" }),
  istanteDenominazione: z.string().min(2, "Nome o Denominazione istante obbligatoria").max(255),
  istanteCodiceFiscale: z.string().min(5, "Codice Fiscale / P.IVA non valido").max(50),
  istanteEmail: z.string().email("Email istante non valida").max(255),
  istanteTelefono: z.string().max(50).nullable().optional(),
  istanteDataNascita: z.string().min(1, "Data di nascita o costituzione dell'istante obbligatoria"),
  istanteIndirizzo: z.string().min(1, "Indirizzo dell'istante obbligatorio").max(255),
  istanteComune: z.string().min(1, "Comune dell'istante obbligatorio").max(100),
  istanteCap: z.string().min(5, "CAP dell'istante obbligatorio (5 cifre)").max(10),
  istanteProvincia: z.string().min(2, "Provincia dell'istante obbligatoria (2-3 lettere)").max(10),

  // Sezione 2b: Dati Avvocato (opzionale)
  haAvvocato: z.enum(["true", "false"]).default("false"),
  avvocatoNome: z.string().max(255).optional(),
  avvocatoCodiceFiscale: z.string().max(50).optional(),
  avvocatoEmail: z.string().max(255).optional(),

  // Sezione 3: Dati Convenuto / Controparte
  convenutoTipo: z.enum(["PF", "PG"], { error: "Tipo convenuto non valido" }),
  convenutoDenominazione: z.string().min(2, "Nome o Denominazione convenuto obbligatoria").max(255),
  convenutoCodiceFiscale: z.string().max(50).nullable().optional(),
  convenutoEmail: z.string().email("Email/PEC convenuto non valida").max(255),
  convenutoTelefono: z.string().max(50).nullable().optional(),
  convenutoDataNascita: z.string().min(1, "Data di nascita o costituzione del convenuto obbligatoria"),
  convenutoIndirizzo: z.string().min(1, "Indirizzo del convenuto obbligatorio").max(255),
  convenutoComune: z.string().min(1, "Comune del convenuto obbligatorio").max(100),
  convenutoCap: z.string().min(5, "CAP del convenuto obbligatorio (5 cifre)").max(10),
  convenutoProvincia: z.string().min(2, "Provincia del convenuto obbligatoria (2-3 lettere)").max(10),
});

export async function getAreeAction() {
  const targetNames = ["Maglie", "Manfredonia", "Lecce"];
  let aree = await db.query.area.findMany();
  
  const hasIncorrectAree = aree.some(a => !targetNames.includes(a.nomeArea)) || aree.length !== targetNames.length;
  
  if (hasIncorrectAree || aree.length === 0) {
    try {
      // Proviamo ad eliminare le vecchie sedi se non ci sono vincoli
      await db.delete(area);
      await db.insert(area).values(targetNames.map(name => ({ nomeArea: name })));
      aree = await db.query.area.findMany();
    } catch (e) {
      // Se fallisce per vincoli di integrità (es. mediazioni collegate), inseriamo solo quelle mancanti
      for (const name of targetNames) {
        const exists = aree.some(a => a.nomeArea === name);
        if (!exists) {
          await db.insert(area).values({ nomeArea: name }).onConflictDoNothing();
        }
      }
      aree = await db.query.area.findMany();
    }
  }
  return aree;
}

// Estensioni file consentite per la sezione Dati Controversia
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".p7m"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per file

export async function createMediationRequestAction(formData: FormData) {
  try {
    // 1. Estrazione dati testuali dal FormData
    const rawData = {
      areaId: formData.get("areaId")?.toString() || "1",
      materia: formData.get("materia")?.toString().trim() || "",
      valore: formData.get("valore")?.toString().trim() || "0.00",
      valoreIndeterminato: formData.get("valoreIndeterminato")?.toString() || "false",
      descrizioneFatti: formData.get("descrizioneFatti")?.toString().trim() || "",

      istanteTipo: formData.get("istanteTipo")?.toString() || "PF",
      istanteDenominazione: formData.get("istanteDenominazione")?.toString().trim() || "",
      istanteCodiceFiscale: formData.get("istanteCodiceFiscale")?.toString().trim().toUpperCase() || "",
      istanteEmail: formData.get("istanteEmail")?.toString().trim().toLowerCase() || "",
      istanteTelefono: formData.get("istanteTelefono")?.toString().trim() || null,
      istanteDataNascita: formData.get("istanteDataNascita")?.toString().trim() || "",
      istanteIndirizzo: formData.get("istanteIndirizzo")?.toString().trim() || "",
      istanteComune: formData.get("istanteComune")?.toString().trim() || "",
      istanteCap: formData.get("istanteCap")?.toString().trim() || "",
      istanteProvincia: formData.get("istanteProvincia")?.toString().trim().toUpperCase() || "",

      haAvvocato: formData.get("haAvvocato")?.toString() || "false",
      avvocatoNome: formData.get("avvocatoNome")?.toString().trim() || "",
      avvocatoCodiceFiscale: formData.get("avvocatoCodiceFiscale")?.toString().trim().toUpperCase() || "",
      avvocatoEmail: formData.get("avvocatoEmail")?.toString().trim().toLowerCase() || "",

      convenutoTipo: formData.get("convenutoTipo")?.toString() || "PF",
      convenutoDenominazione: formData.get("convenutoDenominazione")?.toString().trim() || "",
      convenutoCodiceFiscale: formData.get("convenutoCodiceFiscale")?.toString().trim().toUpperCase() || null,
      convenutoEmail: formData.get("convenutoEmail")?.toString().trim().toLowerCase() || "",
      convenutoTelefono: formData.get("convenutoTelefono")?.toString().trim() || null,
      convenutoDataNascita: formData.get("convenutoDataNascita")?.toString().trim() || "",
      convenutoIndirizzo: formData.get("convenutoIndirizzo")?.toString().trim() || "",
      convenutoComune: formData.get("convenutoComune")?.toString().trim() || "",
      convenutoCap: formData.get("convenutoCap")?.toString().trim() || "",
      convenutoProvincia: formData.get("convenutoProvincia")?.toString().trim().toUpperCase() || "",
    };

    const parsed = mediationSchema.safeParse(rawData);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Errore di validazione dei campi";
      return { success: false, error: firstError };
    }

    const data = parsed.data;

    // Controllo coerenza avvocato se selezionato
    if (data.haAvvocato === "true") {
      if (!data.avvocatoNome || data.avvocatoNome.length < 2) {
        return { success: false, error: "Inserisci il nome e cognome dell'avvocato" };
      }
      if (!data.avvocatoCodiceFiscale || data.avvocatoCodiceFiscale.length < 5) {
        return { success: false, error: "Inserisci un Codice Fiscale valido per l'avvocato" };
      }
      if (!data.avvocatoEmail || !data.avvocatoEmail.includes("@")) {
        return { success: false, error: "Inserisci un indirizzo PEC o Email valido per l'avvocato" };
      }
    }

    // 2. Gestione Upload Documenti (SOLO PER SEZIONE DATI CONTROVERSIA)
    // Come specificato dall'utente, gli upload sono consentiti unicamente per la sezione Dati Controversia.
    const fileEntries = formData.getAll("documentiControversia");
    const validFiles: File[] = [];

    for (const entry of fileEntries) {
      if (entry && typeof entry === "object" && "size" in entry && (entry as File).size > 0) {
        const file = entry as File;

        // Controllo dimensione
        if (file.size > MAX_FILE_SIZE_BYTES) {
          return {
            success: false,
            error: `Il file "${file.name}" supera la dimensione massima consentita di 10 MB.`,
          };
        }

        // Controllo estensione
        const ext = path.extname(file.name).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          return {
            success: false,
            error: `Il formato del file "${file.name}" non è consentito. Formati ammessi: PDF, DOC, DOCX, JPG, PNG, P7M.`,
          };
        }

        validFiles.push(file);
      }
    }

    // 3. Verifica e recupero dello Stato di Mediazione (DA_ASSEGNARE)
    let stato = await db.query.statoMediazione.findFirst({
      where: eq(statoMediazione.codice, "DA_ASSEGNARE"),
    });

    if (!stato) {
      const [newStato] = await db
        .insert(statoMediazione)
        .values({
          codice: "DA_ASSEGNARE",
          descrizione: "In attesa di assegnazione mediatore",
        })
        .returning();
      stato = newStato;
    }

    // Assicuriamoci che l'area selezionata esista
    let areaScelta = await db.query.area.findFirst({
      where: eq(area.id, data.areaId),
    });

    if (!areaScelta) {
      const allAree = await getAreeAction();
      if (allAree.length > 0) {
        areaScelta = allAree[0];
      } else {
        return { success: false, error: "Sede di competenza non trovata." };
      }
    }

    // Generazione del Protocollo Univoco
    const year = new Date().getFullYear();
    const uniqueSuffix = Date.now().toString().slice(-6);
    const protocollo = `ADR-${year}-${uniqueSuffix}`;

    // 4. Esecuzione Transazione SQL su PostgreSQL
    const savedDocsMetadata: Array<{
      nomeFile: string;
      nomeOriginale: string;
      percorsoFile: string;
      tipoMime: string;
      dimensione: number;
    }> = [];

    // Salvataggio fisico dei file sul filesystem locale (prima di completare la transazione)
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || "./uploads/mediazioni");
    await fs.mkdir(uploadDir, { recursive: true });

    for (const file of validFiles) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const savedFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${safeName}`;
      const fullPath = path.join(uploadDir, savedFileName);

      const arrayBuffer = await file.arrayBuffer();
      await fs.writeFile(fullPath, Buffer.from(arrayBuffer));

      savedDocsMetadata.push({
        nomeFile: savedFileName,
        nomeOriginale: file.name,
        percorsoFile: fullPath,
        tipoMime: file.type || "application/octet-stream",
        dimensione: file.size,
      });
    }

    await db.transaction(async (tx) => {
      // A. Inserimento o upsert del Soggetto Istante
      const [soggettoIstante] = await tx
        .insert(soggetto)
        .values({
          tipoSoggetto: data.istanteTipo,
          denominazione: data.istanteDenominazione,
          codiceFiscalePiva: data.istanteCodiceFiscale,
          email: data.istanteEmail,
          telefono: data.istanteTelefono || null,
          dataNascita: data.istanteDataNascita || null,
          indirizzoResidenza: data.istanteIndirizzo || null,
          comuneResidenza: data.istanteComune || null,
          capResidenza: data.istanteCap || null,
          provinciaResidenza: data.istanteProvincia || null,
        })
        .onConflictDoUpdate({
          target: [soggetto.codiceFiscalePiva],
          set: {
            denominazione: data.istanteDenominazione,
            email: data.istanteEmail,
            telefono: data.istanteTelefono || null,
            dataNascita: data.istanteDataNascita || null,
            indirizzoResidenza: data.istanteIndirizzo || null,
            comuneResidenza: data.istanteComune || null,
            capResidenza: data.istanteCap || null,
            provinciaResidenza: data.istanteProvincia || null,
          },
        })
        .returning();

      // B. Inserimento o upsert del Soggetto Avvocato (se presente)
      let soggettoAvvocato = null;
      if (data.haAvvocato === "true" && data.avvocatoCodiceFiscale) {
        const [avv] = await tx
          .insert(soggetto)
          .values({
            tipoSoggetto: "PF",
            denominazione: data.avvocatoNome || "Avvocato Istante",
            codiceFiscalePiva: data.avvocatoCodiceFiscale,
            email: data.avvocatoEmail || null,
          })
          .onConflictDoUpdate({
            target: [soggetto.codiceFiscalePiva],
            set: {
              denominazione: data.avvocatoNome || "Avvocato Istante",
              email: data.avvocatoEmail || null,
            },
          })
          .returning();
        soggettoAvvocato = avv;
      }

      // C. Inserimento o upsert del Soggetto Convenuto
      // Nota: se non ha un CF, ne generiamo un identificativo provvisorio per non fallire il vincolo di univocità o usiamo il CF fornito
      const convenutoCF =
        data.convenutoCodiceFiscale && data.convenutoCodiceFiscale.length >= 5
          ? data.convenutoCodiceFiscale
          : `TEMP-CONV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const [soggettoConvenuto] = await tx
        .insert(soggetto)
        .values({
          tipoSoggetto: data.convenutoTipo,
          denominazione: data.convenutoDenominazione,
          codiceFiscalePiva: convenutoCF,
          email: data.convenutoEmail,
          telefono: data.convenutoTelefono || null,
          dataNascita: data.convenutoDataNascita || null,
          indirizzoResidenza: data.convenutoIndirizzo || null,
          comuneResidenza: data.convenutoComune || null,
          capResidenza: data.convenutoCap || null,
          provinciaResidenza: data.convenutoProvincia || null,
        })
        .onConflictDoUpdate({
          target: [soggetto.codiceFiscalePiva],
          set: {
            denominazione: data.convenutoDenominazione,
            email: data.convenutoEmail,
            telefono: data.convenutoTelefono || null,
            dataNascita: data.convenutoDataNascita || null,
            indirizzoResidenza: data.convenutoIndirizzo || null,
            comuneResidenza: data.convenutoComune || null,
            capResidenza: data.convenutoCap || null,
            provinciaResidenza: data.convenutoProvincia || null,
          },
        })
        .returning();

      // D. Creazione record Mediazione
      const valoreLite = data.valoreIndeterminato === "true" ? "0.00" : data.valore || "0.00";
      const oggettoCompleto = `[Materia: ${data.materia}] ${data.descrizioneFatti}`;

      const [nuovaMediazione] = await tx
        .insert(mediazione)
        .values({
          protocollo,
          oggetto: oggettoCompleto,
          valore: valoreLite,
          statoId: stato.id,
          areaId: areaScelta.id,
        })
        .returning();

      // E. Collegamento dei Soggetti alla Mediazione tramite mediazione_soggetto
      await tx.insert(mediazioneSoggetto).values([
        {
          mediazioneId: nuovaMediazione.id,
          soggettoId: soggettoIstante.id,
          ruoloNellaLite: "Istante",
        },
        {
          mediazioneId: nuovaMediazione.id,
          soggettoId: soggettoConvenuto.id,
          ruoloNellaLite: "Convenuto",
        },
      ]);

      if (soggettoAvvocato) {
        await tx.insert(mediazioneSoggetto).values({
          mediazioneId: nuovaMediazione.id,
          soggettoId: soggettoAvvocato.id,
          ruoloNellaLite: "Avvocato Istante",
        });
      }

      // F. Inserimento metadati Documenti nella tabella documento (associata alla Mediazione)
      if (savedDocsMetadata.length > 0) {
        await tx.insert(documento).values(
          savedDocsMetadata.map((doc) => ({
            mediazioneId: nuovaMediazione.id,
            nomeFile: doc.nomeFile,
            nomeOriginale: doc.nomeOriginale,
            percorsoFile: doc.percorsoFile,
            tipoMime: doc.tipoMime,
            dimensione: doc.dimensione,
          }))
        );
      }
    });

    // Invia notifiche e-mail e SMS (no-reply) ai soggetti coinvolti (ed eventuali avvocati)
    try {
      const valoreLite = data.valoreIndeterminato === "true" ? "0.00" : data.valore || "0.00";
      await sendMediationNotifications({
        protocollo,
        materia: data.materia,
        valore: valoreLite,
        descrizioneFatti: data.descrizioneFatti,
        istante: {
          denominazione: data.istanteDenominazione,
          email: data.istanteEmail,
          telefono: data.istanteTelefono,
          dataNascita: data.istanteDataNascita || null,
          indirizzoResidenza: data.istanteIndirizzo || null,
          comuneResidenza: data.istanteComune || null,
          capResidenza: data.istanteCap || null,
          provinciaResidenza: data.istanteProvincia || null,
        },
        convenuto: {
          denominazione: data.convenutoDenominazione,
          email: data.convenutoEmail,
          telefono: data.convenutoTelefono,
          dataNascita: data.convenutoDataNascita || null,
          indirizzoResidenza: data.convenutoIndirizzo || null,
          comuneResidenza: data.convenutoComune || null,
          capResidenza: data.convenutoCap || null,
          provinciaResidenza: data.convenutoProvincia || null,
        },
        avvocato: data.haAvvocato === "true" && data.avvocatoEmail ? {
          denominazione: data.avvocatoNome || "Avvocato Istante",
          email: data.avvocatoEmail,
        } : null,
      });
    } catch (notifError) {
      console.error("Errore durante l'invio delle notifiche automatiche:", notifError);
      // Non blocchiamo il successo della creazione della mediazione se fallisce solo l'invio delle notifiche
    }

    return {
      success: true,
      protocollo,
      message: "Richiesta di mediazione inviata con successo",
    };
  } catch (error: any) {
    console.error("Errore durante la creazione della richiesta di mediazione:", error);
    return {
      success: false,
      error: error?.message || "Errore imprevisto durante il salvataggio della pratica. Riprova.",
    };
  }
}
