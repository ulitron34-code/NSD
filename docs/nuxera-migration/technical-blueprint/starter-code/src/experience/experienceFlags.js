import { EXPERIENCE_VALUES } from "./experienceStorage";

export function isNUExperienceEnabled() {
  return import.meta.env.VITE_NU_EXPERIENCE_ENABLED === "true";
}

export function getAllowedExperiences() {
  const base = [EXPERIENCE_VALUES.CLASSIC, EXPERIENCE_VALUES.CURRENT];
  return isNUExperienceEnabled()
    ? [...base, EXPERIENCE_VALUES.NU]
    : base;
}
