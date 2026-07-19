import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { mediazione } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SimplePDF } from "@/lib/pdf-generator";
import { getMediationDeadline } from "@/lib/deadline-utils";

function formatDate(dateStr: string | null | Date): string {
  if (!dateStr) return "-";
  if (dateStr instanceof Date) {
    return dateStr.toLocaleDateString("it-IT");
  }
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return new Date(dateStr).toLocaleDateString("it-IT");
}

function formatCurrency(val: string | number) {
  const parsed = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(parsed) || parsed === 0) return "Indeterminato";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(parsed);
}

function drawPageHeader(pdf: SimplePDF, pageNum: number, protocol: string) {
  // Top header background block in dark blue (brand primary color `#1e3a8a` -> approximately "0.12 0.23 0.54" in PDF color space)
  pdf.filledRect(50, 40, 495, 40, "0.12 0.23 0.54");
  
  // Header text
  pdf.text("I.ME.CON. | Organismo di Mediazione ADR", 65, 52, "F1", 12, "1 1 1");
  pdf.text(`Documento Ufficiale - Prot: ${protocol}`, 65, 68, "F2", 9, "0.9 0.9 0.9");
  pdf.text(`Pagina ${pageNum}`, 490, 52, "F2", 8, "0.9 0.9 0.9");
}

function drawPageFooter(pdf: SimplePDF) {
  // Bottom horizontal line
  pdf.line(50, 790, 545, 790, 0.5, "0.7 0.7 0.7");
  pdf.text("I.Me.Con. S.r.l. - Registro Organismi di Mediazione del Ministero della Giustizia", 50, 805, "F2", 7, "0.5 0.5 0.5");
  pdf.text("Questo documento ha valore interno e riassuntivo del procedimento.", 50, 815, "F2", 7, "0.5 0.5 0.5");
}

export async function GET(req: Request) {
  try {
    // 1. Estrazione e validazione dell'ID della mediazione
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get("id");
    
    if (!idStr) {
      return new NextResponse("Parametro 'id' mancante", { status: 400 });
    }
    
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return new NextResponse("Parametro 'id' non valido", { status: 400 });
    }

    // 2. Controllo autenticazione e permessi
    const user = await getCurrentUser();
    if (
      !user ||
      (!user.ruoli.includes("Amministratore") &&
        !user.ruoli.includes("Mediatore") &&
        !user.ruoli.includes("Segreteria"))
    ) {
      return new NextResponse("Accesso negato", { status: 403 });
    }

    // 3. Recupero dati mediazione completa dal database
    const mediationData = await db.query.mediazione.findFirst({
      where: eq(mediazione.id, id),
      with: {
        stato: true,
        area: true,
        mediatore: true,
        soggetti: {
          with: {
            soggetto: true,
          },
        },
        sedute: true,
        documenti: true,
      },
    });

    if (!mediationData) {
      return new NextResponse("Pratica di mediazione non trovata nel database", { status: 404 });
    }

    // Controllo permessi sulla singola pratica (IDOR check)
    let hasAccess = false;
    if (user.ruoli.includes("Amministratore")) {
      hasAccess = true;
    } else if (user.ruoli.includes("Segreteria")) {
      hasAccess = user.areaIds.includes(mediationData.areaId);
    } else if (user.ruoli.includes("Mediatore")) {
      hasAccess = mediationData.mediatoreId === user.id;
    }

    if (!hasAccess) {
      return new NextResponse("Accesso negato per questa pratica", { status: 403 });
    }

    // Controllo scadenza pratica per ruolo Mediatore
    const isConclusa = [
      "ACCORDO_RAGGIUNTO",
      "ASSENZA_CONVENUTO",
      "ASSENZA_CONVENUTO_PROPOSTA",
      "MANCATO_ACCORDO",
      "ESTINTO_ASSENZA_PARTI",
      "ARCHIVIATA",
    ].includes(mediationData.stato.codice);

    const deadline = getMediationDeadline(
      mediationData.dataInserimento,
      mediationData.prorogata,
      mediationData.scadenzaPersonalizzata
    );
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    const isExpired = !isConclusa && now.getTime() > deadline.getTime();
    
    const isOnlyMediator = user.ruoli.includes("Mediatore") && !user.ruoli.includes("Amministratore") && !user.ruoli.includes("Segreteria");

    if (isExpired && isOnlyMediator) {
      return new NextResponse("Accesso negato. La pratica è scaduta.", { status: 403 });
    }

    // 4. Inizializzazione PDF
    const pdf = new SimplePDF();
    let pageNum = 1;
    pdf.addPage();
    
    const protocol = mediationData.protocollo;
    
    // Disegna intestazione e piè di pagina pagina 1
    drawPageHeader(pdf, pageNum, protocol);

    // Titolo Principale del Documento
    let currentY = 110;
    pdf.text("SCHEDA RIASSUNTIVA PROCEDIMENTO", 50, currentY, "F1", 16, "0.12 0.23 0.54");
    currentY += 20;
    pdf.text(`Mediazione Civile e Commerciale n. ${protocol}`, 50, currentY, "F2", 11, "0.3 0.3 0.3");
    currentY += 15;
    pdf.line(50, currentY, 545, currentY, 1.5, "0.12 0.23 0.54");
    currentY += 20;

    // Sezione Informazioni Generali (Box Grigio)
    pdf.filledRect(50, currentY, 495, 75, "0.96 0.96 0.96");
    pdf.rect(50, currentY, 495, 75, 0.5, "0.8 0.8 0.8");
    
    pdf.text("DATA DEPOSITO", 65, currentY + 16, "F1", 8, "0.4 0.4 0.4");
    pdf.text(formatDate(mediationData.dataInserimento), 65, currentY + 28, "F2", 10, "0.1 0.1 0.1");

    pdf.text("SEDE COMPETENTE", 185, currentY + 16, "F1", 8, "0.4 0.4 0.4");
    pdf.text(mediationData.area.nomeArea, 185, currentY + 28, "F2", 10, "0.1 0.1 0.1");

    pdf.text("VALORE DELLA LITE", 305, currentY + 16, "F1", 8, "0.4 0.4 0.4");
    pdf.text(formatCurrency(mediationData.valore), 305, currentY + 28, "F2", 10, "0.1 0.1 0.1");

    pdf.text("STATO ATTUALE", 425, currentY + 16, "F1", 8, "0.4 0.4 0.4");
    pdf.text(mediationData.stato.descrizione, 425, currentY + 28, "F1", 9, "0.8 0.4 0");

    pdf.line(65, currentY + 40, 480, currentY + 40, 0.5, "0.85 0.85 0.85");
    pdf.text("MEDIATORE ASSEGNATO", 65, currentY + 52, "F1", 8, "0.4 0.4 0.4");
    
    const mediatoreNome = mediationData.mediatore ? mediationData.mediatore.nomeCognome : "Non ancora assegnato";
    pdf.text(mediatoreNome, 65, currentY + 64, "F2", 10, "0.1 0.1 0.1");
    
    currentY += 95;

    // Sezione Oggetto / Materia della lite
    pdf.text("OGGETTO E MATERIA DELLA CONTROVERSIA", 50, currentY, "F1", 11, "0.12 0.23 0.54");
    currentY += 15;
    
    // Scrittura blocco testo con a capo automatico
    currentY = pdf.textBlock(mediationData.oggetto, 55, currentY, 485, 9.5, "F2", 13, "0.2 0.2 0.2");
    currentY += 20;

    // Sezione Parti Coinvolte - Filtro e raggruppamento
    const istanti = mediationData.soggetti.filter((s) => s.ruoloNellaLite.toLowerCase().includes("istante"));
    const convenuti = mediationData.soggetti.filter((s) => s.ruoloNellaLite.toLowerCase().includes("convenuto"));

    // Stampa Parti Istanti
    if (istanti.length > 0) {
      if (currentY > 660) {
        drawPageFooter(pdf);
        pdf.addPage();
        pageNum++;
        drawPageHeader(pdf, pageNum, protocol);
        currentY = 110;
      }
      
      pdf.text("PARTI ISTANTI E PROMOTORI", 50, currentY, "F1", 11, "0.12 0.23 0.54");
      pdf.line(50, currentY + 4, 545, currentY + 4, 0.5, "0.12 0.23 0.54");
      currentY += 18;

      for (const s of istanti) {
        if (currentY > 680) {
          drawPageFooter(pdf);
          pdf.addPage();
          pageNum++;
          drawPageHeader(pdf, pageNum, protocol);
          currentY = 110;
        }
        
        pdf.text(s.soggetto.denominazione, 60, currentY, "F1", 10, "0.1 0.1 0.1");
        pdf.text(`Ruolo: ${s.ruoloNellaLite}`, 300, currentY, "F2", 9, "0.4 0.4 0.4");
        currentY += 12;
        
        let infoLine1 = `Codice Fiscale / P.IVA: ${s.soggetto.codiceFiscalePiva}`;
        if (s.soggetto.dataNascita) {
          infoLine1 += ` | Data nascita/cost.: ${s.soggetto.dataNascita}`;
        }
        pdf.text(infoLine1, 60, currentY, "F2", 9, "0.3 0.3 0.3");
        currentY += 12;

        const residenza = `${s.soggetto.indirizzoResidenza || "-"}, ${s.soggetto.capResidenza || ""} ${s.soggetto.comuneResidenza || ""} (${s.soggetto.provinciaResidenza || ""})`;
        pdf.text(`Sede / Indirizzo: ${residenza}`, 60, currentY, "F2", 9, "0.3 0.3 0.3");
        currentY += 12;

        const email = s.soggetto.email || "-";
        const tel = s.soggetto.telefono || "-";
        pdf.text(`Contatti: PEC/Email: ${email} | Telefono: ${tel}`, 60, currentY, "F2", 9, "0.3 0.3 0.3");
        currentY += 22; // Spazio extra dopo ciascun soggetto
      }
    }

    // Stampa Parti Convenute
    if (convenuti.length > 0) {
      if (currentY > 660) {
        drawPageFooter(pdf);
        pdf.addPage();
        pageNum++;
        drawPageHeader(pdf, pageNum, protocol);
        currentY = 110;
      }
      
      pdf.text("PARTI CONVENUTE E INVITATE", 50, currentY, "F1", 11, "0.12 0.23 0.54");
      pdf.line(50, currentY + 4, 545, currentY + 4, 0.5, "0.12 0.23 0.54");
      currentY += 18;

      for (const s of convenuti) {
        if (currentY > 680) {
          drawPageFooter(pdf);
          pdf.addPage();
          pageNum++;
          drawPageHeader(pdf, pageNum, protocol);
          currentY = 110;
        }
        
        pdf.text(s.soggetto.denominazione, 60, currentY, "F1", 10, "0.1 0.1 0.1");
        pdf.text(`Ruolo: ${s.ruoloNellaLite}`, 300, currentY, "F2", 9, "0.4 0.4 0.4");
        currentY += 12;
        
        let infoLine1 = `Codice Fiscale / P.IVA: ${s.soggetto.codiceFiscalePiva}`;
        if (s.soggetto.dataNascita) {
          infoLine1 += ` | Data nascita/cost.: ${s.soggetto.dataNascita}`;
        }
        pdf.text(infoLine1, 60, currentY, "F2", 9, "0.3 0.3 0.3");
        currentY += 12;

        const residenza = `${s.soggetto.indirizzoResidenza || "-"}, ${s.soggetto.capResidenza || ""} ${s.soggetto.comuneResidenza || ""} (${s.soggetto.provinciaResidenza || ""})`;
        pdf.text(`Sede / Indirizzo: ${residenza}`, 60, currentY, "F2", 9, "0.3 0.3 0.3");
        currentY += 12;

        const email = s.soggetto.email || "-";
        const tel = s.soggetto.telefono || "-";
        pdf.text(`Contatti: PEC/Email: ${email} | Telefono: ${tel}`, 60, currentY, "F2", 9, "0.3 0.3 0.3");
        currentY += 22;
      }
    }

    // Cronologia delle Sedute
    if (mediationData.sedute && mediationData.sedute.length > 0) {
      if (currentY > 650) {
        drawPageFooter(pdf);
        pdf.addPage();
        pageNum++;
        drawPageHeader(pdf, pageNum, protocol);
        currentY = 110;
      }

      pdf.text("CRONOLOGIA E NOTA VERBALE DELLE SEDUTE", 50, currentY, "F1", 11, "0.12 0.23 0.54");
      pdf.line(50, currentY + 4, 545, currentY + 4, 0.5, "0.12 0.23 0.54");
      currentY += 18;

      // Ordina per numero progressivo
      const sortedSedute = [...mediationData.sedute].sort((a, b) => a.numeroProgressivo - b.numeroProgressivo);
      
      for (const s of sortedSedute) {
        if (currentY > 700) {
          drawPageFooter(pdf);
          pdf.addPage();
          pageNum++;
          drawPageHeader(pdf, pageNum, protocol);
          currentY = 110;
        }

        const dataSeduta = new Date(s.dataSeduta);
        const dataSedutaStr = `${dataSeduta.getDate().toString().padStart(2, "0")}/${(dataSeduta.getMonth() + 1).toString().padStart(2, "0")}/${dataSeduta.getFullYear()} ore ${dataSeduta.getHours().toString().padStart(2, "0")}:${dataSeduta.getMinutes().toString().padStart(2, "0")}`;
        
        pdf.text(`Seduta n. ${s.numeroProgressivo} - Data: ${dataSedutaStr}`, 60, currentY, "F1", 9.5, "0.1 0.1 0.1");
        currentY += 12;

        if (s.notaVerbale) {
          currentY = pdf.textBlock(`Nota a verbale: ${s.notaVerbale}`, 70, currentY, 465, 8.5, "F2", 11, "0.3 0.3 0.3");
        }
        currentY += 10;
      }
    }

    // Documenti ed allegati depositati
    if (mediationData.documenti && mediationData.documenti.length > 0) {
      if (currentY > 660) {
        drawPageFooter(pdf);
        pdf.addPage();
        pageNum++;
        drawPageHeader(pdf, pageNum, protocol);
        currentY = 110;
      }

      pdf.text("DOCUMENTI ED ALLEGATI IN MATRICOLA", 50, currentY, "F1", 11, "0.12 0.23 0.54");
      pdf.line(50, currentY + 4, 545, currentY + 4, 0.5, "0.12 0.23 0.54");
      currentY += 18;

      for (const doc of mediationData.documenti) {
        if (currentY > 720) {
          drawPageFooter(pdf);
          pdf.addPage();
          pageNum++;
          drawPageHeader(pdf, pageNum, protocol);
          currentY = 110;
        }

        const dimMb = (doc.dimensione / (1024 * 1024)).toFixed(2);
        pdf.text(`• ${doc.nomeOriginale} (${dimMb} MB - ${doc.tipoMime})`, 60, currentY, "F2", 9, "0.2 0.2 0.2");
        currentY += 14;
      }
      currentY += 10;
    }

    // Area Firme e Sottoscrizione
    if (currentY > 620) {
      drawPageFooter(pdf);
      pdf.addPage();
      pageNum++;
      drawPageHeader(pdf, pageNum, protocol);
      currentY = 110;
    }

    pdf.line(50, currentY, 545, currentY, 1, "0.12 0.23 0.54");
    currentY += 16;
    pdf.text("SPAZIO PER LE SOTTOSCRIZIONI DI RITO", 50, currentY, "F1", 10, "0.12 0.23 0.54");
    currentY += 14;
    pdf.text("Il presente riassunto cartaceo, debitamente sottoscritto, viene conservato agli atti del fascicolo d'ufficio.", 50, currentY, "F2", 8.5, "0.4 0.4 0.4");
    currentY += 45;

    // Firme a tre colonne
    // 1. Mediatore
    pdf.line(50, currentY, 180, currentY, 0.5, "0.5 0.5 0.5");
    pdf.text("Firma del Mediatore", 50, currentY + 12, "F2", 8, "0.4 0.4 0.4");

    // 2. Parti
    pdf.line(230, currentY, 360, currentY, 0.5, "0.5 0.5 0.5");
    pdf.text("Firma delle Parti (Istante/Convenuto)", 230, currentY + 12, "F2", 8, "0.4 0.4 0.4");

    // 3. Segreteria
    pdf.line(410, currentY, 540, currentY, 0.5, "0.5 0.5 0.5");
    pdf.text("Responsabile di Segreteria", 410, currentY + 12, "F2", 8, "0.4 0.4 0.4");

    // Disegna footer per l'ultima pagina
    drawPageFooter(pdf);

    // 5. Compilazione del buffer PDF
    const pdfBuffer = pdf.compile();

    // 6. Ritorno della risposta HTTP con visualizzazione inline del PDF
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", `inline; filename="riassunto-${protocol}.pdf"`);

    return new NextResponse(new Uint8Array(pdfBuffer), { headers });
  } catch (error: any) {
    console.error("Errore durante la generazione del PDF riassuntivo:", error);
    return new NextResponse(error.message || "Errore Interno del Server", { status: 500 });
  }
}
