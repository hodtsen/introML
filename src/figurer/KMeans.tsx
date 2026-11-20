import { useState } from "react";
import Plot, { Glider, fmt } from "./plot";
import { stoy } from "./numerikk";
import { rng } from "../lib/tilfeldig";

type P = [number, number];
const r = stoy(3);
const SENTRE: P[] = [
  [2, 2.2],
  [6.5, 3],
  [4, 7],
];
const PUNKTER: P[] = SENTRE.flatMap(([cx, cy], k) => Array.from({ length: 14 }, () => [cx + (k === 1 ? 1.1 : 0.85) * r(), cy + 0.85 * r()] as P));

const d2 = (a: P, b: P) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const KLASSER = ["serie-1", "serie-2", "serie-3", "serie-5"];

function tildel(sentroider: P[]) {
  return PUNKTER.map((p) => {
    let best = 0;
    sentroider.forEach((c, k) => {
      if (d2(p, c) < d2(p, sentroider[best])) best = k;
    });
    return best;
  });
}

function wcss(sentroider: P[], etiketter: number[]) {
  return PUNKTER.reduce((s, p, i) => s + d2(p, sentroider[etiketter[i]]), 0);
}

function Merke({ x, y, k, r: rad }: { x: number; y: number; k: number; r: number }) {
  if (k === 3) return <rect x={x - rad} y={y - rad} width={rad * 2} height={rad * 2} className={`plot-punkt ${KLASSER[k]}`} />;
  if (k === 2) return <path d={`M${x},${y - rad * 1.2} L${x + rad * 1.1},${y + rad * 0.8} L${x - rad * 1.1},${y + rad * 0.8} Z`} className={`plot-punkt ${KLASSER[k]}`} />;
  return <circle cx={x} cy={y} r={rad} className={`plot-punkt ${KLASSER[k]}`} />;
}

export default function KMeans() {
  const [k, setK] = useState(3);
  const [seed, setSeed] = useState(1);
  const [sentroider, setSentroider] = useState<P[]>(() => tilfeldigStart(3, 1));
  const [etiketter, setEtiketter] = useState<number[] | null>(null);
  const [fase, setFase] = useState<"tildel" | "flytt">("tildel");
  const [iter, setIter] = useState(0);
  const [ferdig, setFerdig] = useState(false);

  function tilfeldigStart(kk: number, s: number): P[] {
    const g = rng(s * 97);
    const valgt = new Set<number>();
    while (valgt.size < kk) valgt.add(Math.floor(g() * PUNKTER.length));
    return [...valgt].map((i) => [...PUNKTER[i]] as P);
  }
  function plussPluss(kk: number, s: number): P[] {
    const g = rng(s * 131);
    const c: P[] = [[...PUNKTER[Math.floor(g() * PUNKTER.length)]] as P];
    while (c.length < kk) {
      const D = PUNKTER.map((p) => Math.min(...c.map((x) => d2(p, x))));
      const tot = D.reduce((a, b) => a + b, 0);
      let u = g() * tot;
      let i = 0;
      while (u > D[i] && i < D.length - 1) u -= D[i++];
      c.push([...PUNKTER[i]] as P);
    }
    return c;
  }
  const start = (kk: number, metode: "tilfeldig" | "pp") => {
    const s = seed + 1;
    setSeed(s);
    setSentroider(metode === "pp" ? plussPluss(kk, s) : tilfeldigStart(kk, s));
    setEtiketter(null);
    setFase("tildel");
    setIter(0);
    setFerdig(false);
  };

  const steg = () => {
    if (fase === "tildel") {
      const ny = tildel(sentroider);
      if (etiketter && ny.every((v, i) => v === etiketter[i])) setFerdig(true);
      setEtiketter(ny);
      setFase("flytt");
    } else if (etiketter) {
      setSentroider(
        sentroider.map((c, j) => {
          const medl = PUNKTER.filter((_, i) => etiketter[i] === j);
          if (medl.length === 0) return c;
          return [medl.reduce((a, p) => a + p[0], 0) / medl.length, medl.reduce((a, p) => a + p[1], 0) / medl.length] as P;
        })
      );
      setFase("tildel");
      setIter((n) => n + 1);
    }
  };

  const kjor = () => {
    let c = sentroider;
    let e = tildel(c);
    let n = iter;
    for (let i = 0; i < 50; i++) {
      c = c.map((cc, j) => {
        const medl = PUNKTER.filter((_, q) => e[q] === j);
        return medl.length ? ([medl.reduce((a, p) => a + p[0], 0) / medl.length, medl.reduce((a, p) => a + p[1], 0) / medl.length] as P) : cc;
      });
      n++;
      const ny = tildel(c);
      if (ny.every((v, q) => v === e[q])) {
        e = ny;
        break;
      }
      e = ny;
    }
    setSentroider(c);
    setEtiketter(e);
    setIter(n);
    setFase("flytt");
    setFerdig(true);
  };

  const w = etiketter ? wcss(sentroider, etiketter) : null;
  return (
    <div>
      <p className="figur-tittel">k-means steg for steg</p>
      <Plot x={[-0.5, 9.5]} y={[-0.5, 9.5]} xlabel="x₁" ylabel="x₂" hoyde={360} bredde={560} tittel="k-means-klynger">
        {({ sx, sy }) => (
          <>
            {PUNKTER.map((p, i) =>
              etiketter ? (
                <Merke key={i} x={sx(p[0])} y={sy(p[1])} k={etiketter[i]} r={5} />
              ) : (
                <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r={5} className="plot-punkt serie-noytral" />
              )
            )}
            {sentroider.map((c, j) => (
              <g key={j} className={KLASSER[j]}>
                <circle cx={sx(c[0])} cy={sy(c[1])} r={11} fill="var(--surface)" stroke="currentColor" strokeWidth={3} />
                <path d={`M${sx(c[0]) - 5},${sy(c[1])} h10 M${sx(c[0])},${sy(c[1]) - 5} v10`} stroke="currentColor" strokeWidth={2.5} />
              </g>
            ))}
          </>
        )}
      </Plot>
      <div className="figur-verdier">
        <span>
          Iterasjon <strong>{iter}</strong>
        </span>
        <span>
          WCSS (inertia) <strong>{w === null ? "–" : fmt(w)}</strong>
        </span>
        <span>{ferdig ? <strong>Konvergert: ingen punkter bytter klynge.</strong> : fase === "tildel" ? "Neste: tildel hvert punkt til nærmeste sentroide" : "Neste: flytt hver sentroide til snittet av punktene sine"}</span>
      </div>
      <div className="figur-kontroller">
        <Glider
          etikett="Antall klynger k"
          verdi={k}
          min={2}
          max={4}
          steg={1}
          vis={String(k)}
          onEndre={(v) => {
            setK(v);
            start(v, "tilfeldig");
          }}
        />
        <div className="handlinger">
          <button type="button" className="knapp knapp-liten" onClick={steg} disabled={ferdig}>
            {fase === "tildel" ? "Tildel punkter" : "Flytt sentroider"}
          </button>
          <button type="button" className="knapp knapp-liten knapp-sekundaer" onClick={kjor} disabled={ferdig}>
            Kjør til konvergens
          </button>
          <button type="button" className="knapp-tekst" onClick={() => start(k, "tilfeldig")}>
            Tilfeldig start
          </button>
          <button type="button" className="knapp-tekst" onClick={() => start(k, "pp")}>
            k-means++-start
          </button>
        </div>
      </div>
      <p className="figur-tekst">
        k-means veksler mellom to steg til ingen punkter bytter klynge: tildel hvert punkt til nærmeste sentroide, og flytt hver sentroide til snittet av
        punktene sine. Begge stegene kan bare senke WCSS, så algoritmen konvergerer, men ikke nødvendigvis til det globale minimum. Prøv flere tilfeldige
        starter og sammenlign WCSS. k-means++ sprer startsentroidene og havner oftere i en god løsning.
      </p>
    </div>
  );
}
