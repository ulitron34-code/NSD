import { COLORS } from "./constants";

/**
 * Softened card treatment — reduced shadow/opacity so cards read as part of
 * an image-backed section instead of isolated flat panels.
 */
export const softCardStyle = {
  background: "rgba(255,255,255,0.9)",
  borderRadius: "16px",
  border: "1px solid rgba(27,58,92,0.07)",
  boxShadow: "0 4px 20px rgba(27,58,92,0.07)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
};

/**
 * Same treatment for dark/navy-background sections (internal app shell).
 */
export const softCardStyleDark = {
  background: "rgba(15,31,46,0.72)",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
};

export const overlays = {
  navyDiagonal: "linear-gradient(135deg, rgba(15,31,46,0.88) 0%, rgba(27,58,92,0.74) 55%, rgba(42,82,122,0.55) 100%)",
  navyStrong: "linear-gradient(135deg, rgba(15,31,46,0.94) 0%, rgba(27,58,92,0.85) 60%, rgba(42,82,122,0.7) 100%)",
  creamSoft: `linear-gradient(180deg, ${COLORS.bg}E6 0%, ${COLORS.bg}F2 100%)`,
};
