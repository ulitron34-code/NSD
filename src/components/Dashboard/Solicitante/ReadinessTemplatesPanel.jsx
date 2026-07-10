import { error as logError } from '../../../utils/logger';
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { readinessTemplatesAPI } from "../../../services/api";
import { COLORS } from "../../../utils/constants";
import { uiText } from "../../../utils/runtimeCopy";

// Plantillas descargables (sección 31 del plan): guías de trabajo generadas
// a partir de la rúbrica real que evalúa cada documento del checklist, para
// que el solicitante pueda corregir su expediente antes de subirlo.
export default function ReadinessTemplatesPanel() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  const [templates, setTemplates] = useState([]);
  const [downloadingCode, setDownloadingCode] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await readinessTemplatesAPI.list();
        setTemplates(data.templates || []);
      } catch (err) {
        logError("SVC", "No se pudo cargar la lista de plantillas descargables", err);
      }
    })();
  }, []);

  const handleDownload = async (code) => {
    setDownloadingCode(code);
    try {
      const response = await readinessTemplatesAPI.download(code);
      const url = URL.createObjectURL(new Blob([response.data], { type: "text/markdown" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `plantilla-${code}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      logError("SVC", "No se pudo descargar la plantilla", err);
    } finally {
      setDownloadingCode(null);
    }
  };

  if (!templates.length) return null;

  return (
    <section style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
      <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {L("Plantillas de apoyo", "Support templates")}
      </p>
      <h2 style={{ color: COLORS.navy, fontSize: "1.08rem", margin: "0.35rem 0 0.25rem" }}>
        {L("Plantillas descargables para corregir tu expediente", "Downloadable templates to fix your case file")}
      </h2>
      <p style={{ margin: "0 0 0.85rem", color: COLORS.textMuted, fontSize: "0.8rem", maxWidth: "680px", lineHeight: 1.5 }}>
        {L(
          "Cada plantilla se genera a partir de la misma rúbrica que usa la IA para evaluar tu documento — úsala como guía antes de subir el archivo.",
          "Each template is generated from the same rubric the AI uses to evaluate your document — use it as a guide before uploading the file."
        )}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.5rem" }}>
        {templates.map((template) => (
          <button
            key={template.code}
            onClick={() => handleDownload(template.code)}
            disabled={downloadingCode === template.code}
            style={{
              textAlign: "left", border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.6rem 0.75rem",
              fontWeight: 800, fontSize: "0.78rem", color: COLORS.navy, background: COLORS.bg,
              cursor: downloadingCode === template.code ? "wait" : "pointer", opacity: downloadingCode === template.code ? 0.6 : 1
            }}
          >
            {downloadingCode === template.code ? L("Descargando…", "Downloading…") : template.title}
          </button>
        ))}
      </div>
    </section>
  );
}
