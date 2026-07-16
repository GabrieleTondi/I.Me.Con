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
    },
  },
}));

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

  it("should block non-administrator roles (Standard Users) and return 403 Forbidden", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: 3,
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
});
