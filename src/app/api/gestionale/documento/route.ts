import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { documento, mediazione } from "@/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";

export async function GET(req: Request) {
  try {
    // 1. Estrazione e validazione dell'ID del documento
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

    // 3. Recupero metadati documento dal Database
    const doc = await db.query.documento.findFirst({
      where: eq(documento.id, id),
    });

    if (!doc) {
      return new NextResponse("Documento non trovato nel database", { status: 404 });
    }

    // 3b. Recupero mediazione associata per controllo permessi (IDOR)
    const associatedMediation = await db.query.mediazione.findFirst({
      where: eq(mediazione.id, doc.mediazioneId),
    });

    if (!associatedMediation) {
      return new NextResponse("Mediazione associata non trovata", { status: 404 });
    }

    let hasAccess = false;
    if (user.ruoli.includes("Amministratore")) {
      hasAccess = true;
    } else if (user.ruoli.includes("Segreteria")) {
      hasAccess = user.areaIds.includes(associatedMediation.areaId);
    } else if (user.ruoli.includes("Mediatore")) {
      hasAccess = associatedMediation.mediatoreId === user.id;
    }

    if (!hasAccess) {
      return new NextResponse("Accesso negato per questo documento", { status: 403 });
    }

    // 4. Verifica e lettura del file dal filesystem locale
    try {
      await fs.access(doc.percorsoFile);
    } catch {
      return new NextResponse("File non presente sul server", { status: 404 });
    }

    const fileBuffer = await fs.readFile(doc.percorsoFile);

    // 5. Ritorno del file con disposizione 'inline' per visualizzazione diretta nel browser
    const headers = new Headers();
    headers.set("Content-Type", doc.tipoMime);
    // 'inline' permette di visualizzare direttamente nel browser i formati supportati (PDF, immagini, ecc.)
    headers.set(
      "Content-Disposition",
      `inline; filename="${doc.nomeOriginale.replace(/"/g, '\\"')}"`
    );

    return new NextResponse(new Uint8Array(fileBuffer), { headers });
  } catch (error: any) {
    console.error("Errore nel recupero del documento:", error);
    return new NextResponse(error.message || "Errore Interno del Server", { status: 500 });
  }
}
