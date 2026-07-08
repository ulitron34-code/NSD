// Ciclo de vida del expediente (sección 9 del plan): 9 estados derivados en
// tiempo real a partir de señales que YA existen (documents.version_number,
// document_reviews.status, document_review_notes.decision, metadata.archivedAt)
// -- no hay una columna de estado persistida ni triggers de transición
// explícitos, es una clasificación honesta calculada al vuelo, igual que
// computeWeightedGlobalScore/classifyReadinessLevel en readinessRubrics.js.
export const READINESS_LIFECYCLE_STATES = {
  archivado: { label: 'Archivado', description: 'Expediente cerrado, vencido o retirado.' },
  draft: { label: 'Draft', description: 'Proyecto creado, sin documentación suficiente.' },
  intake_incompleto: { label: 'Intake incompleto', description: 'Hay documentos cargados, pero faltan básicos.' },
  en_evaluacion_ia: { label: 'En evaluación IA', description: 'Documentos en proceso de extracción y análisis.' },
  rechazado_documentalmente: { label: 'Rechazado documentalmente', description: 'Faltantes críticos o riesgos no mitigables.' },
  precalificado_documentalmente: { label: 'Precalificado documentalmente', description: 'Expediente suficientemente sólido para presentarse.' },
  en_correccion: { label: 'En corrección', description: 'El solicitante está cargando nuevas versiones.' },
  observado: { label: 'Observado', description: 'La IA o un analista detectó faltantes, inconsistencias o riesgos.' },
  listo_para_revision_humana: { label: 'Listo para revisión humana', description: 'Cumple umbral mínimo para analista interno.' }
};

function build(status, reason) {
  return { status, label: READINESS_LIFECYCLE_STATES[status].label, reason };
}

// items: READINESS_ITEMS (id/code) ya cargado por readinessChecklistService.js.
// documents: TODAS las versiones de los documentos READY_* del expediente (no
// solo la más reciente) -- necesario para detectar "en_correccion" (version
// anterior observada, version nueva sin nota humana todavia).
// latestByCode/latestReviewByDocId/latestNoteByDocumentId: mismos mapas que ya
// arma getReadinessChecklist(), reusados para no repetir queries.
export function computeReadinessLifecycle({ items, documents, latestByCode, latestReviewByDocId, latestNoteByDocumentId, archivedAt }) {
  if (archivedAt) return build('archivado', 'El expediente fue archivado.');
  if (!documents.length) return build('draft', 'Proyecto creado, sin documentación suficiente.');

  const missingItems = items.filter((item) => !latestByCode[item.code]);
  if (missingItems.length) {
    return build('intake_incompleto', `Faltan ${missingItems.length} de ${items.length} documentos requeridos.`);
  }

  const latestDocs = items.map((item) => latestByCode[item.code]);

  const pendingReview = latestDocs.some((doc) => {
    const review = latestReviewByDocId[doc.id];
    return !review || review.status === 'processing';
  });
  if (pendingReview) {
    return build('en_evaluacion_ia', 'Documentos en proceso de extracción y análisis.');
  }

  const notesOnLatest = latestDocs.map((doc) => latestNoteByDocumentId[doc.id] || null);

  if (notesOnLatest.some((note) => note?.decision === 'rejected')) {
    return build('rechazado_documentalmente', 'Un analista rechazó al menos un documento del expediente.');
  }

  if (notesOnLatest.every((note) => note?.decision === 'approved')) {
    return build('precalificado_documentalmente', 'Un analista aprobó todos los documentos del expediente.');
  }

  const inCorrection = items.some((item) => {
    const latestDoc = latestByCode[item.code];
    if (latestNoteByDocumentId[latestDoc.id]) return false; // ya tiene nota propia, no es una correccion "en curso"
    const priorVersions = documents.filter((doc) => doc.document_type === item.code && doc.id !== latestDoc.id);
    return priorVersions.some((doc) => latestNoteByDocumentId[doc.id]?.decision === 'needs_more_info');
  });
  if (inCorrection) {
    return build('en_correccion', 'El solicitante subió una nueva versión tras una observación; pendiente de revisión.');
  }

  const hasRedFlags = latestDocs.some((doc) => latestReviewByDocId[doc.id]?.status === 'red');
  const hasUnresolvedObservation = notesOnLatest.some((note) => note?.decision === 'needs_more_info');
  if (hasRedFlags || hasUnresolvedObservation) {
    return build('observado', 'La IA o un analista detectó faltantes, inconsistencias o riesgos pendientes de corregir.');
  }

  return build('listo_para_revision_humana', 'Cumple el umbral mínimo documental y está listo para revisión de un analista.');
}
