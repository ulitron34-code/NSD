import React from "react";
import { useNuxeraExpedient } from "../context/NuxeraExpedientContext";
import { useNuxeraLanguage } from "../hooks/useNuxeraLanguage";
import { buildMarketWatchlistForExpedient, getMonitoringPolicies } from "../markets/marketDataProvider";

const riskClass = {
  low: "is-low",
  medium: "is-medium",
  high: "is-high",
};

export default function MarketsWorkspace({ role }) {
  const { L, language } = useNuxeraLanguage();
  const context = useNuxeraExpedient();
  const watchlist = buildMarketWatchlistForExpedient({ ...context, role }, undefined, language);
  const policies = getMonitoringPolicies(language);

  return (
    <section className="nuxera-adapter" aria-labelledby="nuxera-markets-title">
      <header className="nuxera-adapter-header">
        <div>
          <p className="nuxera-eyebrow">NUXERA Markets / Foundation</p>
          <h1 id="nuxera-markets-title">{L("Monitoreo de mercado", "Market monitoring")}</h1>
          <p>{watchlist.scope}</p>
        </div>
        <div className="nuxera-adapter-status">
          <span>{watchlist.status.mode}</span>
          <strong>{watchlist.status.delayLabel}</strong>
          <small>{watchlist.status.provider}</small>
        </div>
      </header>

      {context.options.length > 1 && (
        <div className="nuxera-context-selector" aria-label={L("Selector de expediente para Markets", "File selector for Markets")}>
          {context.options.map((option) => (
            <button type="button" key={option.id} onClick={() => context.selectExpedient(option.id)} aria-pressed={option.id === context.selectedId}>{option.label}</button>
          ))}
        </div>
      )}

      <div className="nuxera-market-disclaimer">
        <strong>{L("Procedencia:", "Provenance:")}</strong> {watchlist.status.provenance}
        <span>{watchlist.status.disclaimer}</span>
      </div>

      <section className="nuxera-market-provider" aria-label={L("Estado del proveedor de mercado", "Market provider status")}>
        <div>
          <span>{watchlist.degradationPlan.health}</span>
          <strong>{watchlist.degradationPlan.label}</strong>
          <p>{watchlist.degradationPlan.fallbackStrategy}</p>
        </div>
        <div>
          <span>Realtime</span>
          <strong>{watchlist.degradationPlan.realtimeAvailable ? L("Disponible", "Available") : L("No disponible", "Not available")}</strong>
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
            <em className={riskClass[row.riskLevel] || ""}>{L("Riesgo", "Risk")} {row.risk}</em>
          </article>
        ))}
      </div>

      <div className="nuxera-market-panels">
        <section>
          <h2>{L("Eventos vigilados", "Monitored events")}</h2>
          {watchlist.events.map((event) => (
            <article key={event.id}>
              <span>{event.severity}</span>
              <strong>{event.title}</strong>
              <p>{event.impact}</p>
            </article>
          ))}
        </section>
        <section>
          <h2>{L("Politicas de monitoreo", "Monitoring policies")}</h2>
          {policies.map((policy) => (
            <p key={policy}>{policy}</p>
          ))}
        </section>
      </div>
    </section>
  );
}
