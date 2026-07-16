import React from "react";
import { getMarketWatchlist, getMonitoringPolicies } from "../markets/marketDataProvider";

const riskClass = {
  Bajo: "is-low",
  Medio: "is-medium",
  Alto: "is-high",
};

export default function MarketsWorkspace({ role }) {
  const watchlist = getMarketWatchlist(role);
  const policies = getMonitoringPolicies();

  return (
    <section className="nuxera-adapter" aria-labelledby="nuxera-markets-title">
      <header className="nuxera-adapter-header">
        <div>
          <p className="nuxera-eyebrow">NUXERA Markets / Foundation</p>
          <h1 id="nuxera-markets-title">Monitoreo de mercado</h1>
          <p>{watchlist.scope}</p>
        </div>
        <div className="nuxera-adapter-status">
          <span>{watchlist.status.mode}</span>
          <strong>{watchlist.status.delayLabel}</strong>
          <small>{watchlist.status.provider}</small>
        </div>
      </header>

      <div className="nuxera-market-disclaimer">
        <strong>Procedencia:</strong> {watchlist.status.provenance}
        <span>{watchlist.status.disclaimer}</span>
      </div>

      <section className="nuxera-market-provider" aria-label="Estado del proveedor de mercado">
        <div>
          <span>{watchlist.degradationPlan.health}</span>
          <strong>{watchlist.degradationPlan.label}</strong>
          <p>{watchlist.degradationPlan.fallbackStrategy}</p>
        </div>
        <div>
          <span>Realtime</span>
          <strong>{watchlist.degradationPlan.realtimeAvailable ? "Disponible" : "No disponible"}</strong>
          <p>{watchlist.status.asOf}</p>
        </div>
        <ul>
          {watchlist.degradationPlan.actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </section>

      <div className="nuxera-market-grid">
        {watchlist.rows.map((row) => (
          <article className="nuxera-market-card" key={row.symbol}>
            <div>
              <span>{row.assetClass}</span>
              <h2>{row.symbol}</h2>
              <p>{row.name}</p>
            </div>
            <div className="nuxera-market-value">
              <strong>{row.value}</strong>
              <small>{row.change}</small>
            </div>
            <p>{row.driver}</p>
            <em className={riskClass[row.risk] || ""}>Riesgo {row.risk}</em>
          </article>
        ))}
      </div>

      <div className="nuxera-market-panels">
        <section>
          <h2>Eventos vigilados</h2>
          {watchlist.events.map((event) => (
            <article key={event.id}>
              <span>{event.severity}</span>
              <strong>{event.title}</strong>
              <p>{event.impact}</p>
            </article>
          ))}
        </section>
        <section>
          <h2>Politicas de monitoreo</h2>
          {policies.map((policy) => (
            <p key={policy}>{policy}</p>
          ))}
        </section>
      </div>
    </section>
  );
}
