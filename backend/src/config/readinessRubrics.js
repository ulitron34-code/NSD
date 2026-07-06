// Rúbricas por documento del checklist de 12 Requisitos Mínimos — portadas
// fielmente de la sección 13 de PLAN_INTEGRACION_MODULO_READINESS_CUMPLIMIENTO.md.
// Datos puros (estructura esperada, criterios+peso, banderas rojas) consumidos
// por backend/src/agents/readinessRubricAgent.js para armar el prompt de Claude
// y, si Claude no está configurado, para el fallback heurístico.

export const READINESS_RUBRICS = {
  plan_negocios: {
    label: 'Plan de negocios',
    estructuraEsperada: [
      'Portada', 'Resumen ejecutivo', 'Descripción de la empresa', 'Descripción del proyecto',
      'Problema u oportunidad', 'Solución/propuesta de valor', 'Modelo de negocio', 'Mercado objetivo',
      'Competencia', 'Estrategia comercial', 'Operación', 'Equipo directivo', 'Uso del financiamiento',
      'Proyecciones resumidas', 'Riesgos principales', 'Conclusión', 'Anexos'
    ],
    criterios: [
      { nombre: 'Claridad del resumen ejecutivo', peso: 10 },
      { nombre: 'Modelo de negocio entendible', peso: 15 },
      { nombre: 'Mercado y cliente definidos', peso: 10 },
      { nombre: 'Estrategia comercial viable', peso: 10 },
      { nombre: 'Equipo y capacidades', peso: 10 },
      { nombre: 'Uso de recursos claro', peso: 15 },
      { nombre: 'Conexión con modelo financiero', peso: 15 },
      { nombre: 'Riesgos reconocidos', peso: 10 },
      { nombre: 'Presentación profesional', peso: 5 }
    ],
    banderasRojas: []
  },

  estudio_viabilidad: {
    label: 'Estudio de viabilidad',
    estructuraEsperada: [
      'Objetivo del estudio', 'Alcance', 'Viabilidad técnica', 'Viabilidad operativa',
      'Viabilidad legal/regulatoria', 'Viabilidad comercial', 'Viabilidad financiera',
      'Viabilidad ambiental/social si aplica', 'Restricciones', 'Dependencias críticas',
      'Conclusiones', 'Recomendaciones'
    ],
    criterios: [
      { nombre: 'Alcance claro', peso: 10 },
      { nombre: 'Análisis técnico suficiente', peso: 15 },
      { nombre: 'Análisis operativo', peso: 10 },
      { nombre: 'Análisis legal/regulatorio', peso: 15 },
      { nombre: 'Análisis comercial', peso: 10 },
      { nombre: 'Análisis financiero', peso: 20 },
      { nombre: 'Riesgos y restricciones', peso: 10 },
      { nombre: 'Conclusión defendible', peso: 10 }
    ],
    banderasRojas: [
      'Viabilidad declarada sin datos', 'Permisos ignorados', 'Capacidad técnica no demostrada',
      'Dependencias críticas no identificadas', 'Conclusión positiva sin análisis financiero'
    ]
  },

  estudio_mercado: {
    label: 'Estudio de mercado y marketing',
    estructuraEsperada: [
      'Definición del mercado', 'Tamaño del mercado', 'Segmentación', 'Cliente objetivo',
      'Competencia directa e indirecta', 'Barreras de entrada', 'Tendencias', 'Análisis de precios',
      'Canales de venta', 'Estrategia de marketing', 'Proyección comercial', 'Fuentes'
    ],
    fuentesSugeridas: ['INEGI DENUE', 'INEGI Censos Económicos', 'Banxico SIE', 'Secretaría de Economía', 'Cámaras sectoriales'],
    criterios: [
      { nombre: 'Mercado definido correctamente', peso: 10 },
      { nombre: 'Tamaño de mercado con fuente', peso: 15 },
      { nombre: 'Segmentación útil', peso: 10 },
      { nombre: 'Competencia identificada', peso: 15 },
      { nombre: 'Pricing defendible', peso: 10 },
      { nombre: 'Canales y estrategia', peso: 10 },
      { nombre: 'Proyección comercial vinculada al modelo financiero', peso: 20 },
      { nombre: 'Fuentes verificables', peso: 10 }
    ],
    banderasRojas: [
      'Mercado "global" sin segmentación', 'TAM/SAM/SOM inventado', 'Competidores ignorados',
      'Estrategia comercial sin presupuesto', 'Proyección de ventas desconectada de capacidad operativa'
    ]
  },

  marco_riesgos: {
    label: 'Marco de gestión de riesgos',
    estructuraEsperada: [
      'Metodología de riesgos', 'Matriz de riesgos', 'Riesgos financieros', 'Riesgos operativos',
      'Riesgos legales/regulatorios', 'Riesgos fiscales', 'Riesgos de mercado', 'Riesgos tecnológicos',
      'Riesgos ambientales/sociales', 'Riesgos reputacionales', 'Mitigantes', 'Responsables',
      'Indicadores de seguimiento'
    ],
    criterios: [
      { nombre: 'Metodología clara', peso: 10 },
      { nombre: 'Riesgos completos por categoría', peso: 20 },
      { nombre: 'Probabilidad/impacto', peso: 15 },
      { nombre: 'Mitigantes realistas', peso: 20 },
      { nombre: 'Responsables definidos', peso: 10 },
      { nombre: 'Seguimiento/indicadores', peso: 10 },
      { nombre: 'Conexión con modelo financiero', peso: 15 }
    ],
    banderasRojas: []
  },

  modelo_financiero: {
    label: 'Modelo financiero y proyecciones',
    estructuraEsperada: [
      'Supuestos generales', 'Supuestos comerciales', 'Ingresos proyectados', 'Costos directos',
      'Gastos operativos', 'CAPEX', 'Capital de trabajo', 'Estado de resultados', 'Balance general',
      'Flujo de efectivo', 'Servicio de deuda', 'Escenarios', 'Sensibilidad', 'Punto de equilibrio',
      'Indicadores financieros', 'Uso de recursos'
    ],
    indicadoresMinimos: ['EBITDA', 'Margen EBITDA', 'Flujo libre de caja', 'DSCR', 'Liquidez corriente', 'Endeudamiento', 'Cobertura de intereses', 'Break-even'],
    criterios: [
      { nombre: 'Supuestos explícitos', peso: 15 },
      { nombre: 'Estados financieros completos', peso: 20 },
      { nombre: 'Flujo de efectivo', peso: 15 },
      { nombre: 'Servicio de deuda', peso: 15 },
      { nombre: 'Escenarios y sensibilidad', peso: 15 },
      { nombre: 'Uso de recursos consistente', peso: 10 },
      { nombre: 'Indicadores financieros', peso: 10 }
    ],
    banderasRojas: [
      'Crecimiento agresivo sin explicación', 'Costos fijos subestimados', 'CAPEX ausente',
      'No hay flujo de efectivo', 'No hay servicio de deuda', 'DSCR insuficiente',
      'Uso de recursos no coincide con monto solicitado'
    ]
  },

  doc_corporativa: {
    label: 'Documentación Corporativa',
    documentosEsperados: [
      'Acta constitutiva', 'RFC', 'Constancia de situación fiscal', 'Comprobante de domicilio',
      'Identificación representante legal', 'Poderes del representante', 'Estructura accionaria',
      'Beneficiario controlador'
    ],
    criterios: [
      { nombre: 'Existencia corporativa', peso: 20 },
      { nombre: 'Coincidencia razón social/RFC', peso: 15 },
      { nombre: 'Poderes suficientes', peso: 15 },
      { nombre: 'Accionistas identificados', peso: 15 },
      { nombre: 'Beneficiario controlador', peso: 15 },
      { nombre: 'Vigencia documental', peso: 10 },
      { nombre: 'Permisos sectoriales', peso: 10 }
    ],
    banderasRojas: []
  },

  identificacion_oficial: {
    label: 'Identificación Oficial (INE/Pasaporte)',
    validacionesMinimas: [
      'Tipo de documento (INE o pasaporte)', 'Nombre completo legible', 'CURP o numero de documento legible',
      'Fecha de vigencia no vencida', 'Fotografia presente', 'Frente y reverso (si es INE)',
      'Coincidencia de nombre con el resto del expediente'
    ],
    criterios: [
      { nombre: 'Documento vigente', peso: 30 },
      { nombre: 'Legibilidad de datos clave', peso: 25 },
      { nombre: 'Frente y reverso completos (INE)', peso: 20 },
      { nombre: 'Coincidencia de nombre con el expediente', peso: 15 },
      { nombre: 'Sin indicios de alteracion', peso: 10 }
    ],
    banderasRojas: [
      'Documento vencido', 'Nombre no coincide con el resto del expediente', 'Falta el reverso de la INE',
      'Fotografia o datos no legibles', 'Indicios de edicion o alteracion digital'
    ]
  },

  doc_kyc: {
    label: 'Documentación KYC y de Cumplimiento',
    validacionesMinimas: [
      'Identificación de empresa', 'Identificación de representantes legales', 'Identificación de accionistas',
      'Beneficiarios controladores', 'Screening PEP', 'Screening OFAC/SDN/Consolidated',
      'Validación SAT 69/69-B/69-B Bis', 'Riesgo PLD/FT'
    ],
    criterios: [
      { nombre: 'Identificación completa KYB', peso: 20 },
      { nombre: 'Beneficiario controlador', peso: 20 },
      { nombre: 'Screening listas', peso: 20 },
      { nombre: 'Riesgo fiscal SAT', peso: 15 },
      { nombre: 'Riesgo PEP', peso: 10 },
      { nombre: 'Origen/destino de recursos', peso: 10 },
      { nombre: 'Evidencia documental', peso: 5 }
    ],
    banderasRojas: []
  },

  viabilidad_financiera: {
    label: 'Revisión de Viabilidad Financiera',
    evaluacionesMinimas: [
      'Monto solicitado vs uso de recursos', 'Plazo solicitado vs generación de flujo',
      'Flujo operativo vs servicio de deuda', 'DSCR base y estresado', 'EBITDA histórico/proyectado',
      'Liquidez', 'Apalancamiento', 'Concentración de clientes', 'Sensibilidad a tipo de cambio/tasas/inflación'
    ],
    criterios: [
      { nombre: 'Capacidad de pago', peso: 25 },
      { nombre: 'DSCR', peso: 20 },
      { nombre: 'Liquidez', peso: 10 },
      { nombre: 'Endeudamiento', peso: 10 },
      { nombre: 'Consistencia de supuestos', peso: 15 },
      { nombre: 'Escenarios de estrés', peso: 10 },
      { nombre: 'Uso de recursos', peso: 10 }
    ],
    banderasRojas: []
  },

  transparencia_documental: {
    label: 'Transparencia Documental',
    revisionesMinimas: [
      'Documentos legibles', 'Documentos no duplicados', 'Vigencia', 'Versiones', 'Firmas', 'Fechas',
      'Nombres consistentes', 'Montos consistentes', 'Anexos referenciados', 'Metadatos de carga'
    ],
    criterios: [
      { nombre: 'Legibilidad', peso: 15 },
      { nombre: 'Completitud', peso: 20 },
      { nombre: 'Vigencia', peso: 15 },
      { nombre: 'Consistencia entre documentos', peso: 25 },
      { nombre: 'Control de versiones', peso: 10 },
      { nombre: 'Evidencia/anexos', peso: 10 },
      { nombre: 'Trazabilidad', peso: 5 }
    ],
    banderasRojas: []
  },

  esg: {
    label: 'Apartado ESG & Impact Financing',
    estructuraEsperada: [
      'Descripción del impacto', 'Problema ambiental/social atendido', 'Actividad económica del proyecto',
      'Elegibilidad bajo taxonomía sostenible si aplica', 'Indicadores de impacto', 'Línea base', 'Metas',
      'Método de medición', 'Riesgos ESG', 'Gobernanza del impacto', 'Reportabilidad', 'Prevención de greenwashing'
    ],
    criterios: [
      { nombre: 'Impacto definido', peso: 15 },
      { nombre: 'Evidencia de impacto', peso: 20 },
      { nombre: 'Indicadores medibles', peso: 20 },
      { nombre: 'Alineación taxonomía/marcos', peso: 15 },
      { nombre: 'Riesgos ESG', peso: 15 },
      { nombre: 'Gobernanza y seguimiento', peso: 10 },
      { nombre: 'Anti-greenwashing', peso: 5 }
    ],
    banderasRojas: []
  },

  ods: {
    label: 'Alineación con ODS de la ONU',
    reglas: [
      'Exigir ODS aplicable con meta específica', 'Indicador medible', 'Evidencia',
      'Relación causal con el proyecto', 'Método de seguimiento',
      'No aceptar selección de múltiples ODS sin soporte ("ESG de confeti")'
    ],
    criterios: [
      { nombre: 'ODS declarados con meta específica', peso: 30 },
      { nombre: 'Indicador medible por ODS', peso: 30 },
      { nombre: 'Evidencia de relación causal', peso: 25 },
      { nombre: 'Método de seguimiento', peso: 15 }
    ],
    banderasRojas: ['ODS declarado sin evidencia ni indicador medible']
  },

  esia: {
    label: 'Impacto Ambiental, Social y de Gobernanza',
    revisionMinima: [
      'Tipo de actividad', 'Ubicación', 'Uso de suelo', 'Permisos', 'MIA si aplica', 'Comunidades afectadas',
      'Riesgo hídrico', 'Biodiversidad', 'Emisiones', 'Residuos', 'Seguridad laboral', 'Derechos laborales',
      'Anticorrupción', 'Gobierno corporativo', 'Mecanismo de quejas'
    ],
    criterios: [
      { nombre: 'Identificación de impactos', peso: 20 },
      { nombre: 'Permisos y cumplimiento', peso: 20 },
      { nombre: 'Riesgo ambiental', peso: 15 },
      { nombre: 'Riesgo social', peso: 15 },
      { nombre: 'Gobernanza', peso: 10 },
      { nombre: 'Mitigantes', peso: 15 },
      { nombre: 'Monitoreo', peso: 5 }
    ],
    banderasRojas: []
  }
};

export function getRubric(itemId) {
  return READINESS_RUBRICS[itemId] || null;
}
