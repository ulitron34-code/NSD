import React from "react";

/**
 * Minimal line-style icon set (24x24, stroke-based) — replaces emoji across
 * public-facing sections. No external icon library dependency.
 */

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
};

function Svg({ children, size = 24, color, style, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      style={{ color, display: "block", ...style }}
      {...base}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconSearch = (props) => (
  <Svg {...props}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <line x1="15.3" y1="15.3" x2="20.5" y2="20.5" />
  </Svg>
);

export const IconRuler = (props) => (
  <Svg {...props}>
    <rect x="3" y="8.5" width="18" height="7" rx="1.2" transform="rotate(-8 12 12)" />
    <line x1="7.3" y1="9.6" x2="8.1" y2="12.1" />
    <line x1="10.8" y1="9.1" x2="11.6" y2="11.6" />
    <line x1="14.3" y1="8.6" x2="15.1" y2="11.1" />
  </Svg>
);

export const IconGlobe = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <ellipse cx="12" cy="12" rx="3.6" ry="8.5" />
    <line x1="3.5" y1="12" x2="20.5" y2="12" />
  </Svg>
);

export const IconBuilding = (props) => (
  <Svg {...props}>
    <rect x="5" y="3.5" width="10" height="17" rx="0.8" />
    <line x1="8" y1="7" x2="8" y2="7.01" />
    <line x1="12" y1="7" x2="12" y2="7.01" />
    <line x1="8" y1="10.5" x2="8" y2="10.51" />
    <line x1="12" y1="10.5" x2="12" y2="10.51" />
    <line x1="8" y1="14" x2="8" y2="14.01" />
    <line x1="12" y1="14" x2="12" y2="14.01" />
    <path d="M15 9.5h4v11h-4" />
    <line x1="9" y1="20.5" x2="9" y2="17.5" />
  </Svg>
);

export const IconConstruction = (props) => (
  <Svg {...props}>
    <path d="M4 20.5V13l8-6.5 8 6.5v7.5" />
    <line x1="4" y1="20.5" x2="20" y2="20.5" />
    <line x1="9" y1="20.5" x2="9" y2="14.5" />
    <line x1="15" y1="20.5" x2="15" y2="14.5" />
    <line x1="9" y1="14.5" x2="15" y2="14.5" />
  </Svg>
);

export const IconInstitution = (props) => (
  <Svg {...props}>
    <line x1="3.5" y1="20.5" x2="20.5" y2="20.5" />
    <line x1="4.5" y1="10" x2="19.5" y2="10" />
    <path d="M4.5 10 12 4l7.5 6" />
    <line x1="6.5" y1="10.5" x2="6.5" y2="18" />
    <line x1="10.5" y1="10.5" x2="10.5" y2="18" />
    <line x1="13.5" y1="10.5" x2="13.5" y2="18" />
    <line x1="17.5" y1="10.5" x2="17.5" y2="18" />
  </Svg>
);

export const IconHeart = (props) => (
  <Svg {...props}>
    <path d="M12 20s-7.2-4.4-9.6-9.1C1 8 2.3 4.8 5.4 4.1c2-.5 3.8.4 6.6 3.1 2.8-2.7 4.6-3.6 6.6-3.1 3.1.7 4.4 3.9 3 6.8C19.2 15.6 12 20 12 20z" />
  </Svg>
);

export const IconGraduationCap = (props) => (
  <Svg {...props}>
    <path d="M2.5 9.5 12 5l9.5 4.5-9.5 4.5-9.5-4.5Z" />
    <path d="M6.5 11.5v4.3c0 1.4 2.5 2.7 5.5 2.7s5.5-1.3 5.5-2.7v-4.3" />
    <line x1="21.5" y1="9.5" x2="21.5" y2="15.5" />
  </Svg>
);

export const IconCoin = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5v9" />
    <path d="M15 9.7c0-1.2-1.3-2.2-3-2.2s-3 .8-3 2c0 3 6 1.5 6 4.4 0 1.2-1.3 2.1-3 2.1s-3-.9-3-2.1" />
  </Svg>
);

export const IconTarget = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconChecklist = (props) => (
  <Svg {...props}>
    <rect x="4" y="3.5" width="16" height="17" rx="1.2" />
    <path d="M7.5 8.3 8.7 9.5 10.7 7.3" />
    <line x1="12.5" y1="8.3" x2="16.5" y2="8.3" />
    <path d="M7.5 13.3 8.7 14.5 10.7 12.3" />
    <line x1="12.5" y1="13.3" x2="16.5" y2="13.3" />
    <line x1="7.5" y1="17.8" x2="16.5" y2="17.8" />
  </Svg>
);

export const IconNetwork = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="4.5" r="2" />
    <circle cx="5" cy="18" r="2" />
    <circle cx="19" cy="18" r="2" />
    <line x1="12" y1="6.5" x2="12" y2="12" />
    <line x1="12" y1="12" x2="6.3" y2="16.5" />
    <line x1="12" y1="12" x2="17.7" y2="16.5" />
  </Svg>
);

export const IconMicroscope = (props) => (
  <Svg {...props}>
    <line x1="5" y1="20.5" x2="19" y2="20.5" />
    <path d="M9 20.5v-3.2a4 4 0 0 1 4-4V9.5" />
    <path d="M11.3 9.5h3.4l1.3-3-1.9-1-1.9 1 1.3 3Z" />
    <line x1="9.5" y1="17.3" x2="14" y2="17.3" />
    <circle cx="17" cy="17.5" r="2.6" />
  </Svg>
);

export const IconShieldCheck = (props) => (
  <Svg {...props}>
    <path d="M12 3 4.5 5.8v5.4c0 4.6 3.2 8.3 7.5 9.8 4.3-1.5 7.5-5.2 7.5-9.8V5.8L12 3Z" />
    <path d="M8.7 12.2 10.8 14.3 15.3 9.8" />
  </Svg>
);

export const IconBolt = (props) => (
  <Svg {...props}>
    <path d="M12.5 3 5 13.5h5.3L11 21l7.5-10.5h-5.3L12.5 3Z" />
  </Svg>
);

export const IconHome = (props) => (
  <Svg {...props}>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v10h12V10" />
    <path d="M10 20v-6h4v6" />
  </Svg>
);

export const IconUser = (props) => (
  <Svg {...props}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
  </Svg>
);

export const IconLogout = (props) => (
  <Svg {...props}>
    <path d="M10 4H6.5a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6.5 20H10" />
    <path d="M15 16l4-4-4-4" />
    <line x1="19" y1="12" x2="9.5" y2="12" />
  </Svg>
);

export const IconMail = (props) => (
  <Svg {...props}>
    <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
    <path d="M4 7l8 6 8-6" />
  </Svg>
);

export const IconMapPin = (props) => (
  <Svg {...props}>
    <path d="M12 21s-6.5-5.8-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.2-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.2" />
  </Svg>
);

export const IconLock = (props) => (
  <Svg {...props}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="1.5" />
    <path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" />
  </Svg>
);

export const IconShield = (props) => (
  <Svg {...props}>
    <path d="M12 3 4.5 5.8v5.4c0 4.6 3.2 8.3 7.5 9.8 4.3-1.5 7.5-5.2 7.5-9.8V5.8L12 3Z" />
  </Svg>
);

export const IconBell = (props) => (
  <Svg {...props}>
    <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6.5H4c0.5-1 2-2.5 2-6.5Z" />
    <path d="M10 19.5a2 2 0 0 0 4 0" />
  </Svg>
);

export const IconChevronsLeft = (props) => (
  <Svg {...props}>
    <path d="M13 5.5 6.5 12l6.5 6.5" />
    <path d="M18.5 5.5 12 12l6.5 6.5" />
  </Svg>
);

export const IconChevronsRight = (props) => (
  <Svg {...props}>
    <path d="M11 5.5 17.5 12 11 18.5" />
    <path d="M5.5 5.5 12 12l-6.5 6.5" />
  </Svg>
);

export const IconChevronDown = (props) => (
  <Svg {...props}>
    <path d="M5.5 9 12 15.5 18.5 9" />
  </Svg>
);

export const IconChevronRight = (props) => (
  <Svg {...props}>
    <path d="M9 5.5 15.5 12 9 18.5" />
  </Svg>
);

const ICONS = {
  search: IconSearch,
  shieldCheck: IconShieldCheck,
  bolt: IconBolt,
  home: IconHome,
  user: IconUser,
  logout: IconLogout,
  mail: IconMail,
  mapPin: IconMapPin,
  lock: IconLock,
  shield: IconShield,
  chevronsLeft: IconChevronsLeft,
  chevronsRight: IconChevronsRight,
  chevronDown: IconChevronDown,
  chevronRight: IconChevronRight,
  ruler: IconRuler,
  globe: IconGlobe,
  building: IconBuilding,
  construction: IconConstruction,
  institution: IconInstitution,
  heart: IconHeart,
  graduationCap: IconGraduationCap,
  coin: IconCoin,
  target: IconTarget,
  checklist: IconChecklist,
  network: IconNetwork,
  microscope: IconMicroscope,
  bell: IconBell,
};

export default function Icon({ name, size = 24, color, style }) {
  const Cmp = ICONS[name];
  if (!Cmp) return null;
  return <Cmp size={size} color={color} style={style} />;
}
