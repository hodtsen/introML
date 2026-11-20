import { useMemo, useState } from "react";
import Plot, { Glider, sti, fmt, Forklaring } from "./plot";
import { stoy } from "./numerikk";

const r = stoy(11);
const DATA = Array.from({ length: 16 }, (_, i) => {
  const x = 0.3 + i * 0.62;
  return { x, y: 2 + 1.6 * Math.sin(x * 0.9) + 0.15 * x + 0.35 * r() };
});

interface Stump {
  s: number;
  v: number;
  h: number;
}

// Beste stump (én splitt) for residualene, målt med kvadratfeil.
function besteStump(res: number[]): Stump {
  let best: Stump & { sse: number } = { s: 0, v: 0, h: 0, sse: Infinity };
  for (let i = 1; i < DATA.length; i++) {
    const s = (DATA[i - 1].x + DATA[i].x) / 2;
    const V = res.filter((_, k) => DATA[k].x < s);
    const H = res.filter((_, k) => DATA[k].x >= s);
    const mv = V.reduce((a, b) => a + b, 0) / V.length;
    const mh = H.reduce((a, b) => a + b, 0) / H.length;
    const sse = V.reduce((a, b) => a + (b - mv) ** 2, 0) + H.reduce((a, b) => a + (b - mh) ** 2, 0);
    if (sse < best.sse) best = { s, v: mv, h: mh, sse };
  }
  return { s: best.s, v: best.v, h: best.h };
}

export default function GradientBoosting() {
  const [eta, setEta] = useState(0.5);
  const [antall, setAntall] = useState(0);
  const snitt = DATA.reduce((a, p) => a + p.y, 0) / DATA.length;

  const trær = useMemo(() => {
    const ut: Stump[] = [];
    let F = DATA.map(() => snitt);
    for (let t = 0; t < 60; t++) {
      const res = DATA.map((p, k) => p.y - F[k]);
      const st = besteStump(res);
      ut.push(st);
      F = F.map((v, k) => v + eta * (DATA[k].x < st.s ? st.v : st.h));
    }
    return ut;
  }, [eta, snitt]);

  const modell = (x: number, n: number) => trær.slice(0, n).reduce((v, st) => v + eta * (x < st.s ? st.v : st.h), snitt);
  const mse = DATA.reduce((a, p) => a + (p.y - modell(p.x, antall)) ** 2, 0) / DATA.length;
  const xs = Array.from({ length: 401 }, (_, i) => i * 0.025);
  const neste = antall < trær.length ? trær[antall] : null;

  return (
    <div>
      <p className="figur-tittel">Gradient boosting med stumper (trær med én splitt)</p>
      <Plot x={[0, 10]} y={[0, 5]} xlabel="x" ylabel="y" hoyde={300} tittel="Gradient boosting steg for steg">
        {({ sx, sy }) => (
          <>
            {DATA.map((p, i) => (
              <line key={`r${i}`} x1={sx(p.x)} x2={sx(p.x)} y1={sy(p.y)} y2={sy(modell(p.x, antall))} className="plot-sikte" />
            ))}
            <path d={sti(xs.map((x) => [x, modell(x, antall)]), sx, sy)} className="plot-linje serie-2" />
            {DATA.map((p, i) => (
              <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={5} className="plot-punkt serie-1" />
            ))}
          </>
        )}
      </Plot>
      <Forklaring
        elementer={[
          { navn: "Data", klasse: "serie-1" },
          { navn: `Modellen etter ${antall} trær`, klasse: "serie-2", strek: true },
          { navn: "Residual (det neste treet skal lære)", klasse: "serie-noytral", strek: true },
        ]}
      />
      <div className="figur-verdier">
        <span>
          Trær <strong>{antall}</strong>
        </span>
        <span>
          Start F₀ = snittet = <strong>{fmt(snitt)}</strong>
        </span>
        <span>
          Treningsfeil (MSE) <strong>{fmt(mse)}</strong>
        </span>
        {neste && (
          <span>
            Neste tre splitter ved x = <strong>{fmt(neste.s)}</strong>
          </span>
        )}
      </div>
      <div className="figur-kontroller">
        <Glider
          etikett="Læringsrate η"
          verdi={eta}
          min={0.1}
          max={1}
          steg={0.1}
          onEndre={(v) => {
            setEta(v);
            setAntall(0);
          }}
        />
        <div className="handlinger">
          <button type="button" className="knapp knapp-liten" onClick={() => setAntall((n) => Math.min(trær.length, n + 1))}>
            Legg til ett tre
          </button>
          <button type="button" className="knapp knapp-liten knapp-sekundaer" onClick={() => setAntall((n) => Math.min(trær.length, n + 10))}>
            Ti trær
          </button>
          <button type="button" className="knapp-tekst" onClick={() => setAntall(0)}>
            Start på nytt
          </button>
        </div>
      </div>
      <p className="figur-tekst">
        Modellen starter med gjennomsnittet. Hvert nytt tre trenes på residualene y − F(x), altså det modellen ennå ikke forklarer, og legges til med vekt
        η: F ← F + η · h. Med tapet ½(y − F)² er residualen nettopp minus gradienten av tapet med hensyn på F. Lav η krever flere trær, men gir jevnere læring. Etter
        mange trær tilpasser modellen seg støyen, så antall trær må velges med validering.
      </p>
    </div>
  );
}
