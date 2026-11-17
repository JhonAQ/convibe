import type { SVGProps } from "react";
import type { ZoneId } from "@/lib/reports";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

export const Elevator = (p: P) => (
  <svg {...base(p)}><rect x="4" y="3" width="16" height="18" rx="3" /><path d="m9 9 2-2 2 2" /><path d="m9 15 2 2 2-2" /><path d="M16 7v10" /></svg>
);
export const Drop = (p: P) => (
  <svg {...base(p)}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /></svg>
);
export const Bulb = (p: P) => (
  <svg {...base(p)}><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3Z" /></svg>
);
export const Sofa = (p: P) => (
  <svg {...base(p)}><path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3" /><path d="M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z" /><path d="M5 19v2M19 19v2" /></svg>
);
export const Car = (p: P) => (
  <svg {...base(p)}><path d="M5 16V11l2-5h10l2 5v5" /><path d="M3 16h18v3H3z" /><path d="M5 11h14" /><circle cx="7.5" cy="13.5" r=".6" /><circle cx="16.5" cy="13.5" r=".6" /></svg>
);
export const Door = (p: P) => (
  <svg {...base(p)}><path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17" /><path d="M3 21h18" /><circle cx="15" cy="12" r=".8" /></svg>
);
export const Building = (p: P) => (
  <svg {...base(p)}><path d="M4 21V5l8-2v18" /><path d="M12 7h8v14" /><path d="M2 21h20" /><path d="M8 8v.01M8 12v.01M8 16v.01M16 11v.01M16 15v.01" /></svg>
);
export const Dots = (p: P) => (
  <svg {...base(p)}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>
);
export const Camera = (p: P) => (
  <svg {...base(p)}><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13.5" r="3.5" /></svg>
);
export const Plus = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const Close = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const Check = (p: P) => (
  <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const Hand = (p: P) => (
  <svg {...base(p)}><path d="M7 11V7.5a1.5 1.5 0 0 1 3 0V11" /><path d="M10 10V5.5a1.5 1.5 0 0 1 3 0V10" /><path d="M13 10V6.5a1.5 1.5 0 0 1 3 0V12" /><path d="M16 9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.6-2.2L4 15.2a1.5 1.5 0 0 1 2.3-1.9L7 14v-3" /></svg>
);
export const Copy = (p: P) => (
  <svg {...base(p)}><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
);
export const Bell = (p: P) => (
  <svg {...base(p)}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15Z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></svg>
);

export const ZONE_ICON: Record<ZoneId, (p: P) => React.JSX.Element> = {
  ascensor: Elevator,
  agua: Drop,
  luz: Bulb,
  comunes: Sofa,
  parqueadero: Car,
  porteria: Door,
  fachada: Building,
  otro: Dots,
};
