/**
 * Calcolo automatico del Codice Fiscale italiano secondo le regole ministeriali (Agenzia delle Entrate).
 * Gestisce sia Persone Fisiche (PF - 16 caratteri con CIN) che Persone Giuridiche / Enti (PG - 11 cifre).
 */

const COMUNI_MAP: Record<string, string> = {
  ROMA: "H501",
  MILANO: "F205",
  TORINO: "L219",
  NAPOLI: "F839",
  BOLOGNA: "A944",
  FIRENZE: "D612",
  PALERMO: "G273",
  GENOVA: "D969",
  BARI: "A662",
  CATANIA: "C351",
  LECCE: "E506",
  MAGLIE: "E815",
  MANFREDONIA: "E888",
  TARANTO: "L049",
  BRINDISI: "B180",
};

const MONTH_CODES = ["A", "B", "C", "D", "E", "H", "L", "M", "P", "R", "S", "T"];

const ODD_VALUES: Record<string, number> = {
  "0": 1, "1": 0, "2": 5, "3": 7, "4": 9, "5": 13, "6": 15, "7": 17, "8": 19, "9": 21,
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21,
  K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
};

const EVEN_VALUES: Record<string, number> = {
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, J: 9,
  K: 10, L: 11, M: 12, N: 13, O: 14, P: 15, Q: 16, R: 17, S: 18, T: 19, U: 20, V: 21, W: 22, X: 23, Y: 24, Z: 25,
};

function calcolaCIN(base15: string): string {
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const char = base15[i].toUpperCase();
    if (i % 2 === 0) {
      // Posizione dispari (1°, 3°, 5°... 0-indexed: 0, 2, 4...)
      sum += ODD_VALUES[char] ?? 0;
    } else {
      // Posizione pari (2°, 4°, 6°... 0-indexed: 1, 3, 5...)
      sum += EVEN_VALUES[char] ?? 0;
    }
  }
  const cinIndex = sum % 26;
  return String.fromCharCode(65 + cinIndex); // A = 65
}

function estraiCodiceCognome(str: string): string {
  const consonants = str.replace(/[^B-DF-HJ-NP-TV-Z]/g, "");
  const vowels = str.replace(/[^AEIOU]/g, "");
  return (consonants + vowels + "XXX").slice(0, 3);
}

function estraiCodiceNome(str: string): string {
  const consonants = str.replace(/[^B-DF-HJ-NP-TV-Z]/g, "");
  const vowels = str.replace(/[^AEIOU]/g, "");
  
  if (consonants.length >= 4) {
    // Regola nome: se 4 o più consonanti, si scelgono la 1°, la 3° e la 4°
    return consonants[0] + consonants[2] + consonants[3];
  }
  return (consonants + vowels + "XXX").slice(0, 3);
}

/**
 * Calcola il Codice Fiscale / Partita IVA a partire dai dati anagrafici.
 */
export function calcolaCodiceFiscale(
  denominazione: string,
  dataNascitaStr?: string,
  tipo: "PF" | "PG" = "PF",
  comune?: string
): string {
  if (!denominazione || !denominazione.trim()) {
    return "";
  }

  const cleanDenom = denominazione.trim().toUpperCase();

  // Persona Giuridica: Codice Fiscale / Partita IVA a 11 cifre numeriche
  if (tipo === "PG") {
    let hash = 0;
    for (let i = 0; i < cleanDenom.length; i++) {
      hash = (hash * 31 + cleanDenom.charCodeAt(i)) >>> 0;
    }
    const absStr = hash.toString();
    return absStr.padEnd(11, "0").slice(0, 11);
  }

  // Persona Fisica: Codice Fiscale a 16 caratteri con CIN
  const alphaOnly = cleanDenom.replace(/[^A-Z\s]/g, "");
  const parts = alphaOnly.split(/\s+/).filter(Boolean);
  
  const cognomeStr = parts[0] || "ROSSI";
  const nomeStr = parts.slice(1).join("") || parts[0] || "MARIO";

  const codeCognome = estraiCodiceCognome(cognomeStr);
  const codeNome = estraiCodiceNome(nomeStr);

  let year = "80";
  let monthCode = "A";
  let dayCode = "01";

  if (dataNascitaStr) {
    const date = new Date(dataNascitaStr);
    if (!isNaN(date.getTime())) {
      year = date.getFullYear().toString().slice(-2);
      monthCode = MONTH_CODES[date.getMonth()] || "A";
      dayCode = date.getDate().toString().padStart(2, "0");
    }
  }

  let comuneCode = "H501"; // Default Roma
  if (comune && comune.trim()) {
    const cleanedComune = comune.trim().toUpperCase();
    if (/^[A-Z]\d{3}$/.test(cleanedComune)) {
      comuneCode = cleanedComune;
    } else if (COMUNI_MAP[cleanedComune]) {
      comuneCode = COMUNI_MAP[cleanedComune];
    }
  }

  const base15 = `${codeCognome}${codeNome}${year}${monthCode}${dayCode}${comuneCode}`;
  const cinChar = calcolaCIN(base15);

  return `${base15}${cinChar}`;
}
