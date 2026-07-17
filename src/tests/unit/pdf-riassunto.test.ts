import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/gestionale/pdf-riassunto/route";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";

// Mocking dependencies for unit isolation
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    query: {
      mediazione: {
        findFirst: vi.fn(),
      },
    },
  },
}));

describe("Security Check & Access Control for PDF Summary API", () => {
  it("should enforce parameter requirement and return 400 Bad Request if 'id' is missing", async () => {
    const req = new Request("http://localhost/api/gestionale/pdf-riassunto");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("mancante");
  });

  it("should enforce parameter type check and return 400 Bad Request if 'id' is not a number", async () => {
    const req = new Request("http://localhost/api/gestionale/pdf-riassunto?id=not-a-number");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("non valido");
  });

  it("should block unauthenticated access and return 403 Forbidden", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);
    const req = new Request("http://localhost/api/gestionale/pdf-riassunto?id=42");
    const res = await GET(req);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain("Accesso negato");
  });

  it("should block non-administrator roles (Mediators) and return 403 Forbidden", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 3,
      nomeCognome: "Mario Mediatore",
      email: "mario@imecon.it",
      username: "mario_med",
      ruoli: ["Mediatore"],
      areaIds: [],
    });
    const req = new Request("http://localhost/api/gestionale/pdf-riassunto?id=42");
    const res = await GET(req);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain("Accesso negato");
  });

  it("should return 404 Not Found if mediation is missing from the database", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 1,
      nomeCognome: "Admin User",
      email: "admin@imecon.it",
      username: "admin_test",
      ruoli: ["Amministratore"],
      areaIds: [],
    });
    vi.mocked(db.query.mediazione.findFirst).mockResolvedValueOnce(undefined);
    const req = new Request("http://localhost/api/gestionale/pdf-riassunto?id=9999");
    const res = await GET(req);
    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text).toContain("non trovata");
  });

  it("should generate a valid PDF if user is admin and mediation exists", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 1,
      nomeCognome: "Admin User",
      email: "admin@imecon.it",
      username: "admin_test",
      ruoli: ["Amministratore"],
      areaIds: [],
    });
    vi.mocked(db.query.mediazione.findFirst).mockResolvedValueOnce({
      id: 1,
      protocollo: "ADR-2026-000012",
      oggetto: "Questa è una materia di prova per la generazione del verbale riassuntivo PDF.\nSeconda riga per testare l'a capo.",
      valore: "18500.00",
      dataInserimento: "2026-01-14",
      stato: { id: 1, codice: "CONCILIATA", descrizione: "Conciliata" },
      area: { id: 2, nomeArea: "Lecce" },
      mediatore: { id: 3, nomeCognome: "Avv. Marco Bianchi" },
      soggetti: [
        {
          ruoloNellaLite: "Istante",
          soggetto: {
            id: 10,
            tipoSoggetto: "PF",
            denominazione: "Soggetto Test Istante",
            codiceFiscalePiva: "SGGSTT80A01H501Z",
            email: "istante@example.com",
            telefono: "12345678",
            indirizzoResidenza: "Via del Mare 12",
            comuneResidenza: "Lecce",
            capResidenza: "73100",
            provinciaResidenza: "LE",
          },
        },
      ],
      sedute: [
        {
          id: 5,
          mediazioneId: 1,
          numeroProgressivo: 1,
          dataSeduta: new Date("2026-07-17T10:00:00Z"),
          notaVerbale: "Tutto si è svolto secondo norma, le parti concordano su un accordo preliminare.",
        },
      ],
      documenti: [
        {
          id: 20,
          mediazioneId: 1,
          nomeFile: "doc1.pdf",
          nomeOriginale: "Istanza_di_Mediazione.pdf",
          percorsoFile: "uploads/mediazioni/doc1.pdf",
          tipoMime: "application/pdf",
          dimensione: 1048576,
          dataCaricamento: new Date(),
        },
      ],
    } as any);

    const req = new Request("http://localhost/api/gestionale/pdf-riassunto?id=1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("riassunto-ADR-2026-000012.pdf");
    
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(0);
    
    // Verifichiamo l'intestazione standard PDF (%PDF-1.4)
    const view = new Uint8Array(buf);
    const pdfHeader = String.fromCharCode(view[0], view[1], view[2], view[3], view[4]);
    expect(pdfHeader).toBe("%PDF-");
  });
});
