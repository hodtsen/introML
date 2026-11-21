import type { ReactNode } from "react";

// Felles koordinatsystem for figurene: SVG med viewBox, slik at figuren skalerer med bredden.

export interface Skala {
  (v: number): number;
  domene: [number, number];
}

export function linear(domene: [number, number], område: [number, number]): Skala {
  const [d0, d1] = domene;
  const [r0, r1] = område;
  const f = ((v: number) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0)) as Skala;
  f.domene = domene;
  return f;
}

export function fineTicks(min: number, max: number, antall = 5): number[] {
  const spenn = max - min || 1;
  const rå = spenn / antall;
  const mag = Math.pow(10, Math.floor(Math.log10(rå)));
  const norm = rå / mag;
  const steg = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.ceil(min / steg - 1e-9) * steg;
  const ut: number[] = [];
  for (let v = start; v <= max + steg * 1e-6; v += steg) ut.push(Math.abs(v) < steg * 1e-9 ? 0 : Number(v.toPrecision(12)));
  return ut;
}

export function fmt(v: number) {
  const a = Math.abs(v);
  const d = a === 0 ? 0 : a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3;
  return Number(v.toFixed(d)).toLocaleString("nb-NO", { maximumFractionDigits: d });
}

export interface PlotProps {
  bredde?: number;
  hoyde?: number;
  x: [number, number];
  y: [number, number];
  xlabel?: string;
  ylabel?: string;
  xticks?: number[];
  yticks?: number[];
  xtickFormat?: (v: number) => string;
  ytickFormat?: (v: number) => string;
  rutenett?: boolean;
  tittel?: string;
  children: (s: { sx: Skala; sy: Skala; b: number; h: number; m: Marg }) => ReactNode;
  onPeker?: (x: number | null, y: number | null) => void;
}

export interface Marg {
  v: number;
  h: number;
  t: number;
  b: number;
}

export default function Plot({
  bredde = 640,
  hoyde = 340,
  x,
  y,
  xlabel,
  ylabel,
  xticks,
  yticks,
  xtickFormat = fmt,
  ytickFormat = fmt,
  rutenett = true,
  tittel,
  children,
  onPeker,
}: PlotProps) {
  const m: Marg = { v: ylabel ? 58 : 44, h: 16, t: 14, b: xlabel ? 48 : 30 };
  const sx = linear(x, [m.v, bredde - m.h]);
  const sy = linear(y, [hoyde - m.b, m.t]);
  const xt = xticks ?? fineTicks(x[0], x[1], 6);
  const yt = yticks ?? fineTicks(y[0], y[1], 5);
  const peker = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!onPeker) return;
    const svg = e.currentTarget;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * bredde;
    const py = ((e.clientY - r.top) / r.height) * hoyde;
    if (px < m.v || px > bredde - m.h || py < m.t || py > hoyde - m.b) return onPeker(null, null);
    onPeker(x[0] + ((px - m.v) / (bredde - m.h - m.v)) * (x[1] - x[0]), y[1] - ((py - m.t) / (hoyde - m.b - m.t)) * (y[1] - y[0]));
  };
  return (
    <svg
      viewBox={`0 0 ${bredde} ${hoyde}`}
      className="plot"
      role="img"
      aria-label={tittel}
      onPointerMove={onPeker ? peker : undefined}
      onPointerLeave={onPeker ? () => onPeker(null, null) : undefined}
    >
      {rutenett &&
        yt.map((v) => <line key={`gy${v}`} x1={m.v} x2={bredde - m.h} y1={sy(v)} y2={sy(v)} className="plot-rutenett" />)}
      <line x1={m.v} x2={bredde - m.h} y1={hoyde - m.b} y2={hoyde - m.b} className="plot-akse" />
      <line x1={m.v} x2={m.v} y1={m.t} y2={hoyde - m.b} className="plot-akse" />
      {xt.map((v) => (
        <g key={`x${v}`}>
          <line x1={sx(v)} x2={sx(v)} y1={hoyde - m.b} y2={hoyde - m.b + 5} className="plot-akse" />
          <text x={sx(v)} y={hoyde - m.b + 18} textAnchor="middle" className="plot-tick">
            {xtickFormat(v)}
          </text>
        </g>
      ))}
      {yt.map((v) => (
        <text key={`y${v}`} x={m.v - 8} y={sy(v) + 4} textAnchor="end" className="plot-tick">
          {ytickFormat(v)}
        </text>
      ))}
      {xlabel && (
        <text x={(m.v + bredde - m.h) / 2} y={hoyde - 8} textAnchor="middle" className="plot-label">
          {xlabel}
        </text>
      )}
      {ylabel && (
        <text x={14} y={(m.t + hoyde - m.b) / 2} textAnchor="middle" transform={`rotate(-90 14 ${(m.t + hoyde - m.b) / 2})`} className="plot-label">
          {ylabel}
        </text>
      )}
      {children({ sx, sy, b: bredde, h: hoyde, m })}
    </svg>
  );
}

export function sti(punkter: [number, number][], sx: Skala, sy: Skala) {
  return punkter
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b))
    .map(([a, b], i) => `${i ? "L" : "M"}${sx(a).toFixed(1)},${sy(b).toFixed(1)}`)
    .join("");
}

export function Glider({
  etikett,
  verdi,
  min,
  max,
  steg,
  onEndre,
  vis,
}: {
  etikett: ReactNode;
  verdi: number;
  min: number;
  max: number;
  steg: number;
  onEndre: (v: number) => void;
  vis?: string;
}) {
  return (
    <label className="glider">
      <span className="glider-etikett">
        {etikett} <output>{vis ?? fmt(verdi)}</output>
      </span>
      <input type="range" min={min} max={max} step={steg} value={verdi} onChange={(e) => onEndre(Number(e.target.value))} />
    </label>
  );
}

export function Forklaring({ elementer }: { elementer: { navn: ReactNode; klasse: string; strek?: boolean; form?: "firkant" }[] }) {
  return (
    <ul className="plot-forklaring">
      {elementer.map((e, i) => (
        <li key={i}>
          <span className={`pf-merke ${e.klasse} ${e.strek ? "strek" : ""} ${e.form ?? ""}`} aria-hidden="true" />
          {e.navn}
        </li>
      ))}
    </ul>
  );
}
