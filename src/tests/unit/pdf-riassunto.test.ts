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

const mockMediationData = {
  id: 42,
  protocollo: "ADR-2026-000042",
  oggetto: "Oggetto di test della controversia per il PDF",
  valore: "10000.00",
  dataInserimento: "2026-07-17",
  stato: { id: 1, codice: "ACCORDO_RAGGIUNTO", descrizione: "ACCORDO RAGGIUNTO" },
  area: { id: 2, nomeArea: "Lecce" },
  areaId: 2,
  mediatoreId: 3, // Assegnata al mediatore con ID 3
  mediatore: { id: 3, nomeCognome: "Avv. Marco Bianchi" },
  soggetti: [],
  sedute: [],
  documenti: [],
};

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

  it("should block completely unauthorized roles (Utente Standard) and return 403 Forbidden", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 5,
      nomeCognome: "Mario Standard",
      email: "mario@example.com",
      username: "mario_std",
      ruoli: ["Utente Standard"],
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

  // --- CONTROLLO RUOLO MEDIATORE ---
  it("should block Mediator if the mediation is NOT assigned to them", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 99, // ID diverso da mediatoreId (3)
      nomeCognome: "Altro Mediatore",
      email: "altro@imecon.it",
      username: "altro_med",
      ruoli: ["Mediatore"],
      areaIds: [],
    });
    vi.mocked(db.query.mediazione.findFirst).mockResolvedValueOnce(mockMediationData as any);
    const req = new Request("http://localhost/api/gestionale/pdf-riassunto?id=42");
    const res = await GET(req);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain("Accesso negato");
  });

  it("should allow Mediator if the mediation IS assigned to them", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 3, // Stesso ID del mediatoreId (3)
      nomeCognome: "Marco Bianchi",
      email: "bianchi@imecon.it",
      username: "mbianchi",
      ruoli: ["Mediatore"],
      areaIds: [],
    });
    vi.mocked(db.query.mediazione.findFirst).mockResolvedValueOnce(mockMediationData as any);
    const req = new Request("http://localhost/api/gestionale/pdf-riassunto?id=42");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  // --- CONTROLLO RUOLO SEGRETERIA ---
  it("should block Secretary if the mediation area is NOT in their competent areas", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 4,
      nomeCognome: "Laura Segreteria",
      email: "segreteria@imecon.it",
      username: "lsegreteria",
      ruoli: ["Segreteria"],
      areaIds: [1, 3], // Aree 1 e 3 (la pratica ha areaId: 2)
    });
    vi.mocked(db.query.mediazione.findFirst).mockResolvedValueOnce(mockMediationData as any);
    const req = new Request("http://localhost/api/gestionale/pdf-riassunto?id=42");
    const res = await GET(req);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain("Accesso negato");
  });

  it("should allow Secretary if the mediation area IS in their competent areas", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 4,
      nomeCognome: "Laura Segreteria",
      email: "segreteria@imecon.it",
      username: "lsegreteria",
      ruoli: ["Segreteria"],
      areaIds: [2, 3], // Contiene l'areaId 2
    });
    vi.mocked(db.query.mediazione.findFirst).mockResolvedValueOnce(mockMediationData as any);
    const req = new Request("http://localhost/api/gestionale/pdf-riassunto?id=42");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  // --- CONTROLLO RUOLO AMMINISTRATORE ---
  it("should allow Admin for any mediation", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 1,
      nomeCognome: "Admin User",
      email: "admin@imecon.it",
      username: "admin_test",
      ruoli: ["Amministratore"],
      areaIds: [],
    });
    vi.mocked(db.query.mediazione.findFirst).mockResolvedValueOnce(mockMediationData as any);
    const req = new Request("http://localhost/api/gestionale/pdf-riassunto?id=42");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });
});
