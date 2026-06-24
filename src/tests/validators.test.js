import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateRFC,
  getValidationError
} from '../utils/validators';

describe('validateEmail', () => {
  it('accepts valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('nombre.apellido@empresa.com.mx')).toBe(true);
  });

  it('rejects email without @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('rejects email without domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateEmail('')).toBe(false);
  });

  it('rejects email with spaces', () => {
    expect(validateEmail('user @example.com')).toBe(false);
  });
});

describe('validatePassword', () => {
  it('accepts password with 8+ characters', () => {
    expect(validatePassword('12345678')).toBe(true);
    expect(validatePassword('abcdefghij')).toBe(true);
  });

  it('rejects password shorter than 8 characters', () => {
    expect(validatePassword('abc')).toBe(false);
    expect(validatePassword('1234567')).toBe(false);
  });

  it('rejects empty password', () => {
    expect(validatePassword('')).toBe(false);
  });
});

describe('validateRFC', () => {
  it('accepts valid RFC persona moral (4 letras)', () => {
    expect(validateRFC('NAGM860102ABC')).toBe(true);
  });

  it('accepts valid RFC persona física (3 letras)', () => {
    expect(validateRFC('ROGL8501012H4')).toBe(true);
  });

  it('accepts RFC with &', () => {
    expect(validateRFC('&ABC860102ABC')).toBe(true);
  });

  it('rejects RFC that is too short', () => {
    expect(validateRFC('ABC123')).toBe(false);
  });

  it('rejects RFC with lowercase (validates after toUpperCase)', () => {
    expect(validateRFC('nagm860102abc')).toBe(true);
  });

  it('rejects RFC with invalid chars', () => {
    expect(validateRFC('ABC!860102AB3')).toBe(false);
  });
});

describe('getValidationError', () => {
  it('returns empty for valid email', () => {
    expect(getValidationError('email', 'user@example.com')).toBe('');
  });

  it('returns required error for empty email', () => {
    expect(getValidationError('email', '')).toBe('Email es requerido');
  });

  it('returns format error for invalid email', () => {
    expect(getValidationError('email', 'notanemail')).toBe('Email invalido');
  });

  it('returns required error for empty password', () => {
    expect(getValidationError('password', '')).toBe('Contraseña es requerida');
  });

  it('returns length error for short password', () => {
    expect(getValidationError('password', '123')).toBe('Minimo 8 caracteres');
  });

  it('returns empty for valid password', () => {
    expect(getValidationError('password', '12345678')).toBe('');
  });

  it('returns required error for empty role', () => {
    expect(getValidationError('role', '')).toBe('Tipo de usuario es requerido');
  });

  it('returns empty string for unknown field', () => {
    expect(getValidationError('unknownField', 'anything')).toBe('');
  });
});
