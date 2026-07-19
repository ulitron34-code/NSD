import { useEffect, useState } from "react";
import { adminAPI } from "../../services/api";
import { warn } from "../../utils/logger";

const EMPTY_SNAPSHOT = Object.freeze({
  source: "remote-not-loaded",
  status: "not-loaded",
  loading: false,
  users: [],
  auditLogs: [],
  humanReviews: [],
  metrics: {},
  modules: {
    users: { total: 0, byRole: [], recent: [] },
    reviews: { total: 0, highPriority: 0, items: [] },
    metrics: { cards: [], available: 0, redFlags: [], inconsistencies: [], note: null },
    audit: { total: 0, byAction: [], recent: [] },
  },
  summary: { users: 0, auditEvents: 0, humanReviews: 0, metricsAvailable: 0, failedSources: 0 },
  failedSources: [],
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function countBy(rows, key, fallback = "sin-clasificar") {
  return rows.reduce((counts, row) => {
    const value = row?.[key] || fallback;
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function buildMetricCards(metrics) {
  const definitions = [
    ["totalOrders", "Expedientes evaluados", "count"],
    ["avgGlobalScore", "Readiness promedio", "percent"],
    ["readyOrdersPercentage", "Expedientes listos", "percent"],
    ["avgMissingDocuments", "Documentos faltantes", "decimal"],
    ["illegibleDocumentRate", "Documentos ilegibles", "percent"],
    ["avgEvaluationSeconds", "Tiempo de evaluacion", "seconds"],
    ["avgCostUsdPerOrder", "Costo por expediente", "currency"],
    ["totalReportDownloads", "Reportes descargados", "count"],
  ];

  return definitions.map(([key, label, format]) => ({
    key,
    label,
    format,
    value: metrics[key] ?? null,
    available: metrics[key] !== null && metrics[key] !== undefined,
  }));
}

export function buildAdminOperationalModules({ users = [], auditLogs = [], humanReviews = [], metrics = {} } = {}) {
  const roleCounts = countBy(users, "profile_type");
  const auditActionCounts = countBy(auditLogs, "action");
  const pendingReviews = humanReviews.map((review) => ({
    id: review.id || review.documentId,
    orderId: review.orderId || review.order_id,
    projectName: review.projectName || review.project_name || review.caseNumber || review.case_number || "Expediente",
    documentName: review.filename || review.documentType || review.document_type || "Documento",
    score: review.reviewScore ?? review.score ?? null,
    confidence: review.confidence ?? null,
    reviewedAt: review.reviewedAt || review.reviewed_at || review.created_at || null,
    priority: Number(review.reviewScore ?? review.score ?? 100) < 60 ? "alta" : "normal",
  }));

  return {
    users: {
      total: users.length,
      byRole: Object.entries(roleCounts).map(([role, total]) => ({ role, total })),
      recent: users.slice(0, 5),
    },
    reviews: {
      total: pendingReviews.length,
      highPriority: pendingReviews.filter((review) => review.priority === "alta").length,
      items: pendingReviews,
    },
    metrics: {
      cards: buildMetricCards(metrics),
      available: buildMetricCards(metrics).filter((metric) => metric.available).length,
      redFlags: asArray(metrics.topRedFlags),
      inconsistencies: asArray(metrics.topInconsistencies),
      note: metrics.avgEvaluationNote || null,
    },
    audit: {
      total: auditLogs.length,
      byAction: Object.entries(auditActionCounts).map(([action, total]) => ({ action, total })),
      recent: auditLogs.slice(0, 5),
    },
  };
}

export function normalizeAdminOperationalSnapshot({ users, audit, reviews, metrics, failedSources = [] } = {}) {
  const userRows = asArray(users?.users || users);
  const auditRows = asArray(audit?.logs || audit);
  const reviewRows = asArray(reviews?.items || reviews?.reviews || reviews?.queue || reviews);
  const metricValues = asObject(metrics);
  const metricCount = Object.values(metricValues).filter((value) => value !== null && value !== undefined).length;
  const modules = buildAdminOperationalModules({
    users: userRows,
    auditLogs: auditRows,
    humanReviews: reviewRows,
    metrics: metricValues,
  });

  return {
    source: "remote-admin-read-only",
    status: failedSources.length ? "partial" : "available",
    loading: false,
    users: userRows,
    auditLogs: auditRows,
    humanReviews: reviewRows,
    metrics: metricValues,
    modules,
    summary: {
      users: Number(users?.total ?? userRows.length),
      auditEvents: Number(audit?.total ?? auditRows.length),
      humanReviews: Number(reviews?.total ?? reviewRows.length),
      metricsAvailable: metricCount,
      failedSources: failedSources.length,
    },
    failedSources,
  };
}

export function useAdminOperationalSnapshot({ enabled = true } = {}) {
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);

  useEffect(() => {
    if (!enabled) {
      setSnapshot(EMPTY_SNAPSHOT);
      return undefined;
    }

    let active = true;
    setSnapshot({ ...EMPTY_SNAPSHOT, source: "remote-loading", status: "loading", loading: true });

    Promise.allSettled([
      adminAPI.listUsers({ limit: 8 }),
      adminAPI.listAuditLogs({ limit: 8 }),
      adminAPI.listHumanReviewQueue({ limit: 8 }),
      adminAPI.getReadinessMetrics(),
    ]).then((results) => {
      if (!active) return;
      const sourceNames = ["users", "audit", "reviews", "metrics"];
      const failedSources = results
        .map((result, index) => result.status === "rejected" ? sourceNames[index] : null)
        .filter(Boolean);
      failedSources.forEach((source) => warn("NUXERA", `Admin operational source unavailable: ${source}`));
      setSnapshot(normalizeAdminOperationalSnapshot({
        users: results[0].status === "fulfilled" ? results[0].value.data : null,
        audit: results[1].status === "fulfilled" ? results[1].value.data : null,
        reviews: results[2].status === "fulfilled" ? results[2].value.data : null,
        metrics: results[3].status === "fulfilled" ? results[3].value.data : null,
        failedSources,
      }));
    });

    return () => { active = false; };
  }, [enabled]);

  return snapshot;
}
