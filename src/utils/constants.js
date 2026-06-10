export const COLORS = {
  navy: "#1B3A5C",
  navyLight: "#2A527A",
  gold: "#C9A84C",
  goldLight: "#E4C878",
  goldPale: "#F5EDD8",
  bg: "#F2EFE9",
  white: "#FFFFFF",
  text: "#1A1A1A",
  textMuted: "#6B6560",
  border: "rgba(27,58,92,0.12)",
  green: "#2E7D32",
  amber: "#B45309",
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001/api" : "");
