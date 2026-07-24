export const EXPERIENCE_STORAGE_KEY = "nsd_ui_view";

export const EXPERIENCE_VALUES = Object.freeze({
  CLASSIC: "classic",
  CURRENT: "new",
  NUXERA: "nuxera",
});

export function readExperience() {
  const stored = localStorage.getItem(EXPERIENCE_STORAGE_KEY);
  return Object.values(EXPERIENCE_VALUES).includes(stored)
    ? stored
    : EXPERIENCE_VALUES.CURRENT;
}

export function writeExperience(value) {
  if (!Object.values(EXPERIENCE_VALUES).includes(value)) {
    throw new Error(`Unsupported experience: ${value}`);
  }
  localStorage.setItem(EXPERIENCE_STORAGE_KEY, value);
}