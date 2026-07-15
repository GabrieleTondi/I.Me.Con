import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, encryptSession, decryptSession } from "@/lib/auth";

describe("Authentication Helpers", () => {
  const password = "mySecurePassword123";
  const sessionSecret = "test_very_secure_session_secret_1234567890123456";

  describe("Password Hashing", () => {
    it("should hash a password and verify it correctly", () => {
      const hash = hashPassword(password);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
      
      const isMatch = verifyPassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it("should fail verification for incorrect password", () => {
      const hash = hashPassword(password);
      const isMatch = verifyPassword("wrongPassword", hash);
      expect(isMatch).toBe(false);
    });

    it("should generate different hashes for the same password due to salting", () => {
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("Session Encryption & Decryption (AES-256-GCM)", () => {
    const sessionData = { userId: 42 };

    it("should encrypt and decrypt session data successfully with correct secret", () => {
      const token = encryptSession(sessionData, sessionSecret);
      expect(token).toBeTypeOf("string");
      expect(token.split(":")).toHaveLength(4); // salt:iv:encrypted:authTag

      const decrypted = decryptSession(token, sessionSecret);
      expect(decrypted).not.toBeNull();
      expect(decrypted?.userId).toBe(42);
    });

    it("should return null when decrypting with incorrect secret", () => {
      const token = encryptSession(sessionData, sessionSecret);
      const decrypted = decryptSession(token, "wrong_secret_key_1234567890123456");
      expect(decrypted).toBeNull();
    });

    it("should return null for malformed session tokens", () => {
      const decrypted = decryptSession("invalid:token:format", sessionSecret);
      expect(decrypted).toBeNull();
    });
  });
});
