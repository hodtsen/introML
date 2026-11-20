import { useMemo, useState } from "react";
import Plot, { Glider, fmt } from "./plot";
import { stoy } from "./numerikk";

const r = stoy(21);
const BASIS = Array.from({ length: 60 }, () => [r(), r()] as [number, number]);

export default function Pca() {
  const [spredning, setSpredning] = useState(2.2);
  const [vinkel, setVinkel] = useState(30);
  const [proj, setProj] = useState(false);

  const { pkt, l1, l2, v1, v2, snitt } = useMemo(() => {
    const a = (vinkel * Math.PI) / 180;
    const pkt = BASIS.map(([u, v]) => {
      const x = u * spredning;
      const y = v * 0.8;
      return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)] as [number, number];
    });
    const n = pkt.length;
    const mx = pkt.reduce((s, p) => s + p[0], 0) / n;
    const my = pkt.reduce((s, p) => s + p[1], 0) / n;
    let sxx = 0,
      syy = 0,
      sxy = 0;
    for (const [x, y] of pkt) {
      sxx += (x - mx) ** 2;
      syy += (y - my) ** 2;
      sxy += (x - mx) * (y - my);
    }
    sxx /= n - 1;
    syy /= n - 1;
    sxy /= n - 1;
    const tr = sxx + syy;
    const det = sxx * syy - sxy * sxy;
    const disk = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
    const l1 = tr / 2 + disk;
    const l2 = tr / 2 - disk;
    let v1: [number, number] = Math.abs(sxy) > 1e-12 ? [l1 - syy, sxy] : sxx >= syy ? [1, 0] : [0, 1];
    const len = Math.hypot(v1[0], v1[1]);
    v1 = [v1[0] / len, v1[1] / len];
    const v2: [number, number] = [-v1[1], v1[0]];
    return { pkt, l1, l2, v1, v2, snitt: [mx, my] as [number, number], C: [sxx, sxy, syy] };
  }, [spredning, vinkel]);

  const projiser = (p: [number, number]): [number, number] => {
    const t = (p[0] - snitt[0]) * v1[0] + (p[1] - snitt[1]) * v1[1];
    return [snitt[0] + t * v1[0], snitt[1] + t * v1[1]];
  };
  const andel = l1 / (l1 + l2);
  return (
    <div>
      <p className="figur-tittel">PCA i to dimensjoner</p>
      <Plot x={[-7, 7]} y={[-5, 5]} xlabel="x₁" ylabel="x₂" bredde={600} hoyde={440} tittel="Punktsky med prinsipalkomponenter">
        {({ sx, sy }) => (
          <>
            {proj &&
              pkt.map((p, i) => {
                const q = projiser(p);
                return <line key={`l${i}`} x1={sx(p[0])} y1={sy(p[1])} x2={sx(q[0])} y2={sy(q[1])} className="plot-sikte" />;
              })}
            {pkt.map((p, i) => (
              <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r={4} className="plot-punkt serie-1" />
            ))}
            {proj &&
              pkt.map((p, i) => {
                const q = projiser(p);
                return <circle key={`q${i}`} cx={sx(q[0])} cy={sy(q[1])} r={3.5} className="plot-punkt serie-2" />;
              })}
            {[
              { v: v1, l: l1, navn: "PC1", kl: "serie-2" },
              { v: v2, l: l2, navn: "PC2", kl: "serie-3" },
            ].map(({ v, l, navn, kl }) => {
              const s = 2 * Math.sqrt(l);
              const x2 = snitt[0] + v[0] * s;
              const y2 = snitt[1] + v[1] * s;
              return (
                <g key={navn} className={kl}>
                  <line x1={sx(snitt[0])} y1={sy(snitt[1])} x2={sx(x2)} y2={sy(y2)} stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
                  <circle cx={sx(x2)} cy={sy(y2)} r={4} fill="currentColor" />
                  <text x={sx(x2) + 8} y={sy(y2) - 6} className="plot-verdi" fill="currentColor">
                    {navn}
                  </text>
                </g>
              );
            })}
          </>
        )}
      </Plot>
      <div className="figur-verdier">
        <span>
          λ₁ = <strong>{fmt(l1)}</strong>
        </span>
        <span>
          λ₂ = <strong>{fmt(l2)}</strong>
        </span>
        <span>
          PC1 = (<strong>{fmt(v1[0])}</strong>, <strong>{fmt(v1[1])}</strong>)
        </span>
        <span>
          Forklart varians av PC1: <strong>{Math.round(andel * 100)} %</strong>
        </span>
      </div>
      <div className="figur-kontroller">
        <Glider etikett="Spredning langs hovedretningen" verdi={spredning} min={0.8} max={3} steg={0.1} onEndre={setSpredning} />
        <Glider etikett="Rotasjon" verdi={vinkel} min={-80} max={80} steg={5} onEndre={setVinkel} vis={`${vinkel}°`} />
        <label className="bryter">
          <input type="checkbox" checked={proj} onChange={(e) => setProj(e.target.checked)} />
          <span>Vis projeksjon på PC1</span>
        </label>
      </div>
      <p className="figur-tekst">
        PC1 er egenvektoren til kovariansmatrisen med størst egenverdi, altså retningen der dataene varierer mest. PC2 står vinkelrett på den. Pilene er
        skalert med √λ. Projiserer vi på PC1, går vi fra to til én dimensjon og beholder andelen λ₁/(λ₁ + λ₂) av variansen. Avstandene langs de stiplede
        linjene er informasjonen vi mister.
      </p>
    </div>
  );
}
