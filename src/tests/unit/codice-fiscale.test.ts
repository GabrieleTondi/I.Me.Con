import { describe, test, expect } from "vitest";
import { calcolaCodiceFiscale } from "@/lib/codice-fiscale";

describe("Calcolo Codice Fiscale Utility", () => {
  test("Dovrebbe generare un Codice Fiscale valido di 16 caratteri per Persona Fisica (PF)", () => {
    const cf = calcolaCodiceFiscale("Rossi Mario", "1980-01-01", "PF", "Roma");
    expect(cf).toHaveLength(16);
    expect(cf).toMatch(/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/);
    expect(cf.startsWith("RSSMRA80A01H501")).toBe(true);
  });

  test("Dovrebbe gestire correttamente i nomi con 4 o più consonanti", () => {
    // "Giuseppe" ha consonanti G, S, P, P (4 consonanti) -> regola 1°, 3°, 4° => G, P, P
    const cf = calcolaCodiceFiscale("Verdi Giuseppe", "1990-05-15", "PF", "Milano");
    expect(cf).toHaveLength(16);
    expect(cf.slice(3, 6)).toBe("GPP");
    expect(cf).toMatch(/^[A-Z]{6}90E15F205[A-Z]$/);
  });

  test("Dovrebbe generare un Codice Fiscale/P.IVA a 11 cifre numeriche per Persona Giuridica (PG)", () => {
    const cf1 = calcolaCodiceFiscale("Condominio Via Roma 10", "", "PG");
    expect(cf1).toHaveLength(11);
    expect(cf1).toMatch(/^\d{11}$/);

    const cf2 = calcolaCodiceFiscale("Azienda S.R.L.", "2010-03-20", "PG");
    expect(cf2).toHaveLength(11);
    expect(cf2).toMatch(/^\d{11}$/);
  });

  test("Dovrebbe restituire una stringa vuota se la denominazione è vuota", () => {
    expect(calcolaCodiceFiscale("", "1980-01-01", "PF")).toBe("");
    expect(calcolaCodiceFiscale("   ", "1980-01-01", "PF")).toBe("");
  });
});
