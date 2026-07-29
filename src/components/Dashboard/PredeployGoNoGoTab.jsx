import { error, debug, info, warn } from '../../utils/logger';
import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText, translateCopy } from "../../utils/runtimeCopy";
import { BRAND } from "../../config/brand";

const checks = [
  ["Build local", "npm.cmd run build ejecuta sin errores", "Go"],
  ["Chunk dashboard", "Carga diferida activa; sin warning mayor a 500 kB", "Go"],
  ["Home", "Pagina principal carga en preview local y Vercel sirve assets correctamente", "Go"],
  ["Dashboard", `Perfiles Solicitante, Otorgante y ${BRAND.name} Admin navegables`, "Go"],
  ["Textos", "Revisar acentos finales y posibles tramos en ingles", "Caution"],
  ["Legal", "Disclaimers visibles pero faltan terminos legales finales", "Caution"],
  ["Backend", "Render/Supabase deben estar vivos para login y datos reales", "Caution"],
  ["Deploy", "Vercel actualiza automaticamente si GitHub recibe commit/push en la rama conectada", "Go"],
  ["Pago", "Stripe/checkout requiere prueba aparte despues del deploy", "Caution"],
];

const publishSteps = [
  "Trabajar y validar primero en local.",
  "Ejecutar npm.cmd run build antes de publicar.",
  "Subir cambios a GitHub con commit/push en la rama conectada a Vercel.",
  "Esperar que Vercel marque el deployment como Ready.",
  "Probar /, /dashboard, /services, /international y flujo de perfiles.",
  "Si sale version vieja, revisar que el ultimo commit este en GitHub y que Vercel haya tomado esa rama.",
];

export default function PredeployGoNoGoTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);
  const goCount = checks.filter(([, , status]) => status === "Go").length;
  const cautionCount = checks.length - goCount;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 68%, #C9A227 145%)",
        color: COLORS.white,
        borderRadius: "16px",
        padding: "1.55rem",
        boxShadow: COLORS.shadowMd,
      }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {copy("Go / No-Go publicacion")}
        </p>
        <h1 style={{ margin: "0.35rem 0", color: COLORS.white, fontSize: "1.55rem" }}>
          {L("Corte recomendado para publicacion controlada", "Recommended cut for controlled publishing")}
        </h1>
        <p style={{ margin: 0, maxWidth: "820px", color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
          {L(
            "Esta vista resume si el estado local esta listo para publicarse en Vercel como demo de presentacion, separando errores bloqueantes de pendientes aceptables.",
            "This view summarizes whether the local state is ready to publish on Vercel as a presentation demo, separating blocking errors from acceptable pending items."
          )}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.75rem" }}>
        {[
          ["Checks Go", goCount, "listos"],
          ["Precauciones", cautionCount, "no bloqueantes"],
          ["Decision sugerida", "Go", "demo controlada"],
        ].map(([label, value, note]) => (
          <article key={label} style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>{copy(label)}</p>
            <strong style={{ display: "block", color: COLORS.navy, fontSize: "1.7rem", marginTop: "0.25rem" }}>{value}</strong>
            <span style={{ color: COLORS.gold, fontWeight: 900, fontSize: "0.82rem" }}>{copy(note)}</span>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: "1rem" }}>
        <article style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "680px" }}>
            <thead>
              <tr style={{ background: COLORS.navy, color: COLORS.white }}>
                {[L("Revision", "Check"), L("Criterio", "Criteria"), L("Resultado", "Result")].map((head) => (
                  <th key={head} style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.78rem" }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {checks.map(([check, criteria, status]) => (
                <tr key={check} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "0.72rem", color: COLORS.navy, fontWeight: 900 }}>{copy(check)}</td>
                  <td style={{ padding: "0.72rem", color: COLORS.text, fontSize: "0.84rem" }}>{copy(criteria)}</td>
                  <td style={{ padding: "0.72rem" }}>
                    <span style={{
                      borderRadius: "999px",
                      padding: "0.22rem 0.55rem",
                      background: status === "Go" ? "rgba(46,125,50,0.12)" : "rgba(201,162,39,0.18)",
                      color: status === "Go" ? "#2E7D32" : "#8A6A00",
                      fontWeight: 900,
                      fontSize: "0.75rem",
                    }}>{status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <aside style={{ background: "#102235", color: COLORS.white, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase" }}>
            {L("Pasos de publicacion", "Publishing steps")}
          </p>
          <ol style={{ margin: "0.75rem 0 0", paddingLeft: "1.1rem", color: "rgba(255,255,255,0.78)", fontSize: "0.84rem", lineHeight: 1.55 }}>
            {publishSteps.map((step) => <li key={step}>{copy(step)}</li>)}
          </ol>
        </aside>
      </section>
    </div>
  );
}
