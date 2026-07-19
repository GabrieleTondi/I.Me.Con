import { NextResponse } from "next/server";
import { db } from "@/db";
import { utente, soggetto, mediazione, mediazioneSoggetto, utenteRuolo, ruolo } from "@/db/schema";
import { registerAction, loginAction } from "@/app/actions/auth-actions";
import { eq, or, inArray } from "drizzle-orm";

export async function POST(req: Request) {
  // Blocco di sicurezza per produzione
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const { action, data } = await req.json();

    if (action === "register") {
      const formData = new FormData();
      formData.append("nomeCognome", data.nomeCognome || "");
      formData.append("email", data.email || "");
      formData.append("telefono", data.telefono || "");
      formData.append("username", data.username || "");
      formData.append("password", data.password || "");

      try {
        const res = await registerAction(undefined, formData);
        if (res && res.error) {
          return NextResponse.json({ success: false, error: res.error }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      } catch (err: any) {
        if (err && err.message && err.message.includes("NEXT_REDIRECT")) {
          // Registrazione completata con successo (Next.js ha tentato il redirect)
          return NextResponse.json({ success: true, redirect: "/" });
        }
        throw err;
      }
    }

    if (action === "login") {
      const formData = new FormData();
      formData.append("loginInput", data.loginInput || "");
      formData.append("password", data.password || "");

      try {
        const res = await loginAction(undefined, formData);
        if (res && res.error) {
          return NextResponse.json({ success: false, error: res.error }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      } catch (err: any) {
        if (err && err.message && err.message.includes("NEXT_REDIRECT")) {
          // Login completato con successo (Next.js ha tentato il redirect)
          return NextResponse.json({ success: true, redirect: "/" });
        }
        throw err;
      }
    }

    if (action === "promoteToAdmin") {
      const user = await db.query.utente.findFirst({
        where: eq(utente.username, data.username || ""),
      });
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }
      const roleObj = await db.query.ruolo.findFirst({
        where: eq(ruolo.nomeRuolo, "Amministratore"),
      });
      if (!roleObj) {
        return NextResponse.json({ success: false, error: "Admin role not found" }, { status: 500 });
      }
      const existing = await db.query.utenteRuolo.findFirst({
        where: (fields, { and, eq }) => and(eq(fields.utenteId, user.id), eq(fields.ruoloId, roleObj.id)),
      });
      if (!existing) {
        await db.insert(utenteRuolo).values({
          utenteId: user.id,
          ruoloId: roleObj.id,
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in /api/test/auth POST:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  // Blocco di sicurezza per produzione
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const testCFs = ["TESTISTANTE12345", "TESTCONVENUTO123", "TESTAVVOCATO1234"];
    const testEmails = [
      "test_user_unique@example.com",
      "test_user_unique2@example.com",
      "test_user_unique3@example.com",
      "direzione@imecon.it"
    ];

    await db.transaction(async (tx) => {
      // 1. Trova i soggetti di test
      const testSoggetti = await tx.query.soggetto.findMany({
        where: inArray(soggetto.codiceFiscalePiva, testCFs),
      });

      if (testSoggetti.length > 0) {
        const soggettiIds = testSoggetti.map((s) => s.id);

        // 2. Trova le associazioni mediazione_soggetto collegate
        const medSoggetti = await tx.query.mediazioneSoggetto.findMany({
          where: inArray(mediazioneSoggetto.soggettoId, soggettiIds),
        });

        if (medSoggetti.length > 0) {
          const mediazioniIds = medSoggetti.map((ms) => ms.mediazioneId);

          // 3. Elimina le mediazioni (questo eliminerà a cascata mediazione_soggetto e documenti)
          await tx.delete(mediazione).where(inArray(mediazione.id, mediazioniIds));
        }

        // 4. Elimina i soggetti di test
        await tx.delete(soggetto).where(inArray(soggetto.id, soggettiIds));
      }

      // 5. Elimina l'utente di test (le relazioni utenteRuolo e utenteArea si eliminano in cascata)
      await tx.delete(utente).where(inArray(utente.email, testEmails));
    });

    return NextResponse.json({ success: true, message: "Cleaned up test data successfully." });
  } catch (error: any) {
    console.error("Error in /api/test/auth DELETE:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
