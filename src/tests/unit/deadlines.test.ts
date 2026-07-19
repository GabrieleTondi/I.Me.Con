import { describe, it, expect, vi } from "vitest";
import { getScadenzaStatus, getMediationDeadline } from "@/lib/deadline-utils";
import { prorogaMediationAction, updateCustomDeadlineAction } from "@/app/actions/mediation-actions";
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
      const status = getScadenzaStatus("2026-07-17", false, true, null, new Date("2026-07-17"));
      expect(status).toBeNull();
    });

    it("should return 'verde' for a newly created active mediation", () => {
      const status = getScadenzaStatus("2026-07-17", false, false, null, new Date("2026-07-17"));
      expect(status).toBe("verde");
    });

    it("should return 'giallo' if more than 60 days have elapsed but remaining days > 10", () => {
      // Standard deadline is now 6 months (180 days). Day 70 has plenty of days remaining (> 10) but elapsed is > 60.
      const status = getScadenzaStatus("2026-07-17", false, false, null, new Date("2026-09-25"));
      expect(status).toBe("giallo");
    });

    it("should return 'rosso' if remaining days <= 10 (standard 6 months is ~180 days, so day 172 leaves 8 days)", () => {
      const status = getScadenzaStatus("2026-07-17", false, false, null, new Date("2027-01-08"));
      expect(status).toBe("rosso");
    });

    it("should return 'rosso' if the deadline has already expired", () => {
      // Expired date
      const status = getScadenzaStatus("2026-07-17", false, false, null, new Date("2027-02-20"));
      expect(status).toBe("rosso");
    });

    it("should shift color when prorogata is changed from false to true", () => {
      // At day 172 (Jan 08, 2027):
      // - Standard deadline (6 months): remaining = 8 days -> 'rosso'
      const statusStd = getScadenzaStatus("2026-07-17", false, false, null, new Date("2027-01-08"));
      expect(statusStd).toBe("rosso");

      // - Extended deadline (12 months = ~365 days): remaining = 190 days (> 10) and elapsed = 172 (> 60) -> 'giallo'
      const statusExt = getScadenzaStatus("2026-07-17", true, false, null, new Date("2027-01-08"));
      expect(statusExt).toBe("giallo");
    });

    it("should completely override default dates if scadenzaPersonalizzata is set", () => {
      // Standard standard deadline is Jan 17, 2027.
      // If we set a custom deadline of 2026-08-01:
      const deadline = getMediationDeadline("2026-07-17", false, "2026-08-01");
      expect(deadline.toISOString().split("T")[0]).toBe("2026-08-01");

      // And it should evaluate warning status based on this custom date:
      // Reference date 2026-07-28 is 4 days before Aug 01 -> rosso
      const status = getScadenzaStatus("2026-07-17", false, false, "2026-08-01", new Date("2026-07-28"));
      expect(status).toBe("rosso");
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

    it("should block Mediators", async () => {
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
  });

  describe("updateCustomDeadlineAction - Security & Permissions", () => {
    const mockMediation = {
      id: 12,
      areaId: 2,
      scadenzaPersonalizzata: null,
    };

    it("should block non-administrator staff members (Segreteria is blocked from custom dates)", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        id: 4,
        nomeCognome: "Laura Segreteria",
        email: "segreteria@imecon.it",
        username: "lsegreteria",
        ruoli: ["Segreteria"],
        areaIds: [2],
      });
      const res = await updateCustomDeadlineAction(12, "2026-12-31");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Solo gli amministratori");
    });

    it("should allow Administrators to set custom deadline", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        id: 1,
        nomeCognome: "Admin User",
        email: "admin@imecon.it",
        username: "admin_test",
        ruoli: ["Amministratore"],
        areaIds: [],
      });
      vi.mocked(db.query.mediazione.findFirst).mockResolvedValueOnce(mockMediation as any);
      const res = await updateCustomDeadlineAction(12, "2026-12-31");
      expect(res.success).toBe(true);
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

      // standard deadline (6 months) for 2026-07-17 is 2027-01-17.
      // exactly 10 days before 2027-01-17 is 2027-01-07.
      const logs = await checkDeadlinesAndNotify(new Date("2027-01-07"));

      expect(logs.length).toBe(1);
      expect(logs[0].recipient).toBe("mediatore@example.com");
      expect(logs[0].subject).toContain("Sollecito Scadenza");
      expect(logs[0].body).toContain("Giorni alla scadenza: 10 giorni");
    });
  });
});
