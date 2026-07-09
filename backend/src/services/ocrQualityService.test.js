import { describe, it, expect } from 'vitest';
import { classifyOcrQuality } from './ocrQualityService.js';

describe('classifyOcrQuality (secciones 20.2/20.3 del plan)', () => {
  it('completed cuando hay suficiente texto extraido', () => {
    const result = classifyOcrQuality({ extractedText: 'palabra '.repeat(500), fileSizeBytes: 500_000 });
    expect(result.status).toBe('completed');
    expect(result.note).toBeNull();
  });

  it('low_quality cuando el archivo es grande (>2MB) pero se extrajo poco texto (<300 palabras)', () => {
    const result = classifyOcrQuality({ extractedText: 'palabra '.repeat(50), fileSizeBytes: 3 * 1024 * 1024 });
    expect(result.status).toBe('low_quality');
    expect(result.note).toContain('escaneo sin capa de texto');
  });

  it('NO marca low_quality si el archivo es pequeño aunque haya poco texto (documento corto legitimo)', () => {
    const result = classifyOcrQuality({ extractedText: 'palabra '.repeat(50), fileSizeBytes: 100_000 });
    expect(result.status).toBe('completed');
  });

  it('NO marca low_quality si hay suficiente texto aunque el archivo sea grande', () => {
    const result = classifyOcrQuality({ extractedText: 'palabra '.repeat(1000), fileSizeBytes: 5 * 1024 * 1024 });
    expect(result.status).toBe('completed');
  });

  it('failed cuando no se extrajo ningun texto', () => {
    const result = classifyOcrQuality({ extractedText: '', fileSizeBytes: 1_000_000 });
    expect(result.status).toBe('failed');
  });

  it('failed con mensaje especifico cuando el error indica PDF protegido con contraseña', () => {
    const result = classifyOcrQuality({ extractionError: new Error('File is encrypted with a password') });
    expect(result.status).toBe('failed');
    expect(result.note).toContain('protegido con contraseña');
  });

  it('failed con mensaje generico para otros errores de extraccion', () => {
    const result = classifyOcrQuality({ extractionError: new Error('Unexpected token in PDF stream') });
    expect(result.status).toBe('failed');
    expect(result.note).toContain('No se pudo extraer texto');
  });
});
