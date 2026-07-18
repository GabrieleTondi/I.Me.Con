import { describe, it, expect, vi } from "vitest";
import { getScadenzaStatus, getMediationDeadline } from "@/lib/deadline-utils";
import { prorogaMediationAction } from "@/app/actions/mediation-actions";
import { checkDeadlinesAndNotify } from "@/lib/deadline-checker";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";

// Mocking session and database
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    execute: vi.fn(),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }),
    query: {
      mediazione: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  },
}));

describe("Mediation Deadline Logic & Business Rules", () => {
  describe("getScadenzaStatus", () => {
    it("should return null if the mediation is concluded", () => {
      const status = getScadenzaStatus("2026-07-17", false, true, new Date("2026-07-17"));
      expect(status).toBeNull();
    });

    it("should return 'verde' for a newly created active mediation", () => {
      const status = getScadenzaStatus("2026-07-17", false, false, new Date("2026-07-17"));
      expect(status).toBe("verde");
    });

    it("should return 'giallo' if more than 60 days have elapsed but remaining days > 10", () => {
      // 3 months = ~90 days. Day 70 is > 60 days elapsed and has 20 days remaining.
      const status = getScadenzaStatus("2026-07-17", false, false, new Date("2026-09-25"));
      expect(status).toBe("giallo");
    });

    it("should return 'rosso' if remaining days <= 10", () => {
      // Day 82 has 8 days remaining (under 10 days)
      const status = getScadenzaStatus("2026-07-17", false, false, new Date("2026-10-07"));
      expect(status).toBe("rosso");
    });

    it("should return 'rosso' if the deadline has already expired", () => {
      // Expired date
      const status = getScadenzaStatus("2026-07-17", false, false, new Date("2026-11-20"));
      expect(status).toBe("rosso");
    });

    it("should shift color from 'rosso' to 'giallo' when prorogata is changed from false to true", () => {
      // At day 82:
      // - Standard deadline (3 months = ~90 days): remaining = 8 days -> 'rosso'
      const statusStd = getScadenzaStatus("2026-07-17", false, false, new Date("2026-10-07"));
      expect(statusStd).toBe("rosso");

      // - Extended deadline (6 months = ~180 days): remaining = 98 days (> 10) and elapsed = 82 (> 60) -> 'giallo'
      const statusExt = getScadenzaStatus("2026-07-17", true, false, new Date("2026-10-07"));
      expect(statusExt).toBe("giallo");
    });
  });

  describe("prorogaMediationAction - Security & Permissions", () => {
    const mockMediation = {
      id: 10,
      areaId: 2,
      prorogata: false,
    };

    it("should block unauthenticated users", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null);
      const res = await prorogaMediationAction(10, true);
      expect(res.success).toBe(false);
      expect(res.error).toContain("Non autorizzato");
    });

    it("should block non-staff roles (e.g. Utente Standard)", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        id: 5,
        nomeCognome: "Mario Standard",
        email: "mario@example.com",
        username: "mario_std",
        ruoli: ["Utente Standard"],
        areaIds: [],
      });
      const res = await prorogaMediationAction(10, true);
      expect(res.success).toBe(false);
      expect(res.error).toContain("Accesso negato");
    });

    it("should block Mediators (Mediatori cannot extend deadlines)", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        id: 3,
        nomeCognome: "Avv. Marco Bianchi",
        email: "mediatore.bianchi@imecon.it",
        username: "mbianchi",
        ruoli: ["Mediatore"],
        areaIds: [2],
      });
      const res = await prorogaMediationAction(10, true);
      expect(res.success).toBe(false);
      expect(res.error).toContain("Accesso negato");
    });

    it("should allow Administrators to extend deadlines on any mediation", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        id: 1,
        nomeCognome: "Admin User",
        email: "admin@imecon.it",
        username: "admin_test",
        ruoli: ["Amministratore"],
        areaIds: [],
      });
      vi.mocked(db.query.mediazione.findFirst).mockResolvedValueOnce(mockMediation as any);
      const res = await prorogaMediationAction(10, true);
      expect(res.success).toBe(true);
    });

    it("should allow Secretary to extend deadlines if the area is of their pertinenza", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        id: 4,
        nomeCognome: "Laura Segreteria",
        email: "segreteria@imecon.it",
        username: "lsegreteria",
        ruoli: ["Segreteria"],
        areaIds: [2], // Competent area ID
      });
      vi.mocked(db.query.mediazione.findFirst).mockResolvedValueOnce(mockMediation as any);
      const res = await prorogaMediationAction(10, true);
      expect(res.success).toBe(true);
    });

    it("should block Secretary from extending deadlines if the area is not of their pertinenza", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        id: 4,
        nomeCognome: "Laura Segreteria",
        email: "segreteria@imecon.it",
        username: "lsegreteria",
        ruoli: ["Segreteria"],
        areaIds: [3], // Different area ID
      });
      vi.mocked(db.query.mediazione.findFirst).mockResolvedValueOnce(mockMediation as any);
      const res = await prorogaMediationAction(10, true);
      expect(res.success).toBe(false);
      expect(res.error).toContain("Accesso negato");
    });
  });

  describe("checkDeadlinesAndNotify - Notification System", () => {
    it("should generate simulated warning email log when mediation is exactly 10 days from expiring", async () => {
      const mockActiveMed = {
        id: 15,
        protocollo: "ADR-2026-TEST-99",
        oggetto: "Materia commerciale",
        dataInserimento: "2026-07-17",
        prorogata: false,
        mediatore: {
          email: "mediatore@example.com",
          nomeCognome: "Avv. Test Mediatore",
        },
        stato: {
          codice: "IN_CORSO",
        },
      };

      vi.mocked(db.query.mediazione.findMany).mockResolvedValueOnce([mockActiveMed] as any);

      // standard deadline (3 months) for 2026-07-17 is 2026-10-17.
      // exactly 10 days before 2026-10-17 is 2026-10-07.
      const logs = await checkDeadlinesAndNotify(new Date("2026-10-07"));

      expect(logs.length).toBe(1);
      expect(logs[0].recipient).toBe("mediatore@example.com");
      expect(logs[0].subject).toContain("Sollecito Scadenza");
      expect(logs[0].body).toContain("Giorni alla scadenza: 10 giorni");
    });

    it("should not generate log if days remaining is not 10", async () => {
      const mockActiveMed = {
        id: 15,
        protocollo: "ADR-2026-TEST-99",
        oggetto: "Materia commerciale",
        dataInserimento: "2026-07-17",
        prorogata: false,
        mediatore: {
          email: "mediatore@example.com",
          nomeCognome: "Avv. Test Mediatore",
        },
        stato: {
          codice: "IN_CORSO",
        },
      };

      vi.mocked(db.query.mediazione.findMany).mockResolvedValueOnce([mockActiveMed] as any);

      // 20 days remaining
      const logs = await checkDeadlinesAndNotify(new Date("2026-09-27"));
      expect(logs.length).toBe(0);
    });
  });
});
