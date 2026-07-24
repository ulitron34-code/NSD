import { EXPERIENCE_VALUES } from "./experienceStorage";

export function isNuxeraExperienceEnabled() {
  return import.meta.env.VITE_NUXERA_EXPERIENCE_ENABLED === "true";
}

export function getAllowedExperiences() {
  const base = [EXPERIENCE_VALUES.CLASSIC, EXPERIENCE_VALUES.CURRENT];
  return isNuxeraExperienceEnabled()
    ? [...base, EXPERIENCE_VALUES.NUXERA]
    : base;
}

// Per-role and per-engine rollout flags. Unset means enabled (matches current
// behavior: everything shows once VITE_NUXERA_EXPERIENCE_ENABLED=true).
// Set explicitly to "false" to hold back a specific role or engine.
function readNuxeraFlag(name) {
  const raw = import.meta.env[name];
  return raw !== "false";
}

export function isNuxeraApplicantEnabled() {
  return readNuxeraFlag("VITE_NUXERA_APPLICANT_ENABLED");
}

export function isNuxeraGrantorEnabled() {
  return readNuxeraFlag("VITE_NUXERA_GRANTOR_ENABLED");
}

export function isNuxeraAdminEnabled() {
  return readNuxeraFlag("VITE_NUXERA_ADMIN_ENABLED");
}

export function isNuxeraIntelligenceEnabled() {
  return readNuxeraFlag("VITE_NUXERA_INTELLIGENCE_ENABLED");
}

export function isNuxeraMarketsEnabled() {
  return readNuxeraFlag("VITE_NUXERA_MARKETS_ENABLED");
}

export function isNuxeraStrategyEnabled() {
  return readNuxeraFlag("VITE_NUXERA_STRATEGY_ENABLED");
}

const roleFlagCheckers = {
  applicant: isNuxeraApplicantEnabled,
  grantor: isNuxeraGrantorEnabled,
  admin: isNuxeraAdminEnabled,
};

export function isNuxeraRoleEnabled(role) {
  const checker = roleFlagCheckers[role];
  return checker ? checker() : true;
}

const engineFlagCheckers = {
  intelligence: isNuxeraIntelligenceEnabled,
  markets: isNuxeraMarketsEnabled,
  strategy: isNuxeraStrategyEnabled,
};

export function isNuxeraEngineEnabled(engineId) {
  const checker = engineFlagCheckers[engineId];
  return checker ? checker() : true;
}
