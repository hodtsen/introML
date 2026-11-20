import { useState } from "react";
import type { FigurData } from "../types";
import Plot, { fmt, sti, Forklaring } from "./plot";

// Generisk figur til oppgaver: linjediagram, punktsky eller stolper, beskrevet med data i YAML.
export default function OppgaveFigur({ data }: { data: FigurData }) {
  const [hover, setHover] = useState<number | null>(null);

  if (data.type === "linje" && data.x && data.serier) {
    const xs = data.x;
    const alle = data.serier.flatMap((s) => s.y);
    const ymin = data.ymin ?? Math.min(0, ...alle);
    const ymax = data.ymax ?? Math.max(...alle) * 1.08;
    return (
      <figure className="figur oppgavefigur">
        {data.tittel && <figcaption className="figur-tittel">{data.tittel}</figcaption>}
        <Plot
          x={[Math.min(...xs), Math.max(...xs)]}
          y={[ymin, ymax]}
          xlabel={data.xlabel}
          ylabel={data.ylabel}
          tittel={data.tittel}
          onPeker={(px) => {
            if (px === null) return setHover(null);
            let best = 0;
            xs.forEach((v, i) => {
              if (Math.abs(v - px) < Math.abs(xs[best] - px)) best = i;
            });
            setHover(best);
          }}
        >
          {({ sx, sy, m, h }) => (
            <>
              {data.serier!.map((s, si) => (
                <g key={s.navn} className={`serie serie-${(si % 5) + 1}`}>
                  <path d={sti(xs.map((x, i) => [x, s.y[i]]), sx, sy)} className="plot-linje" />
                  {xs.length <= 16 && xs.map((x, i) => <circle key={i} cx={sx(x)} cy={sy(s.y[i])} r={3.5} className="plot-punkt" />)}
                </g>
              ))}
              {hover !== null && (
                <g className="plot-hover" pointerEvents="none">
                  <line x1={sx(xs[hover])} x2={sx(xs[hover])} y1={m.t} y2={h - m.b} className="plot-sikte" />
                  {data.serier!.map((s, si) => (
                    <circle key={si} cx={sx(xs[hover])} cy={sy(s.y[hover])} r={5} className={`plot-hoverpunkt serie-${(si % 5) + 1}`} />
                  ))}
                </g>
              )}
            </>
          )}
        </Plot>
        {hover !== null && (
          <div className="plot-tips">
            <strong>
              {data.xlabel ?? "x"} = {fmt(xs[hover])}
            </strong>
            {data.serier.map((s) => (
              <span key={s.navn}>
                {s.navn}: {fmt(s.y[hover])}
              </span>
            ))}
          </div>
        )}
        {data.serier.length > 1 && <Forklaring elementer={data.serier.map((s, i) => ({ navn: s.navn, klasse: `serie-${(i % 5) + 1}`, strek: true }))} />}
      </figure>
    );
  }

  if (data.type === "punkter" && data.punkter) {
    const xs = data.punkter.map((p) => p.x);
    const ys = data.punkter.map((p) => p.y);
    const pad = (a: number[]) => {
      const lo = Math.min(...a);
      const hi = Math.max(...a);
      const d = (hi - lo || 1) * 0.1;
      return [lo - d, hi + d] as [number, number];
    };
    const klasser = [...new Set(data.punkter.map((p) => String(p.klasse ?? "")))];
    return (
      <figure className="figur oppgavefigur">
        {data.tittel && <figcaption className="figur-tittel">{data.tittel}</figcaption>}
        <Plot x={pad(xs)} y={pad(ys)} xlabel={data.xlabel} ylabel={data.ylabel} tittel={data.tittel}>
          {({ sx, sy }) =>
            data.punkter!.map((p, i) => {
              const k = klasser.indexOf(String(p.klasse ?? ""));
              return k === 1 ? (
                <rect key={i} x={sx(p.x) - 4.5} y={sy(p.y) - 4.5} width={9} height={9} className={`plot-punkt serie-${k + 1}`} />
              ) : (
                <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={5} className={`plot-punkt serie-${(k % 5) + 1}`} />
              );
            })
          }
        </Plot>
        {klasser.length > 1 && <Forklaring elementer={klasser.map((k, i) => ({ navn: `Klasse ${k}`, klasse: `serie-${(i % 5) + 1}` }))} />}
      </figure>
    );
  }

  if (data.type === "stolper" && data.kategorier && data.verdier) {
    const n = data.kategorier.length;
    const ymax = data.ymax ?? Math.max(...data.verdier) * 1.15;
    const ymin = data.ymin ?? Math.min(0, ...data.verdier);
    return (
      <figure className="figur oppgavefigur">
        {data.tittel && <figcaption className="figur-tittel">{data.tittel}</figcaption>}
        <Plot
          x={[0, n]}
          y={[ymin, ymax]}
          xticks={[]}
          xlabel={data.xlabel}
          ylabel={data.ylabel}
          tittel={data.tittel}
        >
          {({ sx, sy, h, m }) =>
            data.kategorier!.map((k, i) => {
              const v = data.verdier![i];
              const bx = sx(i + 0.18);
              const bw = sx(i + 0.82) - bx;
              const y0 = sy(Math.max(0, ymin));
              return (
                <g key={k} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
                  <rect x={sx(i)} y={m.t} width={sx(i + 1) - sx(i)} height={h - m.b - m.t} fill="transparent" />
                  <path
                    d={`M${bx},${y0} V${sy(v) + 4} q0,-4 4,-4 H${bx + bw - 4} q4,0 4,4 V${y0} Z`}
                    className={`plot-stolpe ${hover === i ? "aktiv" : ""}`}
                  />
                  <text x={bx + bw / 2} y={h - m.b + 18} textAnchor="middle" className="plot-tick">
                    {k}
                  </text>
                  {(hover === i || n <= 8) && (
                    <text x={bx + bw / 2} y={sy(v) - 6} textAnchor="middle" className="plot-verdi">
                      {fmt(v)}
                    </text>
                  )}
                </g>
              );
            })
          }
        </Plot>
      </figure>
    );
  }
  return <div className="figur figur-mangler">Figuren mangler data.</div>;
}
