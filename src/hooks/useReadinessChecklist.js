import { error as logError, warn } from '../utils/logger';
import { useCallback, useEffect, useMemo, useState } from "react";
import { readinessChecklistAPI, documentsAPI } from "../services/api";
import { useRequisitosMinimos } from "./useRequisitosMinimos";
import { REQUISITOS_MINIMOS, SECTOR_SPECIFIC_ITEM, DEMO_EXPEDIENTE_ID, localizeRequisito } from "../data/requisitosMinimos";

const READY_CODE_BY_ITEM_ID = Object.fromEntries(
  [...REQUISITOS_MINIMOS, SECTOR_SPECIFIC_ITEM].map((item) => [item.id, `READY_${item.id.toUpperCase()}`])
);

function deriveAggregates(items) {
  const completados = items.filter((item) => item.estado === "listo").length;
  const criticosPendientes = items.filter((item) => item.critico && item.estado !== "listo");
  const progreso = items.length ? Math.round((completados / items.length) * 100) : 0;
  return {
    completados,
    total: items.length,
    progreso,
    criticosPendientes,
    listoParaEnviar: criticosPendientes.length === 0
  };
}

function useRealReadinessChecklist(orderId) {
  const [remoteItems, setRemoteItems] = useState(null);
  const [country, setCountry] = useState("MX");
  const [sector, setSector] = useState(null);
  const [financingType, setFinancingType] = useState(null);
  const [globalScore, setGlobalScore] = useState(null);
  const [lifecycle, setLifecycle] = useState(null);
  const [sdgByItem, setSdgByItem] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchChecklist = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await readinessChecklistAPI.get(orderId);
      setRemoteItems(data.items);
      setCountry(data.country || "MX");
      setSector(data.sector || null);
      setFinancingType(data.financingType || null);
      setGlobalScore(data.globalScore || null);
      setLifecycle(data.lifecycle || null);
    } catch (err) {
      logError("SVC", "No se pudo cargar el checklist real de readiness", err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  const items = useMemo(() => {
    // permisos_sectoriales (sección 19.1 del plan) solo se muestra si el
    // backend realmente lo incluyó en la respuesta -- es el que decide según
    // el sector declarado del expediente, el frontend no duplica esa regla.
    const incluyeSectorial = (remoteItems || []).some((r) => r.id === SECTOR_SPECIFIC_ITEM.id);
    const definiciones = incluyeSectorial ? [...REQUISITOS_MINIMOS, SECTOR_SPECIFIC_ITEM] : REQUISITOS_MINIMOS;

    return definiciones.map((baseDef) => {
      const def = localizeRequisito(baseDef, country);
      const remote = (remoteItems || []).find((r) => r.id === def.id) || {};
      return {
        ...def,
        estado: remote.estado || "pendiente",
        evidenciaNombre: remote.evidenciaNombre || null,
        documentoId: remote.documentoId || null,
        enRevision: remote.enRevision || false,
        reviewStatus: remote.reviewStatus || null,
        reviewScore: remote.reviewScore ?? null,
        reviewFindings: remote.reviewFindings || [],
        recommendation: remote.recommendation || null,
        structureScore: remote.structureScore ?? null,
        humanReviewRequired: Boolean(remote.humanReviewRequired),
        humanReview: remote.humanReview || null,
        ocrStatus: remote.ocrStatus || null,
        ocrNote: remote.ocrNote || null,
        sdg: sdgByItem[def.id] || []
      };
    });
  }, [remoteItems, sdgByItem, country]);

  const uploadEvidence = useCallback(async (itemId, file) => {
    const documentType = READY_CODE_BY_ITEM_ID[itemId];
    if (!documentType) throw new Error(`Item de checklist desconocido: ${itemId}`);

    const { data: document } = await documentsAPI.upload(orderId, file, documentType);
    await documentsAPI.review(orderId, document.id);

    // El review corre en background en el servidor; reintenta unas veces
    // antes de conformarse con el estado "en revision".
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await fetchChecklist();
    }
  }, [orderId, fetchChecklist]);

  const toggleSdg = useCallback((itemId, numero) => {
    setSdgByItem((prev) => {
      const actuales = prev[itemId] || [];
      const next = actuales.includes(numero) ? actuales.filter((n) => n !== numero) : [...actuales, numero];
      return { ...prev, [itemId]: next };
    });
  }, []);

  return {
    items,
    loading,
    country,
    sector,
    financingType,
    globalScore,
    lifecycle,
    ...deriveAggregates(items),
    uploadEvidence,
    toggleSdg,
    refetch: fetchChecklist
  };
}

// Cuando no hay un expediente real (modo demo o usuario sin ordenes todavia),
// se preserva tal cual el checklist local en localStorage ya existente.
export function useReadinessChecklist(orderId, isDemo) {
  const demoFallback = useRequisitosMinimos(orderId || DEMO_EXPEDIENTE_ID);
  const real = useRealReadinessChecklist(!isDemo && orderId ? orderId : null);

  if (isDemo || !orderId) {
    return {
      ...demoFallback,
      loading: false,
      country: "MX",
      uploadEvidence: async () => {
        warn("SVC", "uploadEvidence no esta disponible en modo demo");
      }
    };
  }

  return real;
}
