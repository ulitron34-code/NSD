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