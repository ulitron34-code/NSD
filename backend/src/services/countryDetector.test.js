import { describe, it, expect } from 'vitest';
import { detectCountryFromText } from './countryDetector.js';

describe('detectCountryFromText', () => {
  it('detecta Mexico por keywords del INE/SAT', () => {
    const result = detectCountryFromText('INSTITUTO NACIONAL ELECTORAL CLAVE DE ELECTOR ESTADOS UNIDOS MEXICANOS');
    expect(result.country).toBe('MX');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('detecta Colombia por keywords de Registraduria/DIAN', () => {
    const result = detectCountryFromText('REGISTRADURIA NACIONAL CEDULA DE CIUDADANIA REPUBLICA DE COLOMBIA');
    expect(result.country).toBe('CO');
  });

  it('detecta USA por keywords del IRS', () => {
    const result = detectCountryFromText('INTERNAL REVENUE SERVICE EMPLOYER IDENTIFICATION NUMBER FORM 1040');
    expect(result.country).toBe('US');
  });

  it('detecta Canada por keywords de CRA', () => {
    const result = detectCountryFromText('CANADA REVENUE AGENCY SOCIAL INSURANCE NUMBER FORM T2');
    expect(result.country).toBe('CA');
  });

  it('detecta Argentina por keywords de AFIP/CUIT', () => {
    const result = detectCountryFromText('ADMINISTRACION FEDERAL DE INGRESOS PUBLICOS CUIT REPUBLICA ARGENTINA');
    expect(result.country).toBe('AR');
  });

  it('es insensible a acentos y mayusculas', () => {
    const result = detectCountryFromText('república de colombia cédula de ciudadanía');
    expect(result.country).toBe('CO');
  });

  it('retorna country null si no hay texto o no hay coincidencias', () => {
    expect(detectCountryFromText('')).toEqual({ country: null, confidence: 0, matches: [] });
    expect(detectCountryFromText('texto sin ninguna señal de pais')).toEqual({ country: null, confidence: 0, matches: [] });
  });

  it('elige el pais con mayor score cuando hay señales ambiguas de varios paises', () => {
    // "SII" tiene bajo peso (0.60) y aparece en ambas; DIAN+Registraduria pesan mas para CO
    const result = detectCountryFromText('SII REGISTRADURIA NACIONAL DIRECCION DE IMPUESTOS Y ADUANAS NACIONALES');
    expect(result.country).toBe('CO');
  });
});
