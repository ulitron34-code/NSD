import { randomUUID } from 'crypto';

// Genera alertas basadas en los documentos existentes del expediente.
// Lee expires_at de cada documento — no requiere tablas nuevas.
export function generateDocumentAlerts(documents = []) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const alerts = [];

  for (const doc of documents) {
    if (!doc.expires_at) continue;
    const expiry = new Date(doc.expires_at);
    if (Number.isNaN(expiry.getTime())) continue;

    const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      alerts.push({
        type: 'document_expired',
        severity: 'critical',
        documentId: doc.id,
        documentName: doc.filename,
        daysUntilExpiry: daysUntil,
        expiryDate: doc.expires_at,
        message: `"${doc.filename}" venció hace ${Math.abs(daysUntil)} día(s).`
      });
    } else if (daysUntil <= 30) {
      alerts.push({
        type: 'document_expiry',
        severity: 'high',
        documentId: doc.id,
        documentName: doc.filename,
        daysUntilExpiry: daysUntil,
        expiryDate: doc.expires_at,
        message: `"${doc.filename}" vence en ${daysUntil} día(s).`
      });
    } else if (daysUntil <= 60) {
      alerts.push({
        type: 'document_expiry',
        severity: 'medium',
        documentId: doc.id,
        documentName: doc.filename,
        daysUntilExpiry: daysUntil,
        expiryDate: doc.expires_at,
        message: `"${doc.filename}" vence en ${daysUntil} día(s).`
      });
    } else if (daysUntil <= 90) {
      alerts.push({
        type: 'document_expiry',
        severity: 'low',
        documentId: doc.id,
        documentName: doc.filename,
        daysUntilExpiry: daysUntil,
        expiryDate: doc.expires_at,
        message: `"${doc.filename}" vence en ${daysUntil} día(s).`
      });
    }
  }

  return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

// Genera alerta si la próxima revisión programada está próxima o vencida.
export function generateReviewAlerts(reviewSchedule = {}) {
  if (!reviewSchedule?.nextReviewDate) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reviewDate = new Date(reviewSchedule.nextReviewDate);
  if (Number.isNaN(reviewDate.getTime())) return [];

  const daysUntil = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return [{
      type: 'review_overdue',
      severity: 'high',
      message: `Revisión periódica vencida hace ${Math.abs(daysUntil)} día(s). Fecha programada: ${reviewSchedule.nextReviewDate}.`,
      daysUntilExpiry: daysUntil,
      expiryDate: reviewSchedule.nextReviewDate
    }];
  }
  if (daysUntil <= 14) {
    return [{
      type: 'review_due',
      severity: 'medium',
      message: `Revisión periódica en ${daysUntil} día(s).`,
      daysUntilExpiry: daysUntil,
      expiryDate: reviewSchedule.nextReviewDate
    }];
  }
  return [];
}

// Evalúa el estado actual de cada covenant comparando valor actual vs requerido.
export function evaluateCovenants(covenants = []) {
  return covenants.map((cov) => {
    if (cov.currentValue == null || cov.requiredValue == null) {
      return { ...cov, computedStatus: 'pendiente' };
    }
    const meets = cov.direction === 'max'
      ? Number(cov.currentValue) <= Number(cov.requiredValue)
      : Number(cov.currentValue) >= Number(cov.requiredValue);
    return { ...cov, computedStatus: meets ? 'cumple' : 'incumple' };
  });
}

// Genera un score 0-100 y semáforo del monitor de cumplimiento.
export function computeComplianceScore(alerts = [], covenants = []) {
  const critical = alerts.filter((a) => a.severity === 'critical').length;
  const high = alerts.filter((a) => a.severity === 'high').length;
  const medium = alerts.filter((a) => a.severity === 'medium').length;
  const incumple = covenants.filter((c) => c.computedStatus === 'incumple').length;

  const deductions = critical * 30 + high * 15 + medium * 8 + incumple * 20;
  const score = Math.max(0, 100 - deductions);

  let semaforo, status;
  if (score >= 80 && critical === 0 && incumple === 0) {
    semaforo = 'Verde'; status = 'al_dia';
  } else if (score >= 50 && critical === 0) {
    semaforo = 'Amarillo'; status = 'atencion';
  } else {
    semaforo = 'Rojo'; status = 'en_riesgo';
  }

  return { score, semaforo, status, criticalCount: critical, highCount: high, incumpleCount: incumple };
}

// Normaliza y valida una lista de covenants antes de guardar.
export function normalizeCovenants(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .filter((c) => c && String(c.name || '').trim())
    .map((c) => ({
      id: c.id || randomUUID(),
      name: String(c.name).trim(),
      description: String(c.description || '').trim() || null,
      requiredValue: c.requiredValue !== '' && c.requiredValue != null ? Number(c.requiredValue) : null,
      currentValue: c.currentValue !== '' && c.currentValue != null ? Number(c.currentValue) : null,
      unit: String(c.unit || '').trim() || null,
      direction: c.direction === 'max' ? 'max' : 'min',
      nextVerificationAt: c.nextVerificationAt || null,
      lastUpdatedAt: new Date().toISOString()
    }));
}

// Normaliza el schedule de revisión periódica.
export function normalizeReviewSchedule(raw = {}) {
  const validFrequencies = ['monthly', 'quarterly', 'biannual', 'annual'];
  return {
    nextReviewDate: raw.nextReviewDate || null,
    frequency: validFrequencies.includes(raw.frequency) ? raw.frequency : 'quarterly',
    notes: String(raw.notes || '').trim() || null,
    lastUpdatedAt: new Date().toISOString()
  };
}
