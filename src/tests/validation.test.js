import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeInput,
  sanitizeEmail,
  validatePasswordStrength,
  RateLimiter,
  containsDangerousChars,
  escapeHtml,
  validateLength,
  isValidUrl
} from '../utils/validation';

describe('sanitizeInput', () => {
  it('removes < and > characters', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
  });

  it('removes javascript: prefix', () => {
    expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
  });

  it('removes inline event handlers', () => {
    expect(sanitizeInput('onclick=doSomething()')).toBe('doSomething()');
  });

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello world  ')).toBe('hello world');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput(42)).toBe('');
  });

  it('passes through clean text unchanged (after trim)', () => {
    expect(sanitizeInput('Empresa NAGMAR S.A. de C.V.')).toBe('Empresa NAGMAR S.A. de C.V.');
  });
});

describe('sanitizeEmail', () => {
  it('normalizes email to lowercase', () => {
    expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com');
  });

  it('trims whitespace from email', () => {
    expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
  });

  it('returns null for invalid email', () => {
    expect(sanitizeEmail('notanemail')).toBe(null);
    expect(sanitizeEmail('@example.com')).toBe(null);
  });

  it('returns null for non-string input', () => {
    expect(sanitizeEmail(null)).toBe(null);
    expect(sanitizeEmail(42)).toBe(null);
  });
});

describe('validatePasswordStrength', () => {
  it('accepts strong password', () => {
    const result = validatePasswordStrength('Nagmar2026!');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = validatePasswordStrength('Abc1!');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('8 caracteres'))).toBe(true);
  });

  it('rejects password without uppercase', () => {
    const result = validatePasswordStrength('nagmar2026!');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('mayúscula'))).toBe(true);
  });

  it('rejects password without lowercase', () => {
    const result = validatePasswordStrength('NAGMAR2026!');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('minúscula'))).toBe(true);
  });

  it('rejects password without number', () => {
    const result = validatePasswordStrength('NagmarPass!');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('número'))).toBe(true);
  });

  it('rejects password without special character', () => {
    const result = validatePasswordStrength('Nagmar2026');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('especial'))).toBe(true);
  });

  it('accumulates multiple errors', () => {
    const result = validatePasswordStrength('abc');
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe('RateLimiter', () => {
  let limiter;
  beforeEach(() => {
    limiter = new RateLimiter(3, 60000);
  });

  it('allows attempts within limit', () => {
    expect(limiter.recordAttempt('user1').blocked).toBe(false);
    expect(limiter.recordAttempt('user1').blocked).toBe(false);
    expect(limiter.recordAttempt('user1').blocked).toBe(false);
  });

  it('blocks after exceeding max attempts', () => {
    limiter.recordAttempt('user1');
    limiter.recordAttempt('user1');
    limiter.recordAttempt('user1');
    expect(limiter.recordAttempt('user1').blocked).toBe(true);
  });

  it('counts remaining attempts correctly', () => {
    const result = limiter.recordAttempt('user1');
    expect(result.attemptsRemaining).toBe(2);
  });

  it('tracks different identifiers independently', () => {
    limiter.recordAttempt('user1');
    limiter.recordAttempt('user1');
    limiter.recordAttempt('user1');
    expect(limiter.recordAttempt('user2').blocked).toBe(false);
  });

  it('resets attempts for an identifier', () => {
    limiter.recordAttempt('user1');
    limiter.recordAttempt('user1');
    limiter.recordAttempt('user1');
    limiter.reset('user1');
    expect(limiter.recordAttempt('user1').blocked).toBe(false);
  });
});

describe('containsDangerousChars', () => {
  it('detects <script> tag', () => {
    expect(containsDangerousChars('<script>alert(1)</script>')).toBe(true);
  });

  it('detects javascript: protocol', () => {
    expect(containsDangerousChars('javascript:void(0)')).toBe(true);
  });

  it('detects inline event handlers', () => {
    expect(containsDangerousChars('onclick=hack()')).toBe(true);
  });

  it('detects data: URI', () => {
    expect(containsDangerousChars('data:text/html,<h1>XSS</h1>')).toBe(true);
  });

  it('passes clean text', () => {
    expect(containsDangerousChars('Empresa S.A. de C.V.')).toBe(false);
    expect(containsDangerousChars('RFC: NAGM860102ABC')).toBe(false);
  });
});

describe('escapeHtml', () => {
  it('escapes < and >', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes ampersand', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('escapes quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe("it&#039;s");
  });

  it('returns empty string for non-string input', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('passes clean text unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});

describe('validateLength', () => {
  it('accepts string within min/max bounds', () => {
    expect(validateLength('hello', 1, 10)).toBe(true);
  });

  it('rejects string shorter than min', () => {
    expect(validateLength('hi', 5, 10)).toBe(false);
  });

  it('rejects string longer than max', () => {
    expect(validateLength('hello world', 1, 5)).toBe(false);
  });

  it('accepts exact min and max boundaries', () => {
    expect(validateLength('hello', 5, 5)).toBe(true);
  });

  it('returns false for null/undefined with min > 0', () => {
    expect(validateLength(null, 1, 10)).toBe(false);
  });
});

describe('isValidUrl', () => {
  it('accepts https URL', () => {
    expect(isValidUrl('https://nagmar.com')).toBe(true);
  });

  it('accepts http URL', () => {
    expect(isValidUrl('http://localhost:3001')).toBe(true);
  });

  it('rejects ftp protocol', () => {
    expect(isValidUrl('ftp://files.example.com')).toBe(false);
  });

  it('rejects plain text', () => {
    expect(isValidUrl('not a url')).toBe(false);
  });

  it('rejects javascript: URL', () => {
    expect(isValidUrl('javascript:void(0)')).toBe(false);
  });
});
