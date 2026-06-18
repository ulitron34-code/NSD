import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  screenNameAgainstOfac,
  primeOfacList,
  _resetOfacStateForTests
} from './ofacScreening.js';

const SAMPLE_CSV = [
  '36,"AEROCARIBBEAN AIRLINES",-0- ,"CUBA",-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,-0- ',
  '2674,"ABBAS, Abu","individual","SDGT","Director of PALESTINE LIBERATION FRONT",-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,"DOB 10 Dec 1948"',
  '24428,"SAI ADVISORS INC.",-0- ,"VENEZUELA",-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,-0- ,"Company Number 68-0678326"'
].join('\n');

function mockFetchOnce(impl) {
  global.fetch = vi.fn(impl);
}

describe('ofacScreening.screenNameAgainstOfac', () => {
  beforeEach(() => {
    _resetOfacStateForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete global.fetch;
  });

  it('responde "skipped" si no se proporciona nombre', () => {
    mockFetchOnce(async () => ({ ok: true, text: async () => SAMPLE_CSV }));
    const result = screenNameAgainstOfac('');
    expect(result.status).toBe('skipped');
    expect(result.detail).toMatch(/Sin nombre/);
  });

  it('responde "skipped" mientras la lista todavia se esta descargando', () => {
    let resolveFetch;
    mockFetchOnce(() => new Promise((resolve) => { resolveFetch = resolve; }));
    const result = screenNameAgainstOfac('Cualquier Nombre SA de CV');
    expect(result.status).toBe('skipped');
    expect(result.detail).toMatch(/aun se esta descargando/);
    resolveFetch({ ok: true, text: async () => SAMPLE_CSV });
  });

  it('detecta coincidencia exacta y la marca como "hit"', async () => {
    mockFetchOnce(async () => ({ ok: true, text: async () => SAMPLE_CSV }));
    await primeOfacList();
    const result = screenNameAgainstOfac('AEROCARIBBEAN AIRLINES');
    expect(result.status).toBe('hit');
    expect(result.matches[0].name).toBe('AEROCARIBBEAN AIRLINES');
    expect(result.matches[0].score).toBe(100);
  });

  it('detecta coincidencia por contencion de substring (heuristica)', async () => {
    mockFetchOnce(async () => ({ ok: true, text: async () => SAMPLE_CSV }));
    await primeOfacList();
    const result = screenNameAgainstOfac('SAI ADVISORS INC EXTRA DIVISION');
    expect(result.status).toBe('hit');
    expect(result.matches.some((m) => m.name === 'SAI ADVISORS INC.')).toBe(true);
  });

  it('responde "clear" cuando no hay ninguna coincidencia', async () => {
    mockFetchOnce(async () => ({ ok: true, text: async () => SAMPLE_CSV }));
    await primeOfacList();
    const result = screenNameAgainstOfac('Comercializadora Azteca SA de CV');
    expect(result.status).toBe('clear');
    expect(result.matches).toHaveLength(0);
  });

  it('responde "skipped" con detalle del error si la descarga falla', async () => {
    mockFetchOnce(async () => ({ ok: false, status: 503 }));
    await primeOfacList();
    const result = screenNameAgainstOfac('Cualquier Nombre SA de CV');
    expect(result.status).toBe('skipped');
    expect(result.detail).toMatch(/No se pudo descargar/);
  });

  it('no vuelve a descargar la lista si ya esta en cache (sin vencer)', async () => {
    mockFetchOnce(async () => ({ ok: true, text: async () => SAMPLE_CSV }));
    await primeOfacList();
    screenNameAgainstOfac('AEROCARIBBEAN AIRLINES');
    screenNameAgainstOfac('Comercializadora Azteca SA de CV');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
