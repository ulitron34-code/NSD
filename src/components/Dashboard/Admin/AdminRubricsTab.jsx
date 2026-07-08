import { error as logError } from '../../../utils/logger';
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminAPI } from "../../../services/api";
import { COLORS } from "../../../utils/constants";
import { uiText } from "../../../utils/runtimeCopy";

export default function AdminRubricsTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  const [rubrics, setRubrics] = useState(null);
  const [weights, setWeights] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminAPI.getRubrics()
      .then(({ data }) => {
        setRubrics(data.rubrics || {});
        setWeights(data.weights || {});
        setNote(data.note || "");
      })
      .catch((err) => {
        logError("SVC", "No se pudieron cargar las rúbricas", err);
        setError(err.response?.data?.error || err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
      <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {L("Administrador", "Administrator")}
      </p>
      <h2 style={{ color: COLORS.navy, fontSize: "1.08rem", margin: "0.35rem 0 0.5rem" }}>
        {L("Rúbricas del checklist (solo lectura)", "Checklist rubrics (read-only)")}
      </h2>
      {note && <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", marginBottom: "1rem", maxWidth: "720px" }}>{note}</p>}

      {loading && <p style={{ color: COLORS.textMuted }}>{L("Cargando...", "Loading...")}</p>}
      {error && <p style={{ color: "#C62828", fontWeight: 700 }}>{error}</p>}

      {!loading && !error && rubrics && weights && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `2px solid ${COLORS.border}` }}>
                <th style={{ padding: "0.5rem" }}>{L("Item", "Item")}</th>
                <th style={{ padding: "0.5rem" }}>{L("Peso global", "Global weight")}</th>
                <th style={{ padding: "0.5rem" }}>{L("Criterios", "Criteria")}</th>
                <th style={{ padding: "0.5rem" }}>{L("Banderas rojas", "Red flags")}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(rubrics).map(([itemId, rubric]) => (
                <tr key={itemId} style={{ borderBottom: `1px solid ${COLORS.border}`, verticalAlign: "top" }}>
                  <td style={{ padding: "0.5rem", fontWeight: 700 }}>{rubric.label}</td>
                  <td style={{ padding: "0.5rem" }}>{weights[itemId] != null ? `${weights[itemId]}%` : "—"}</td>
                  <td style={{ padding: "0.5rem" }}>
                    {(rubric.criterios || []).map((c) => (
                      <div key={c.nombre} style={{ color: COLORS.textMuted, fontSize: "0.8rem" }}>{c.nombre} ({c.peso})</div>
                    ))}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {(rubric.banderasRojas || []).length
                      ? (rubric.banderasRojas || []).map((b) => <div key={b} style={{ color: "#C62828", fontSize: "0.8rem" }}>{b}</div>)
                      : <span style={{ color: COLORS.textMuted }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
