import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/gestionale/documento/route";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";

// Mocking dependencies for unit isolation
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    query: {
      documento: {
        findFirst: vi.fn(),
      },
      mediazione: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock("fs/promises", () => ({
  default: {
    access: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(Buffer.from("%PDF-1.4 mock content")),
  },
}));

const mockDocData = {
  id: 42,
  mediazioneId: 10,
  nomeFile: "doc123.pdf",
  nomeOriginale: "Contratto.pdf",
  percorsoFile: "uploads/mediazioni/doc123.pdf",
  tipoMime: "application/pdf",
  dimensione: 1024,
};

const mockMediationData = {
  id: 10,
  areaId: 2,
  mediatoreId: 3, // Assegnata al mediatore con ID 3
};

describe("Security Check & Access Control for Document API", () => {
  it("should enforce parameter requirement and return 400 Bad Request if 'id' is missing", async () => {
    const req = new Request("http://localhost/api/gestionale/documento");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("mancante");
  });

  it("should enforce parameter type check and return 400 Bad Request if 'id' is not a number", async () => {
    const req = new Request("http://localhost/api/gestionale/documento?id=not-a-number");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("non valido");
  });

  it("should block unauthenticated access and return 403 Forbidden", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(null);
    const req = new Request("http://localhost/api/gestionale/documento?id=42");
    const res = await GET(req);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain("Accesso negato");
  });

  it("should block non-administrator/non-staff roles (Standard Users) and return 403 Forbidden", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 5,
      nomeCognome: "Mario Standard",
      email: "mario@example.com",
      username: "mario_std",
      ruoli: ["Utente Standard"],
      areaIds: [],
    });
    const req = new Request("http://localhost/api/gestionale/documento?id=42");
    const res = await GET(req);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain("Accesso negato");
  });

  it("should return 404 Not Found if document metadata is missing from the database", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 1,
      nomeCognome: "Admin User",
      email: "admin@imecon.it",
      username: "admin_test",
      ruoli: ["Amministratore"],
      areaIds: [],
    });
    vi.mocked(db.query.documento.findFirst).mockResolvedValueOnce(undefined);
    const req = new Request("http://localhost/api/gestionale/documento?id=9999");
    const res = await GET(req);
    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text).toContain("non trovato");
  });

  // --- CONTROLLO RUOLO MEDIATORE ---
  it("should block Mediator if the document's mediation is NOT assigned to them", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 99, // Diverso da mediatoreId (3)
      nomeCognome: "Altro Mediatore",
      email: "altro@imecon.it",
      username: "altro_med",
      ruoli: ["Mediatore"],
      areaIds: [],
    });
    vi.mocked(db.query.documento.findFirst).mockResolvedValueOnce(mockDocData as any);
    vi.mocked(db.query.mediazione.findFirst).mockResolvedValueOnce(mockMediationData as any);
    const req = new Request("http://localhost/api/gestionale/documento?id=42");
    const res = await GET(req);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain("Accesso negato");
  });

  it("should allow Mediator if the document's mediation IS assigned to them", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 3, // Stesso ID del mediatoreId
      nomeCognome: "Marco Bianchi",
      email: "bianchi@imecon.it",
      username: "mbianchi",
      ruoli: ["Mediatore"],
      areaIds: [],
    });
    vi.mocked(db.query.documento.findFirst).mockResolvedValueOnce(mockDocData as any);
    vi.mocked(db.query.mediazione.findFirst).mockResolvedValueOnce(mockMediationData as any);
    const req = new Request("http://localhost/api/gestionale/documento?id=42");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // --- CONTROLLO RUOLO SEGRETERIA ---
  it("should block Secretary if the document's mediation area is NOT in their competent areas", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 4,
      nomeCognome: "Laura Segreteria",
      email: "segreteria@imecon.it",
      username: "lsegreteria",
      ruoli: ["Segreteria"],
      areaIds: [1, 3], // Aree 1 e 3 (la pratica ha areaId: 2)
    });
    vi.mocked(db.query.documento.findFirst).mockResolvedValueOnce(mockDocData as any);
    vi.mocked(db.query.mediazione.findFirst).mockResolvedValueOnce(mockMediationData as any);
    const req = new Request("http://localhost/api/gestionale/documento?id=42");
    const res = await GET(req);
    expect(res.status).toBe(403);
    const text = await res.text();
    expect(text).toContain("Accesso negato");
  });

  it("should allow Secretary if the document's mediation area IS in their competent areas", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 4,
      nomeCognome: "Laura Segreteria",
      email: "segreteria@imecon.it",
      username: "lsegreteria",
      ruoli: ["Segreteria"],
      areaIds: [2, 3], // Contiene l'areaId 2
    });
    vi.mocked(db.query.documento.findFirst).mockResolvedValueOnce(mockDocData as any);
    vi.mocked(db.query.mediazione.findFirst).mockResolvedValueOnce(mockMediationData as any);
    const req = new Request("http://localhost/api/gestionale/documento?id=42");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // --- CONTROLLO RUOLO AMMINISTRATORE ---
  it("should allow Admin for any document", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 1,
      nomeCognome: "Admin User",
      email: "admin@imecon.it",
      username: "admin_test",
      ruoli: ["Amministratore"],
      areaIds: [],
    });
    vi.mocked(db.query.documento.findFirst).mockResolvedValueOnce(mockDocData as any);
    vi.mocked(db.query.mediazione.findFirst).mockResolvedValueOnce(mockMediationData as any);
    const req = new Request("http://localhost/api/gestionale/documento?id=42");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
