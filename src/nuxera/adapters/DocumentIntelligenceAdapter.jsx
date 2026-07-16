import React, { Suspense, lazy } from "react";

const DocumentIntelligenceTab = lazy(() => import("../../components/Dashboard/DocumentIntelligenceTab"));

function AdapterLoading() {
  return (
    <div className="nuxera-adapter-loading">
      Cargando inteligencia documental...
    </div>
  );
}

export default function DocumentIntelligenceAdapter({ role }) {
  return (
    <section className="nuxera-adapter" aria-labelledby="nuxera-intelligence-title">
      <header className="nuxera-adapter-header">
        <div>
          <p className="nuxera-eyebrow">NUXERA Intelligence / Adapter controlado</p>
          <h1 id="nuxera-intelligence-title">Inteligencia documental</h1>
          <p>
            Esta vista reutiliza el modulo operativo existente para validar expedientes,
            documentos, reglas, cruces y hallazgos sin romper la experiencia heredada.
          </p>
        </div>
        <div className="nuxera-adapter-status">
          <span>Rol activo</span>
          <strong>{role}</strong>
          <small>Legacy module mounted</small>
        </div>
      </header>

      <div className="nuxera-adapter-body">
        <Suspense fallback={<AdapterLoading />}>
          <DocumentIntelligenceTab />
        </Suspense>
      </div>
    </section>
  );
}