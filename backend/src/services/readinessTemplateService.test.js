import { describe, it, expect } from 'vitest';
import { READINESS_TEMPLATES, listReadinessTemplates, buildReadinessTemplateMarkdown } from './readinessTemplateService.js';

describe('readinessTemplateService', () => {
  it('expone exactamente las 12 plantillas de la sección 31 del plan', () => {
    expect(READINESS_TEMPLATES).toHaveLength(12);
    const codes = new Set(READINESS_TEMPLATES.map((t) => t.code));
    expect(codes.size).toBe(12);
  });

  it('listReadinessTemplates regresa solo code/title, sin generar el contenido', () => {
    const list = listReadinessTemplates();
    expect(list).toHaveLength(12);
    expect(list[0]).toEqual({ code: expect.any(String), title: expect.any(String) });
  });

  it('genera markdown no vacío para cada plantilla, cada una con su propio título', () => {
    for (const { code, title } of listReadinessTemplates()) {
      const result = buildReadinessTemplateMarkdown(code);
      expect(result).not.toBeNull();
      expect(result.title).toBe(title);
      expect(result.content).toContain(`# Plantilla: ${title}`);
      expect(result.content.length).toBeGreaterThan(100);
    }
  });

  it('regresa null para un código de plantilla desconocido', () => {
    expect(buildReadinessTemplateMarkdown('no_existe')).toBeNull();
  });

  it('beneficiario_controlador compone criterios reales de doc_corporativa y doc_kyc', () => {
    const result = buildReadinessTemplateMarkdown('beneficiario_controlador');
    expect(result.content).toContain('Beneficiario controlador');
    expect(result.content).toContain('Screening PEP');
  });

  it('uso_de_recursos compone criterios reales de plan_negocios y modelo_financiero', () => {
    const result = buildReadinessTemplateMarkdown('uso_de_recursos');
    expect(result.content).toContain('Uso de recursos no coincide con monto solicitado');
  });
});
