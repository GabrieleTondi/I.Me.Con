import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { utente } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// AES Encryption Constants for Session
const ENCRYPT_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const SESSION_KEY_LENGTH = 32;
const SESSION_ITERATIONS = 10000;

// Password Hashing using bcryptjs
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    return bcrypt.compareSync(password, storedHash);
  } catch {
    return false;
  }
}

// Session Encryption helper
function getSessionKey(secret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(secret, salt, SESSION_ITERATIONS, SESSION_KEY_LENGTH, "sha256");
}

export function encryptSession(data: unknown, secret: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getSessionKey(secret, salt);
  const cipher = crypto.createCipheriv(ENCRYPT_ALGORITHM, key, iv);
  
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  return `${salt.toString("hex")}:${iv.toString("hex")}:${encrypted}:${authTag}`;
}

export interface SessionData {
  userId: number;
}

export function decryptSession(token: string, secret: string): SessionData | null {
  try {
    const parts = token.split(":");
    if (parts.length !== 4) return null;
    
    const [saltHex, ivHex, encryptedHex, authTagHex] = parts;
    const salt = Buffer.from(saltHex, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    const key = getSessionKey(secret, salt);
    const decipher = crypto.createDecipheriv(ENCRYPT_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");
    
    return JSON.parse(decrypted) as SessionData;
  } catch {
    return null;
  }
}

// Get Current Logged-in User and their relations
export interface CurrentUser {
  id: number;
  nomeCognome: string;
  email: string;
  username: string;
  ruoli: string[];
  areaIds: number[];
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const secret = process.env.SESSION_SECRET;
  
  // In produzione, blocca l'avvio se manca il segreto per evitare chiavi di fallback pubbliche
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET environment variable is missing in production.");
    }
  }
  
  const actualSecret = secret || "fallback_very_secure_session_secret_1234567890123456";
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }
  
  const sessionData = decryptSession(sessionCookie.value, actualSecret);
  if (!sessionData || !sessionData.userId) {
    return null;
  }
  
  try {
    const user = await db.query.utente.findFirst({
      where: eq(utente.id, sessionData.userId),
      with: {
        ruoli: {
          with: {
            ruolo: true
          }
        },
        aree: {
          with: {
            area: true
          }
        }
      }
    });
    
    if (!user || !user.attivo) {
      return null;
    }
    
    return {
      id: user.id,
      nomeCognome: user.nomeCognome,
      email: user.email,
      username: user.username,
      ruoli: user.ruoli.map((ur) => ur.ruolo.nomeRuolo),
      areaIds: user.aree.map((ua) => ua.areaId),
    };
  } catch (error) {
    console.error("Error retrieving current user:", error);
    return null;
  }
}