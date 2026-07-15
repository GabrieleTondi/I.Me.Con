"use server";

import { db } from "@/db";
import { utente, utenteRuolo, ruolo } from "@/db/schema";
import { hashPassword, verifyPassword, encryptSession } from "@/lib/auth";
import { eq, or } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isRateLimited } from "@/lib/rate-limit";

// Schemi di validazione Zod per prevenire DoS su password lunghe e sanificare l'input
const registerSchema = z.object({
  nomeCognome: z.string().min(2, "Nome non valido").max(100, "Nome troppo lungo"),
  email: z.string().email("Formato email non valido").max(150, "Email troppo lunga"),
  telefono: z.string().max(20, "Numero troppo lungo").nullable().optional(),
  username: z.string().min(3, "Username troppo corto").max(50, "Username troppo lungo").regex(/^[a-zA-Z0-9._-]+$/, "Caratteri username non validi"),
  password: z.string().min(8, "Password di almeno 8 caratteri").max(128, "Password troppo lunga (max 128 caratteri)"),
});

const loginSchema = z.object({
  loginInput: z.string().min(3, "Input non valido").max(150, "Input troppo lungo"),
  password: z.string().min(1, "Password obbligatoria").max(128, "Password troppo lunga"),
});

async function getClientIp(): Promise<string> {
  try {
    const reqHeaders = await headers();
    const forwardedFor = reqHeaders.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }
    return reqHeaders.get("x-real-ip") || "127.0.0.1";
  } catch {
    return "127.0.0.1";
  }
}

export async function registerAction(prevState: { error: string | null } | unknown, formData: FormData) {
  const ip = await getClientIp();
  // Limita a 10 tentativi al minuto per IP
  if (await isRateLimited(ip, 10, 60000)) {
    return { error: "Troppi tentativi. Riprova tra un minuto." };
  }

  // Parsing dei campi dal form
  const rawFields = {
    nomeCognome: formData.get("nomeCognome")?.toString().trim(),
    email: formData.get("email")?.toString().trim().toLowerCase(),
    telefono: formData.get("telefono")?.toString().trim() || null,
    username: formData.get("username")?.toString().trim(),
    password: formData.get("password")?.toString(),
  };

  // Validazione Zod
  const validation = registerSchema.safeParse(rawFields);
  if (!validation.success) {
    console.error("DEBUG - Zod registration validation errors:", validation.error.format());
    // Ritorna errore generico per prevenire User Enumeration (informazioni sui dettagli di validazione)
    return { error: "Registrazione non riuscita. Controlla i dati inseriti." };
  }

  const { nomeCognome, email, telefono, username, password } = validation.data;

  try {
    // 1. Controllo di esistenza unificato per prevenire doppie query sequenziali
    const existingUser = await db.query.utente.findFirst({
      where: or(eq(utente.email, email), eq(utente.username, username)),
    });

    if (existingUser) {
      // Errore generico uniforme per prevenire User Enumeration
      return { error: "Registrazione non riuscita. I dati inseriti non sono utilizzabili." };
    }

    // 2. Controllo preventivo del ruolo per evitare race condition durante l'inserimento
    const adminEmails = (process.env.ADMIN_EMAILS || "admin@imecon.it")
      .split(",")
      .map((e) => e.trim().toLowerCase());

    const isAdmin = adminEmails.includes(email);
    const roleName = isAdmin ? "Amministratore" : "Utente Standard";

    const existingRole = await db.query.ruolo.findFirst({
      where: eq(ruolo.nomeRuolo, roleName),
    });

    if (!existingRole) {
      return { error: "Servizio momentaneamente non disponibile. Contattare l'amministratore." };
    }

    // Hash della password tramite bcrypt
    const passwordHash = hashPassword(password);

    // 3. Esecuzione degli inserimenti all'interno di una Transazione atomica per evitare dati orfani
    let newUserId: number;
    await db.transaction(async (tx) => {
      const [newUser] = await tx.insert(utente).values({
        nomeCognome,
        email,
        telefono,
        username,
        password: passwordHash,
        attivo: true,
        accreditato: false,
        pubblica: false,
      }).returning();

      newUserId = newUser.id;

      await tx.insert(utenteRuolo).values({
        utenteId: newUser.id,
        ruoloId: existingRole.id,
      });
    });

    // 4. Configurazione della sessione protetta (Controllo segreto in produzione)
    const secret = process.env.SESSION_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET variable is missing in production.");
    }

    const actualSecret = secret || "fallback_very_secure_session_secret_1234567890123456";
    const sessionToken = encryptSession({ userId: newUserId! }, actualSecret);

    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 settimana
    });

  } catch (error) {
    console.error("Registration transaction error:", error);
    return { error: "Errore durante la registrazione. Riprova più tardi." };
  }

  redirect("/");
}

export async function loginAction(prevState: { error: string | null } | unknown, formData: FormData) {
  const ip = await getClientIp();
  // Limita a 10 tentativi al minuto per IP
  if (await isRateLimited(ip, 10, 60000)) {
    return { error: "Troppi tentativi. Riprova tra un minuto." };
  }

  const rawFields = {
    loginInput: formData.get("loginInput")?.toString().trim(),
    password: formData.get("password")?.toString(),
  };

  const validation = loginSchema.safeParse(rawFields);
  if (!validation.success) {
    return { error: "Credenziali non valide." };
  }

  const { loginInput, password } = validation.data;

  try {
    // Esecuzione di una singola query Drizzle con operatore OR
    const user = await db.query.utente.findFirst({
      where: or(eq(utente.email, loginInput.toLowerCase()), eq(utente.username, loginInput)),
    });

    if (!user || !user.attivo) {
      // Messaggio generico per evitare User Enumeration
      return { error: "Accesso non riuscito. Controlla le credenziali." };
    }

    // Verifica password con hash bcrypt
    const isPasswordValid = verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return { error: "Accesso non riuscito. Controlla le credenziali." };
    }

    // Aggiorna data ultimo login
    await db.update(utente)
      .set({ ultimoLogin: new Date() })
      .where(eq(utente.id, user.id));

    // Configurazione della sessione
    const secret = process.env.SESSION_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET variable is missing in production.");
    }

    const actualSecret = secret || "fallback_very_secure_session_secret_1234567890123456";
    const sessionToken = encryptSession({ userId: user.id }, actualSecret);

    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 settimana
    });

  } catch (error) {
    console.error("Login error:", error);
    return { error: "Si è verificato un errore durante l'accesso. Riprova." };
  }

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/");
}
