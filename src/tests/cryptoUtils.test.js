import { describe, it, expect } from 'vitest';
import {
  generateSecureToken,
  generateCSRFNonce,
  generateSessionKey,
  isCryptoAvailable
} from '../utils/cryptoUtils';

describe('cryptoUtils', () => {
  describe('generateSecureToken', () => {
    it('should generate a token with correct format', () => {
      const token = generateSecureToken();
      expect(token).toMatch(/^tok_[a-f0-9]+_[a-z0-9]+_[a-f0-9-]+$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });

    it('should respect custom prefix length', () => {
      const token = generateSecureToken(16);
      const prefixPart = token.split('_')[1];
      expect(prefixPart.length).toBe(32); // 16 bytes = 32 hex chars
    });

    it('should include timestamp in token', () => {
      const before = Date.now().toString(36);
      const token = generateSecureToken();
      const timestampPart = token.split('_')[2];
      expect(parseInt(timestampPart, 36)).toBeGreaterThanOrEqual(parseInt(before, 36));
    });

    it('should include valid UUID', () => {
      const token = generateSecureToken();
      const uuidPart = token.split('_')[3];
      expect(uuidPart).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });

  describe('generateCSRFNonce', () => {
    it('should generate a 64-character hex string', () => {
      const nonce = generateCSRFNonce();
      expect(nonce).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate unique nonces', () => {
      const nonce1 = generateCSRFNonce();
      const nonce2 = generateCSRFNonce();
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe('generateSessionKey', () => {
    it('should generate a base64url encoded key', () => {
      const key = generateSessionKey(32);
      expect(key).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(key.length).toBeGreaterThan(40); // base64url encoded
    });

    it('should respect custom length', () => {
      const shortKey = generateSessionKey(16);
      const longKey = generateSessionKey(64);
      expect(shortKey.length).toBeLessThan(longKey.length);
    });
  });

  describe('isCryptoAvailable', () => {
    it('should return true when crypto APIs are available', () => {
      expect(isCryptoAvailable()).toBe(true);
    });
  });
});