import { db } from "./index";
import {
  ruolo,
  statoMediazione,
  area,
  qualifica,
  utente,
  utenteRuolo,
  utenteArea,
  soggetto,
  mediazione,
  mediazioneSoggetto,
  documento,
  seduta,
} from "./schema";
import { eq, notInArray } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

// Byte di un PDF valido minimale per garantire che i file mock siano scaricabili/visualizzabili nel browser senza errori
const DUMMY_PDF_BYTES = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 55 >>\nstream\nBT\n/F1 14 Tf\n50 700 Td\n(I.Me.Con - Documento Ufficiale Mediazione ADR) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000234 00000 n \n0000000301 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n406\n%%EOF"
);

async function main() {
  console.log("=== INIZIO SEEDING MASSICCIO E POPOLAMENTO DATABASE I.ME.CON ===");

  // 0. Assicuriamoci che la cartella degli upload esista
  const uploadsDir = path.join(process.cwd(), "uploads", "mediazioni");
  await fs.mkdir(uploadsDir, { recursive: true });

  // 1. Identifichiamo e salvaguardiamo gli amministratori esistenti (es. utente Bag)
  const adminRoles = await db.query.ruolo.findFirst({
    where: eq(ruolo.nomeRuolo, "Amministratore"),
  });
  let adminUserIds: number[] = [];
  if (adminRoles) {
    const adminUsers = await db.query.utenteRuolo.findMany({
      where: eq(utenteRuolo.ruoloId, adminRoles.id),
    });
    adminUserIds = adminUsers.map((u) => u.utenteId);
  }
  const bagUser = await db.query.utente.findFirst({
    where: eq(utente.username, "bag"),
  });
  if (bagUser && !adminUserIds.includes(bagUser.id)) {
    adminUserIds.push(bagUser.id);
  }
  console.log(`🔒 Amministratori preservati (IDs): [${adminUserIds.join(", ")}]`);

  // 2. Pulizia tabelle operative e di tutti i dati non amministrativi (in ordine di dipendenza FK)
  console.log("🧹 Svuotamento tabelle operative (sedute, documenti, mediazioni, soggetti, utenti non admin)...");
  await db.delete(seduta);
  await db.delete(documento);
  await db.delete(mediazioneSoggetto);
  await db.delete(mediazione);
  await db.delete(soggetto);

  if (adminUserIds.length > 0) {
    await db.delete(utenteArea).where(notInArray(utenteArea.utenteId, adminUserIds));
    await db.delete(utenteRuolo).where(notInArray(utenteRuolo.utenteId, adminUserIds));
    await db.delete(utente).where(notInArray(utente.id, adminUserIds));
  } else {
    await db.delete(utenteArea);
    await db.delete(utenteRuolo);
    await db.delete(utente);
  }

  // 3. Verifica e Inserimento Ruoli di Sistema
  const roleNames = ["Amministratore", "Mediatore", "Segreteria", "Utente Standard"];
  const roleMap: Record<string, number> = {};
  for (const rName of roleNames) {
    let r = await db.query.ruolo.findFirst({ where: eq(ruolo.nomeRuolo, rName) });
    if (!r) {
      const [inserted] = await db.insert(ruolo).values({ nomeRuolo: rName }).returning();
      r = inserted;
    }
    roleMap[rName] = r.id;
  }

  // 4. Verifica e Inserimento Aree di Competenza
  const areaNames = ["Maglie", "Manfredonia", "Lecce"];
  const areaMap: Record<string, number> = {};
  for (const aName of areaNames) {
    let a = await db.query.area.findFirst({ where: eq(area.nomeArea, aName) });
    if (!a) {
      const [inserted] = await db.insert(area).values({ nomeArea: aName }).returning();
      a = inserted;
    }
    areaMap[aName] = a.id;
  }

  // Assicuriamo che gli amministratori esistenti (es. Bag) abbiano visibilità su tutte le aree
  for (const adminId of adminUserIds) {
    for (const aId of Object.values(areaMap)) {
      const existingLink = await db.query.utenteArea.findFirst({
        where: (fields, { and, eq }) => and(eq(fields.utenteId, adminId), eq(fields.areaId, aId)),
      });
      if (!existingLink) {
        await db.insert(utenteArea).values({ utenteId: adminId, areaId: aId });
      }
    }
  }

  // 5. Verifica e Inserimento Stati Mediazione
  const statesList = [
    { codice: "DA_ASSEGNARE", descrizione: "In attesa di assegnazione mediatore" },
    { codice: "IN_CORSO", descrizione: "Procedimento in corso" },
    { codice: "ACCORDO_RAGGIUNTO", descrizione: "ACCORDO RAGGIUNTO" },
    { codice: "ASSENZA_CONVENUTO", descrizione: "ASSENZA PARTE CONVENUTA" },
    { codice: "ASSENZA_CONVENUTO_PROPOSTA", descrizione: "ASSENZA PARTE CONVENUTA CON PROPOSTA CONCILIATIVA" },
    { codice: "MANCATO_ACCORDO", descrizione: "MANCATO ACCORDO" },
    { codice: "ESTINTO_ASSENZA_PARTI", descrizione: "ESTINTO PER ASSENZA ENTRAMBI LE PARTI" },
    { codice: "ARCHIVIATA", descrizione: "Pratica archiviata" },
  ];
  const stateMap: Record<string, number> = {};
  for (const st of statesList) {
    let s = await db.query.statoMediazione.findFirst({ where: eq(statoMediazione.codice, st.codice) });
    if (!s) {
      const [inserted] = await db.insert(statoMediazione).values(st).returning();
      s = inserted;
    }
    stateMap[st.codice] = s.id;
  }

  // 6. Creazione Utenti Staff (Mediatori e Segreteria)
  console.log("👤 Creazione utenti staff (Mediatori e Segreteria)...");
  const staffUsersData = [
    {
      nomeCognome: "Avv. Marco Bianchi",
      email: "mediatore.bianchi@imecon.it",
      telefono: "3331002001",
      username: "mbianchi",
      password: "$2b$12$67hjoIP7F12EWoesxJyBm.HhP/ga.houwfLyMP9RZqqhdNZAGDlJW", // 'password'
      ruoloName: "Mediatore",
      aree: [areaMap["Lecce"], areaMap["Maglie"]],
    },
    {
      nomeCognome: "Dott.ssa Elena Moretti",
      email: "mediatore.moretti@imecon.it",
      telefono: "3331002002",
      username: "emoretti",
      password: "$2b$12$67hjoIP7F12EWoesxJyBm.HhP/ga.houwfLyMP9RZqqhdNZAGDlJW",
      ruoloName: "Mediatore",
      aree: [areaMap["Manfredonia"], areaMap["Lecce"]],
    },
    {
      nomeCognome: "Dott. Roberto De Santis",
      email: "mediatore.desantis@imecon.it",
      telefono: "3331002003",
      username: "rdesantis",
      password: "$2b$12$67hjoIP7F12EWoesxJyBm.HhP/ga.houwfLyMP9RZqqhdNZAGDlJW",
      ruoloName: "Mediatore",
      aree: [areaMap["Maglie"], areaMap["Manfredonia"], areaMap["Lecce"]],
    },
    {
      nomeCognome: "Laura Segreteria",
      email: "segreteria@imecon.it",
      telefono: "3331002004",
      username: "lsegreteria",
      password: "$2b$12$67hjoIP7F12EWoesxJyBm.HhP/ga.houwfLyMP9RZqqhdNZAGDlJW",
      ruoloName: "Segreteria",
      aree: [areaMap["Maglie"], areaMap["Manfredonia"], areaMap["Lecce"]],
    },
  ];

  const mediatoreIds: Record<string, number> = {};
  for (const su of staffUsersData) {
    const [insertedUser] = await db
      .insert(utente)
      .values({
        nomeCognome: su.nomeCognome,
        email: su.email,
        telefono: su.telefono,
        username: su.username,
        password: su.password,
        attivo: true,
        accreditato: su.ruoloName === "Mediatore",
        pubblica: su.ruoloName === "Mediatore",
      })
      .returning();

    await db.insert(utenteRuolo).values({ utenteId: insertedUser.id, ruoloId: roleMap[su.ruoloName] });
    for (const aId of su.aree) {
      await db.insert(utenteArea).values({ utenteId: insertedUser.id, areaId: aId });
    }
    if (su.ruoloName === "Mediatore") {
      mediatoreIds[su.nomeCognome] = insertedUser.id;
    }
  }

  // 7. Popolamento Anagrafiche Soggetti (Persone Fisiche e Giuridiche)
  console.log("🏢 Popolamento anagrafiche soggetti (Persone Fisiche e Giuridiche)...");
  const soggettiData = [
    {
      tipoSoggetto: "PF",
      denominazione: "Mario Rossi",
      codiceFiscalePiva: "RSSMRA80A01H501Z",
      email: "mario.rossi@example.com",
      telefono: "3331112233",
      dataNascita: "1980-01-10",
      indirizzoResidenza: "Via Roma 15",
      comuneResidenza: "Milano",
      capResidenza: "20121",
      provinciaResidenza: "MI",
    },
    {
      tipoSoggetto: "PF",
      denominazione: "Luigi Bianchi",
      codiceFiscalePiva: "BNCLGU75B12F205X",
      email: "luigi.bianchi@example.com",
      telefono: "3332223344",
      dataNascita: "1975-02-12",
      indirizzoResidenza: "Corso Italia 44",
      comuneResidenza: "Torino",
      capResidenza: "10121",
      provinciaResidenza: "TO",
    },
    {
      tipoSoggetto: "PF",
      denominazione: "Giuseppe Verdi",
      codiceFiscalePiva: "VRDGPP68C15L219Y",
      email: "giuseppe.verdi@example.com",
      telefono: "3333334455",
      dataNascita: "1968-03-15",
      indirizzoResidenza: "Via Garibaldi 8",
      comuneResidenza: "Bologna",
      capResidenza: "40121",
      provinciaResidenza: "BO",
    },
    {
      tipoSoggetto: "PF",
      denominazione: "Anna Neri",
      codiceFiscalePiva: "NRNNNA85D45H501W",
      email: "anna.neri@example.com",
      telefono: "3334445566",
      dataNascita: "1985-04-20",
      indirizzoResidenza: "Piazza Navona 3",
      comuneResidenza: "Roma",
      capResidenza: "00186",
      provinciaResidenza: "RM",
    },
    {
      tipoSoggetto: "PF",
      denominazione: "Elena Gialli",
      codiceFiscalePiva: "GLLLNE92E50D612Q",
      email: "elena.gialli@example.com",
      telefono: "3335556677",
      dataNascita: "1992-05-11",
      indirizzoResidenza: "Via Toledo 100",
      comuneResidenza: "Napoli",
      capResidenza: "80134",
      provinciaResidenza: "NA",
    },
    {
      tipoSoggetto: "PF",
      denominazione: "Francesca Romano",
      codiceFiscalePiva: "RMNFNC88F55E506P",
      email: "francesca.romano@example.com",
      telefono: "3336667788",
      dataNascita: "1988-06-25",
      indirizzoResidenza: "Via Cavour 12",
      comuneResidenza: "Lecce",
      capResidenza: "73100",
      provinciaResidenza: "LE",
    },
    {
      tipoSoggetto: "PF",
      denominazione: "Antonio Greco",
      codiceFiscalePiva: "GRCNTN70G18E506K",
      email: "antonio.greco@example.com",
      telefono: "3337778899",
      dataNascita: "1970-07-18",
      indirizzoResidenza: "Via Mazzini 5",
      comuneResidenza: "Maglie",
      capResidenza: "73024",
      provinciaResidenza: "LE",
    },
    {
      tipoSoggetto: "PF",
      denominazione: "Sofia Esposito",
      codiceFiscalePiva: "SPSSFO95H52E506J",
      email: "sofia.esposito@example.com",
      telefono: "3338889900",
      dataNascita: "1995-08-12",
      indirizzoResidenza: "Corso Manfredi 20",
      comuneResidenza: "Manfredonia",
      capResidenza: "71043",
      provinciaResidenza: "FG",
    },
    {
      tipoSoggetto: "PG",
      denominazione: "Condominio Parco dei Fiori",
      codiceFiscalePiva: "01234560731",
      email: "amministratore@condominioparcofiori.it",
      telefono: "0832101010",
      dataNascita: "2005-01-01",
      indirizzoResidenza: "Via Dante 45",
      comuneResidenza: "Lecce",
      capResidenza: "73100",
      provinciaResidenza: "LE",
    },
    {
      tipoSoggetto: "PG",
      denominazione: "Immobiliare Salentina S.r.l.",
      codiceFiscalePiva: "09876540732",
      email: "info@immobiliaresalentina.it",
      telefono: "0832202020",
      dataNascita: "2010-06-15",
      indirizzoResidenza: "Via Trinchese 80",
      comuneResidenza: "Lecce",
      capResidenza: "73100",
      provinciaResidenza: "LE",
    },
    {
      tipoSoggetto: "PG",
      denominazione: "Banca Popolare Pugliese S.p.A.",
      codiceFiscalePiva: "02345670733",
      email: "legale@bpp.it",
      telefono: "0833303030",
      dataNascita: "1980-01-01",
      indirizzoResidenza: "Via XXV Aprile 10",
      comuneResidenza: "Matino",
      capResidenza: "73046",
      provinciaResidenza: "LE",
    },
    {
      tipoSoggetto: "PG",
      denominazione: "Assicurazioni Generali S.p.A.",
      codiceFiscalePiva: "00079760328",
      email: "contenzioso@generali.pec.it",
      telefono: "040404040",
      dataNascita: "1831-12-26",
      indirizzoResidenza: "Piazza Duca degli Abruzzi 2",
      comuneResidenza: "Trieste",
      capResidenza: "34132",
      provinciaResidenza: "TS",
    },
    {
      tipoSoggetto: "PG",
      denominazione: "Costruzioni Edili Manfredonia S.r.l.",
      codiceFiscalePiva: "04567890711",
      email: "appalti@edilicostruzioni.it",
      telefono: "0884505050",
      dataNascita: "2015-09-10",
      indirizzoResidenza: "Via Gargano 15",
      comuneResidenza: "Manfredonia",
      capResidenza: "71043",
      provinciaResidenza: "FG",
    },
    {
      tipoSoggetto: "PG",
      denominazione: "Studio Medico Associato Dott. Morelli",
      codiceFiscalePiva: "05678900734",
      email: "studiomedico.morelli@pec.it",
      telefono: "0836606060",
      dataNascita: "2018-03-20",
      indirizzoResidenza: "Via Umberto I 30",
      comuneResidenza: "Maglie",
      capResidenza: "73024",
      provinciaResidenza: "LE",
    },
    // Avvocati
    {
      tipoSoggetto: "PF",
      denominazione: "Avv. Carlo Conti",
      codiceFiscalePiva: "CNTCRL75H10H501A",
      email: "carlo.conti@studiolegale.it",
      telefono: "3391110001",
      dataNascita: "1975-08-10",
      indirizzoResidenza: "Via Zanardelli 1",
      comuneResidenza: "Milano",
      capResidenza: "20123",
      provinciaResidenza: "MI",
    },
    {
      tipoSoggetto: "PF",
      denominazione: "Avv. Maria De Luca",
      codiceFiscalePiva: "DLCMRA82L55D612B",
      email: "maria.deluca@studiolegale.it",
      telefono: "3391110002",
      dataNascita: "1982-07-15",
      indirizzoResidenza: "Corso Vittorio Emanuele 50",
      comuneResidenza: "Bari",
      capResidenza: "70122",
      provinciaResidenza: "BA",
    },
    {
      tipoSoggetto: "PF",
      denominazione: "Avv. Stefano Rinaldi",
      codiceFiscalePiva: "RNLSFN79M12E506C",
      email: "stefano.rinaldi@studiolegale.it",
      telefono: "3391110003",
      dataNascita: "1979-08-12",
      indirizzoResidenza: "Via Libertà 15",
      comuneResidenza: "Lecce",
      capResidenza: "73100",
      provinciaResidenza: "LE",
    },
  ];

  const soggMap: Record<string, number> = {};
  for (const sd of soggettiData) {
    const [insertedSogg] = await db.insert(soggetto).values(sd).returning();
    soggMap[sd.denominazione] = insertedSogg.id;
  }

  // 8. Creazione Pratiche di Mediazione (Anni 2023, 2024, 2025, 2026) con casistiche diversificate
  console.log("📁 Popolamento massiccio pratiche di mediazione (Anni 2023 - 2026)...");
  const mediationsData = [
    // --- ANNO 2023 ---
    {
      protocollo: "ADR-2023-000101",
      oggetto: "Condominio - Infiltrazioni d'acqua dal lastrico solare e ripartizione spese straordinarie",
      valore: "4500.00",
      dataInserimento: "2023-03-14",
      statoCodice: "CONCILIATA",
      areaName: "Lecce",
      mediatoreName: "Avv. Marco Bianchi",
      soggetti: [
        { nome: "Mario Rossi", ruolo: "Istante" },
        { nome: "Avv. Carlo Conti", ruolo: "Avvocato Istante" },
        { nome: "Condominio Parco dei Fiori", ruolo: "Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2023-04-10T10:00:00Z"), nota: "Primo incontro di verifica adesione. Le parti concordano di avviare il procedimento." },
        { progressivo: 2, data: new Date("2023-05-15T16:00:00Z"), nota: "Accordo transattivo raggiunto sul risarcimento e ripartizione dei lavori di impermeabilizzazione." },
      ],
      documenti: ["Istanza_di_Mediazione.pdf", "Perizia_Infiltrazioni.pdf", "Verbale_Accordo_Conciliazione.pdf"],
    },
    {
      protocollo: "ADR-2023-000145",
      oggetto: "Locazione - Sfratto per morosità canoni locativi e richiesta pagamento arretrati",
      valore: "6200.00",
      dataInserimento: "2023-05-22",
      statoCodice: "NON_CONCILIATA",
      areaName: "Maglie",
      mediatoreName: "Dott. Roberto De Santis",
      soggetti: [
        { nome: "Antonio Greco", ruolo: "Istante" },
        { nome: "Luigi Bianchi", ruolo: "Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2023-06-20T11:00:00Z"), nota: "Il convenuto dichiara impossibilità temporanea al pagamento. Mancanza di accordo transattivo." },
      ],
      documenti: ["Contratto_Locazione.pdf", "Diffida_di_Pagamento.pdf", "Verbale_Negativo.pdf"],
    },
    {
      protocollo: "ADR-2023-000210",
      oggetto: "Responsabilità medica e sanitaria - Risarcimento danni per intervento chirurgico ortopedico",
      valore: "150000.00",
      dataInserimento: "2023-09-10",
      statoCodice: "ARCHIVIATA",
      areaName: "Manfredonia",
      mediatoreName: "Dott.ssa Elena Moretti",
      soggetti: [
        { nome: "Sofia Esposito", ruolo: "Istante" },
        { nome: "Avv. Maria De Luca", ruolo: "Avvocato Istante" },
        { nome: "Studio Medico Associato Dott. Morelli", ruolo: "Convenuto" },
      ],
      sedute: [],
      documenti: ["Cartella_Clinica_Ortopedia.pdf", "Perizia_Medico_Legale.pdf", "Attestato_Mancata_Adesione.pdf"],
    },
    {
      protocollo: "ADR-2023-000332",
      oggetto: "Successioni ereditarie - Divisione asse ereditario e immobiliari tra eredi legittimi (Valore Indeterminato)",
      valore: "0.00",
      dataInserimento: "2023-11-05",
      statoCodice: "CONCILIATA",
      areaName: "Lecce",
      mediatoreName: "Avv. Marco Bianchi",
      soggetti: [
        { nome: "Francesca Romano", ruolo: "Istante" },
        { nome: "Giuseppe Verdi", ruolo: "Convenuto" },
        { nome: "Avv. Stefano Rinaldi", ruolo: "Avvocato Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2023-11-28T15:30:00Z"), nota: "Incontro di apertura e stesura inventario beni immobiliari." },
        { progressivo: 2, data: new Date("2023-12-19T10:30:00Z"), nota: "Valutazione perizie congiunte sui terreni e fabbricati." },
        { progressivo: 3, data: new Date("2024-01-20T11:00:00Z"), nota: "Sottoscrizione accordo di divisione e assegnazione quote." },
      ],
      documenti: ["Testamento_Olografo.pdf", "Perizia_di_Stima_Immobili.pdf", "Verbale_Accordo_Divisione.pdf"],
    },

    // --- ANNO 2024 ---
    {
      protocollo: "ADR-2024-000089",
      oggetto: "Contratti bancari e finanziari - Contestazione anatocismo, usura soglia e CMS su conto corrente",
      valore: "35000.00",
      dataInserimento: "2024-02-18",
      statoCodice: "CONCILIATA",
      areaName: "Lecce",
      mediatoreName: "Avv. Marco Bianchi",
      soggetti: [
        { nome: "Immobiliare Salentina S.r.l.", ruolo: "Istante" },
        { nome: "Avv. Stefano Rinaldi", ruolo: "Avvocato Istante" },
        { nome: "Banca Popolare Pugliese S.p.A.", ruolo: "Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2024-03-12T10:00:00Z"), nota: "Analisi perizia econometrica di parte e proposta di saldo e stralcio della banca." },
        { progressivo: 2, data: new Date("2024-04-05T12:00:00Z"), nota: "Accordo di transazione bancaria sottoscritto con ricalcolo del saldo." },
      ],
      documenti: ["Contratto_Conto_Corrente.pdf", "Perizia_Econometrica.pdf", "Verbale_Conciliazione_Bancaria.pdf"],
    },
    {
      protocollo: "ADR-2024-000156",
      oggetto: "Contratti commerciali - Inadempimento contratto di appalto lavori edili e ritardo consegna",
      valore: "85000.00",
      dataInserimento: "2024-04-10",
      statoCodice: "NON_CONCILIATA",
      areaName: "Manfredonia",
      mediatoreName: "Dott.ssa Elena Moretti",
      soggetti: [
        { nome: "Costruzioni Edili Manfredonia S.r.l.", ruolo: "Istante" },
        { nome: "Luigi Bianchi", ruolo: "Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2024-05-08T16:00:00Z"), nota: "La committenza contesta la qualità dei materiali posati. Divergenze tecniche rilevanti." },
        { progressivo: 2, data: new Date("2024-06-02T16:00:00Z"), nota: "Le parti non raggiungono un compromesso economico sui vizi contestati." },
      ],
      documenti: ["Contratto_Appalto_Lavori.pdf", "SAL_Numero_2.pdf", "Verbale_di_Mancata_Conciliazione.pdf"],
    },
    {
      protocollo: "ADR-2024-000201",
      oggetto: "Diritti reali - Usucapione ventennale e regolamento di confini fondi rustici",
      valore: "12000.00",
      dataInserimento: "2024-06-15",
      statoCodice: "CONCILIATA",
      areaName: "Maglie",
      mediatoreName: "Dott. Roberto De Santis",
      soggetti: [
        { nome: "Antonio Greco", ruolo: "Istante" },
        { nome: "Francesca Romano", ruolo: "Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2024-07-10T11:00:00Z"), nota: "Esame planimetrie storiche catastali e testimonianze sull'uso del camminamento." },
        { progressivo: 2, data: new Date("2024-07-30T10:30:00Z"), nota: "Riconoscimento reciproco dei confini e sottoscrizione verbale." },
      ],
      documenti: ["Mappa_Catastale_Fondo.pdf", "Dichiarazioni_Testimoniali.pdf", "Verbale_Accordo_Confini.pdf"],
    },
    {
      protocollo: "ADR-2024-000312",
      oggetto: "Risarcimento danni da circolazione stradale - Sinistro multiplo con lesioni personali e danni materiali",
      valore: "28000.00",
      dataInserimento: "2024-09-02",
      statoCodice: "ARCHIVIATA",
      areaName: "Lecce",
      mediatoreName: "Avv. Marco Bianchi",
      soggetti: [
        { nome: "Elena Gialli", ruolo: "Istante" },
        { nome: "Avv. Maria De Luca", ruolo: "Avvocato Istante" },
        { nome: "Assicurazioni Generali S.p.A.", ruolo: "Convenuto" },
      ],
      sedute: [],
      documenti: ["CID_Denuncia_Sinistro.pdf", "Referti_Pronto_Soccorso.pdf", "Provvedimento_Archiviazione.pdf"],
    },
    {
      protocollo: "ADR-2024-000420",
      oggetto: "Condominio - Uso delle parti comuni, installazione ascensore e assegnazione posti auto (Valore Indeterminato)",
      valore: "0.00",
      dataInserimento: "2024-11-19",
      statoCodice: "CONCILIATA",
      areaName: "Manfredonia",
      mediatoreName: "Dott.ssa Elena Moretti",
      soggetti: [
        { nome: "Sofia Esposito", ruolo: "Istante" },
        { nome: "Condominio Parco dei Fiori", ruolo: "Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2024-12-14T15:00:00Z"), nota: "Approvazione nuovo regolamento turni parcheggio condominiale." },
      ],
      documenti: ["Regolamento_Condominio.pdf", "Planimetria_Cortile.pdf", "Verbale_Accordo_Condominiale.pdf"],
    },

    // --- ANNO 2025 ---
    {
      protocollo: "ADR-2025-000045",
      oggetto: "Locazione - Restituzione deposito cauzionale e risarcimento danni di ripristino locali",
      valore: "2400.00",
      dataInserimento: "2025-01-20",
      statoCodice: "CONCILIATA",
      areaName: "Lecce",
      mediatoreName: "Dott. Roberto De Santis",
      soggetti: [
        { nome: "Giuseppe Verdi", ruolo: "Istante" },
        { nome: "Anna Neri", ruolo: "Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2025-02-15T10:00:00Z"), nota: "Compensazione concordata tra importo cauzione e spese di tinteggiatura locali." },
      ],
      documenti: ["Contratto_Locazione_Abitativa.pdf", "Verbale_Riconsegna_Chiavi.pdf", "Verbale_Accordo.pdf"],
    },
    {
      protocollo: "ADR-2025-000118",
      oggetto: "Contratti assicurativi - Indennizzo polizza incendio capannone industriale e macchinari",
      valore: "450000.00",
      dataInserimento: "2025-03-11",
      statoCodice: "NON_CONCILIATA",
      areaName: "Maglie",
      mediatoreName: "Dott. Roberto De Santis",
      soggetti: [
        { nome: "Immobiliare Salentina S.r.l.", ruolo: "Istante" },
        { nome: "Avv. Stefano Rinaldi", ruolo: "Avvocato Istante" },
        { nome: "Assicurazioni Generali S.p.A.", ruolo: "Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2025-04-05T15:00:00Z"), nota: "Contestazione sulla clausola di proporzionale applicata dall'assicurazione." },
        { progressivo: 2, data: new Date("2025-05-10T15:00:00Z"), nota: "La compagnia mantiene ferma la propria valutazione tecnica. Procedimento chiuso." },
      ],
      documenti: ["Polizza_Incendio_All_Risks.pdf", "Perizia_Danni_Perito_Assicurativo.pdf", "Verbale_Negativo.pdf"],
    },
    {
      protocollo: "ADR-2025-000195",
      oggetto: "Successioni ereditarie - Impugnazione testamento per incapacità naturale e lesione di legittima",
      valore: "320000.00",
      dataInserimento: "2025-05-30",
      statoCodice: "IN_CORSO",
      areaName: "Lecce",
      mediatoreName: "Avv. Marco Bianchi",
      soggetti: [
        { nome: "Anna Neri", ruolo: "Istante" },
        { nome: "Avv. Carlo Conti", ruolo: "Avvocato Istante" },
        { nome: "Mario Rossi", ruolo: "Convenuto" },
        { nome: "Avv. Maria De Luca", ruolo: "Avvocato Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2025-06-25T11:30:00Z"), nota: "Apertura della procedura. Le parti concordano sulla nomina di un esperto stimatore congiunto." },
        { progressivo: 2, data: new Date("2025-09-15T16:00:00Z"), nota: "Deposito relazione preliminare stimatore e discussione sulla massa ereditaria." },
      ],
      documenti: ["Testamento_Impugnato.pdf", "Relazione_Medico_Legale_Incapacita.pdf", "Perizia_Immobili_Ereditari.pdf"],
    },
    {
      protocollo: "ADR-2025-000267",
      oggetto: "Contratti di appalto - Vizi strutturali e difetti di impermeabilizzazione complesso residenziale",
      valore: "115000.00",
      dataInserimento: "2025-08-04",
      statoCodice: "IN_CORSO",
      areaName: "Manfredonia",
      mediatoreName: "Dott.ssa Elena Moretti",
      soggetti: [
        { nome: "Condominio Parco dei Fiori", ruolo: "Istante" },
        { nome: "Avv. Stefano Rinaldi", ruolo: "Avvocato Istante" },
        { nome: "Costruzioni Edili Manfredonia S.r.l.", ruolo: "Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2025-09-20T10:00:00Z"), nota: "Esame accertamento tecnico preventivo (ATP) svolto in tribunale." },
      ],
      documenti: ["Relazione_ATP_Tribunale.pdf", "Contratto_Appalto_Originario.pdf"],
    },
    {
      protocollo: "ADR-2025-000340",
      oggetto: "Diffamazione a mezzo stampa e social network - Risarcimento danni all'onore e alla reputazione",
      valore: "50000.00",
      dataInserimento: "2025-10-12",
      statoCodice: "ARCHIVIATA",
      areaName: "Maglie",
      mediatoreName: "Dott. Roberto De Santis",
      soggetti: [
        { nome: "Antonio Greco", ruolo: "Istante" },
        { nome: "Elena Gialli", ruolo: "Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2025-11-08T10:30:00Z"), nota: "Il convenuto non si presenta alla prima udienza. Archiviazione." },
      ],
      documenti: ["Screenshot_Post_Facebook.pdf", "Diffida_Legale_Rimozione.pdf", "Provvedimento_Archiviazione.pdf"],
    },
    {
      protocollo: "ADR-2025-000411",
      oggetto: "Comodato d'uso gratuito immobile commerciale - Richiesta di rilascio immediato per urgenza imprevista",
      valore: "0.00",
      dataInserimento: "2025-12-01",
      statoCodice: "CONCILIATA",
      areaName: "Lecce",
      mediatoreName: "Avv. Marco Bianchi",
      soggetti: [
        { nome: "Immobiliare Salentina S.r.l.", ruolo: "Istante" },
        { nome: "Francesca Romano", ruolo: "Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2025-12-20T11:00:00Z"), nota: "Accordo sul rilascio scaglionato dei locali entro 60 giorni." },
      ],
      documenti: ["Contratto_Comodato_Uso.pdf", "Raccomandata_Richiesta_Rilascio.pdf", "Verbale_Accordo_Rilascio.pdf"],
    },

    // --- ANNO 2026 (Anno Corrente - Tutte le casistiche comprese quelle DA_ASSEGNARE) ---
    {
      protocollo: "ADR-2026-000012",
      oggetto: "Condominio - Impugnazione delibera assembleare su rifacimento facciate esterne e criteri millesimali",
      valore: "18500.00",
      dataInserimento: "2026-01-14",
      statoCodice: "CONCILIATA",
      areaName: "Lecce",
      mediatoreName: "Avv. Marco Bianchi",
      soggetti: [
        { nome: "Mario Rossi", ruolo: "Istante" },
        { nome: "Condominio Parco dei Fiori", ruolo: "Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2026-02-10T16:00:00Z"), nota: "L'amministratore accoglie la revisione dei millesimi di spesa. Accordo concluso." },
      ],
      documenti: ["Verbale_Assemblea_Condominiale.pdf", "Tabelle_Millesimali.pdf", "Verbale_Conciliazione_2026.pdf"],
    },
    {
      protocollo: "ADR-2026-000034",
      oggetto: "Contratti commerciali - Fornitura macchinari industriali difettosi e risarcimento fermo impianto",
      valore: "64000.00",
      dataInserimento: "2026-02-05",
      statoCodice: "IN_CORSO",
      areaName: "Manfredonia",
      mediatoreName: "Dott.ssa Elena Moretti",
      soggetti: [
        { nome: "Costruzioni Edili Manfredonia S.r.l.", ruolo: "Istante" },
        { nome: "Avv. Carlo Conti", ruolo: "Avvocato Istante" },
        { nome: "Immobiliare Salentina S.r.l.", ruolo: "Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2026-03-01T10:30:00Z"), nota: "Incontro preliminare. Fissata nuova data per esame tecnico congiunto delle macchine." },
      ],
      documenti: ["Fatture_Acquisto_Macchinari.pdf", "Relazione_Tecnica_Fermo_Impianto.pdf"],
    },
    {
      protocollo: "ADR-2026-000055",
      oggetto: "Diritti reali - Costituzione servitù di passaggio veicolare coattivo su strada interpoderale (Valore Indeterminato)",
      valore: "0.00",
      dataInserimento: "2026-03-12",
      statoCodice: "IN_CORSO",
      areaName: "Maglie",
      mediatoreName: "Dott. Roberto De Santis",
      soggetti: [
        { nome: "Antonio Greco", ruolo: "Istante" },
        { nome: "Avv. Maria De Luca", ruolo: "Avvocato Istante" },
        { nome: "Francesca Romano", ruolo: "Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2026-04-10T11:00:00Z"), nota: "Discussione preliminare sulla larghezza del tracciato stradale." },
        { progressivo: 2, data: new Date("2026-05-18T16:00:00Z"), nota: "Sopralluogo sui fondi eseguito dal mediatore e dai geometri di parte." },
      ],
      documenti: ["Mappa_Fondi_Catastali.pdf", "Titoli_di_Proprieta.pdf", "Verbale_Sopralluogo_Maglie.pdf"],
    },
    {
      protocollo: "ADR-2026-000078",
      oggetto: "Responsabilità medica e sanitaria - Errata diagnosi ortopedica e ritardo nell'intervento chirurgico",
      valore: "250000.00",
      dataInserimento: "2026-04-20",
      statoCodice: "DA_ASSEGNARE",
      areaName: "Lecce",
      mediatoreName: null, // Pratica appena arrivata da assegnare
      soggetti: [
        { nome: "Elena Gialli", ruolo: "Istante" },
        { nome: "Avv. Stefano Rinaldi", ruolo: "Avvocato Istante" },
        { nome: "Studio Medico Associato Dott. Morelli", ruolo: "Convenuto" },
      ],
      sedute: [],
      documenti: ["Istanza_Mediazione_Sanitaria.pdf", "Perizia_Medico_Legale_Parte.pdf"],
    },
    {
      protocollo: "ADR-2026-000092",
      oggetto: "Locazione - Richiesta riduzione canone per gravi vizi occulti dell'impianto di riscaldamento",
      valore: "3600.00",
      dataInserimento: "2026-05-10",
      statoCodice: "DA_ASSEGNARE",
      areaName: "Manfredonia",
      mediatoreName: null,
      soggetti: [
        { nome: "Sofia Esposito", ruolo: "Istante" },
        { nome: "Luigi Bianchi", ruolo: "Convenuto" },
      ],
      sedute: [],
      documenti: ["Contratto_Locazione_2026.pdf", "Relazione_Idraulico.pdf"],
    },
    {
      protocollo: "ADR-2026-000105",
      oggetto: "Contratti bancari - Contestazione commissioni massimo scoperto (CMS) e spese di istruttoria fido",
      valore: "14200.00",
      dataInserimento: "2026-06-01",
      statoCodice: "DA_ASSEGNARE",
      areaName: "Maglie",
      mediatoreName: null,
      soggetti: [
        { nome: "Studio Medico Associato Dott. Morelli", ruolo: "Istante" },
        { nome: "Avv. Carlo Conti", ruolo: "Avvocato Istante" },
        { nome: "Banca Popolare Pugliese S.p.A.", ruolo: "Convenuto" },
      ],
      sedute: [],
      documenti: ["Estratti_Conto_Bancari_2025_2026.pdf", "Perizia_Tecnica_Bancaria.pdf"],
    },
    {
      protocollo: "ADR-2026-000119",
      oggetto: "Divisione ereditaria - Rideterminazione quote societarie e compensazione con beni immobili (Valore Indeterminato)",
      valore: "0.00",
      dataInserimento: "2026-06-25",
      statoCodice: "IN_CORSO",
      areaName: "Lecce",
      mediatoreName: "Avv. Marco Bianchi",
      soggetti: [
        { nome: "Giuseppe Verdi", ruolo: "Istante" },
        { nome: "Avv. Stefano Rinaldi", ruolo: "Avvocato Istante" },
        { nome: "Anna Neri", ruolo: "Convenuto" },
        { nome: "Avv. Carlo Conti", ruolo: "Avvocato Convenuto" },
      ],
      sedute: [
        { progressivo: 1, data: new Date("2026-07-08T15:00:00Z"), nota: "Incontro di apertura. Le parti depositano le stime di bilancio delle società ereditate." },
      ],
      documenti: ["Inventario_Ereditario_2026.pdf", "Bilanci_Societari_2025.pdf", "Verbale_1_Seduta_2026.pdf"],
    },
    {
      protocollo: "ADR-2026-000130",
      oggetto: "Condominio - Risarcimento danni da rottura tubazione idrica condominiale in appartamento privato",
      valore: "8900.00",
      dataInserimento: "2026-07-14",
      statoCodice: "DA_ASSEGNARE",
      areaName: "Lecce",
      mediatoreName: null,
      soggetti: [
        { nome: "Francesca Romano", ruolo: "Istante" },
        { nome: "Condominio Parco dei Fiori", ruolo: "Convenuto" },
        { nome: "Avv. Maria De Luca", ruolo: "Avvocato Convenuto" },
      ],
      sedute: [],
      documenti: ["Istanza_Risarcimento_Danni.pdf", "Preventivo_Lavori_Ripristino.pdf"],
    },
  ];

  let docCounter = 1;
  for (const mData of mediationsData) {
    const mediatoreId = mData.mediatoreName ? mediatoreIds[mData.mediatoreName] : null;

    const [insertedMediation] = await db
      .insert(mediazione)
      .values({
        protocollo: mData.protocollo,
        oggetto: mData.oggetto,
        valore: mData.valore,
        dataInserimento: mData.dataInserimento,
        statoId: stateMap[mData.statoCodice],
        mediatoreId: mediatoreId,
        areaId: areaMap[mData.areaName],
      })
      .returning();

    // Inserimento Soggetti Collegati
    for (const sColl of mData.soggetti) {
      const sId = soggMap[sColl.nome];
      if (sId) {
        await db.insert(mediazioneSoggetto).values({
          mediazioneId: insertedMediation.id,
          soggettoId: sId,
          ruoloNellaLite: sColl.ruolo,
        });
      }
    }

    // Inserimento Sedute
    for (const sed of mData.sedute) {
      await db.insert(seduta).values({
        mediazioneId: insertedMediation.id,
        numeroProgressivo: sed.progressivo,
        dataSeduta: sed.data,
        notaVerbale: sed.nota,
      });
    }

    // Inserimento Documenti Mock con creazione del file fisico PDF su disco
    for (const docName of mData.documenti) {
      const uniqueFileName = `${Date.now()}_mock_${docCounter}_${docName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const fullFilePath = path.join(uploadsDir, uniqueFileName);

      // Scrittura file fisico su disco
      await fs.writeFile(fullFilePath, DUMMY_PDF_BYTES);

      await db.insert(documento).values({
        mediazioneId: insertedMediation.id,
        nomeFile: uniqueFileName,
        nomeOriginale: docName,
        percorsoFile: fullFilePath,
        tipoMime: "application/pdf",
        dimensione: DUMMY_PDF_BYTES.length,
      });

      docCounter++;
    }
  }

  console.log(`✅ Popolamento terminato con successo! Inserite ${mediationsData.length} pratiche complete di soggetti, sedute e ${docCounter - 1} documenti PDF consultabili dal browser.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Errore durante il seeding massiccio:", err);
  process.exit(1);
});
