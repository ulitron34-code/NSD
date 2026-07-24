import React, { createContext, useContext, useMemo, useState } from "react";
import {
  EXPERIENCE_VALUES,
  readExperience,
  writeExperience,
} from "./experienceStorage";
import { getAllowedExperiences } from "./experienceFlags";

const ExperienceContext = createContext(null);

export function ExperienceProvider({ children }) {
  const [experience, setExperienceState] = useState(() => {
    const initial = readExperience();
    return getAllowedExperiences().includes(initial)
      ? initial
      : EXPERIENCE_VALUES.CURRENT;
  });

  const setExperience = (next) => {
    if (!getAllowedExperiences().includes(next)) {
      throw new Error(`Experience not enabled: ${next}`);
    }
    writeExperience(next);
    setExperienceState(next);
  };

  const value = useMemo(
    () => ({
      experience,
      setExperience,
      allowedExperiences: getAllowedExperiences(),
      isNU: experience === EXPERIENCE_VALUES.NU,
    }),
    [experience]
  );

  return (
    <ExperienceContext.Provider value={value}>
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error("useExperience must be used within ExperienceProvider");
  }
  return context;
}
