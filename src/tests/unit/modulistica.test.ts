import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/modulistica/route";
import fs from "fs/promises";

vi.mock("fs/promises", () => ({
  default: {
    access: vi.fn(),
    readFile: vi.fn(),
  },
}));

describe("Modulistica Download API Security & Operations", () => {
  it("should return 400 if 'file' parameter is missing", async () => {
    const req = new Request("http://localhost/api/modulistica");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("mancante");
  });

  it("should block directory traversal files with 400 Bad Request", async () => {
    const req = new Request("http://localhost/api/modulistica?file=../../.env");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("non valido");
  });

  it("should block directory traversal using slashes", async () => {
    const req = new Request("http://localhost/api/modulistica?file=subdir/file.pdf");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("should return 404 if file does not exist", async () => {
    vi.mocked(fs.access).mockRejectedValueOnce(new Error("Not found"));
    const req = new Request("http://localhost/api/modulistica?file=NonExistentFile.pdf");
    const res = await GET(req);
    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text).toContain("non trovato");
  });

  it("should return 200 with appropriate mime headers when file is valid", async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from("mock pdf file content"));

    const req = new Request("http://localhost/api/modulistica?file=Codice_Etico.pdf");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="Codice_Etico.pdf"');
  });

  it("should map correct mime type for excel files", async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from("mock excel file content"));

    const req = new Request("http://localhost/api/modulistica?file=NUOVE_TARIFFE.xlsx");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  });
});
