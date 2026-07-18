import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("file");

    if (!filename) {
      return new NextResponse("Parametro 'file' mancante", { status: 400 });
    }

    // Sicurezza: Prevenzione Directory Traversal
    // Impediamo caratteri di percorso relativi o assoluti
    if (
      filename.includes("/") ||
      filename.includes("\\") ||
      filename.includes("..") ||
      filename.trim() === ""
    ) {
      return new NextResponse("Nome file non valido o non autorizzato", { status: 400 });
    }

    const modulisticaDir = path.join(process.cwd(), "imecon modulistica");
    const filePath = path.join(modulisticaDir, filename);

    try {
      await fs.access(filePath);
    } catch {
      return new NextResponse("File non trovato", { status: 404 });
    }

    const fileBuffer = await fs.readFile(filePath);
    const ext = path.extname(filename).toLowerCase();

    // Mappatura MIME types di base
    let contentType = "application/octet-stream";
    if (ext === ".pdf") {
      contentType = "application/pdf";
    } else if (ext === ".doc") {
      contentType = "application/msword";
    } else if (ext === ".docx") {
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (ext === ".xlsx") {
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else if (ext === ".xls") {
      contentType = "application/vnd.ms-excel";
    }

    // In Next.js 16, i buffer devono essere convertiti in Uint8Array per evitare warning strict type
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Errore in api/modulistica GET:", error);
    return new NextResponse("Errore interno del server", { status: 500 });
  }
}
