import React from "react";

/**
 * Full-bleed background image + gradient overlay for a `position: relative`
 * section, generalizing the pattern used in Hero.jsx. Render as the first
 * children of the section, before the actual content (which needs its own
 * `position: relative, zIndex: >=1`).
 */
export default function SectionBackground({ image, overlay, glow }) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: overlay || "linear-gradient(135deg, rgba(15,31,46,0.88) 0%, rgba(27,58,92,0.74) 55%, rgba(42,82,122,0.55) 100%)",
          zIndex: 1,
        }}
      />
      {glow && (
        <div
          style={{
            position: "absolute",
            top: "-20%",
            right: "-10%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,168,76,0.14) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
      )}
    </>
  );
}
