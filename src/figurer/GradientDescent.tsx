import { useState } from "react";
import Plot, { Glider, sti, fmt } from "./plot";

// L(w) = (w − 2)² + 0,5. Gradient 2(w − 2). Ett steg ganger avstanden til minimum med 1 − 2η.
const L = (w: number) => (w - 2) ** 2 + 0.5;
const dL = (w: number) => 2 * (w - 2);

export default function GradientDescent() {
  const [eta, setEta] = useState(0.15);
  const [start, setStart] = useState(-1.5);
  const [sti0, setSti] = useState<number[]>([-1.5]);
  const w = sti0[sti0.length - 1];
  const steg = (n: number) =>
    setSti((s) => {
      const ny = [...s];
      for (let i = 0; i < n && ny.length < 200; i++) {
        const v = ny[ny.length - 1];
        ny.push(v - eta * dL(v));
      }
      return ny;
    });
  const nullstill = (v = start) => setSti([v]);
  const faktor = 1 - 2 * eta;
  const regime =
    Math.abs(faktor) < 1e-9
      ? "treffer minimum i ett steg"
      : faktor > 0
        ? "går jevnt mot minimum"
        : faktor > -1
          ? "hopper fram og tilbake, men konvergerer"
          : faktor === -1
            ? "hopper fram og tilbake for alltid"
            : "divergerer: hvert steg havner lenger unna";
  const xs = Array.from({ length: 161 }, (_, i) => -2 + i * 0.05);
  const klipp = (v: number) => Math.max(-2, Math.min(6, v));
  return (
    <div>
      <p className="figur-tittel">Gradient descent på L(w) = (w − 2)² + 0,5</p>
      <Plot x={[-2, 6]} y={[0, 17]} xlabel="parameter w" ylabel="tap L(w)" hoyde={300} tittel="Gradient descent på en kvadratisk tapsfunksjon">
        {({ sx, sy }) => (
          <>
            <path d={sti(xs.map((x) => [x, L(x)]), sx, sy)} className="plot-linje serie-noytral" />
            <path d={sti(sti0.map((v) => [klipp(v), Math.min(17, L(v))]), sx, sy)} className="plot-linje serie-2" />
            {sti0.map((v, i) => (
              <circle key={i} cx={sx(klipp(v))} cy={sy(Math.min(17, L(v)))} r={i === sti0.length - 1 ? 6 : 3.5} className="plot-punkt serie-2" />
            ))}
          </>
        )}
      </Plot>
      <div className="figur-verdier">
        <span>
          Steg <strong>{sti0.length - 1}</strong>
        </span>
        <span>
          w = <strong>{Math.abs(w) > 1e6 ? "±∞" : fmt(w)}</strong>
        </span>
        <span>
          L(w) = <strong>{Math.abs(w) > 1e6 ? "∞" : fmt(L(w))}</strong>
        </span>
        <span>
          gradient = <strong>{Math.abs(w) > 1e6 ? "–" : fmt(dL(w))}</strong>
        </span>
      </div>
      <div className="figur-kontroller">
        <Glider
          etikett="Læringsrate η"
          verdi={eta}
          min={0.02}
          max={1.1}
          steg={0.01}
          onEndre={(v) => {
            setEta(v);
            nullstill();
          }}
        />
        <Glider
          etikett="Startverdi"
          verdi={start}
          min={-2}
          max={6}
          steg={0.1}
          onEndre={(v) => {
            setStart(v);
            nullstill(v);
          }}
        />
        <div className="handlinger">
          <button type="button" className="knapp knapp-liten" onClick={() => steg(1)}>
            Ta ett steg
          </button>
          <button type="button" className="knapp knapp-liten knapp-sekundaer" onClick={() => steg(10)}>
            Ti steg
          </button>
          <button type="button" className="knapp-tekst" onClick={() => nullstill()}>
            Start på nytt
          </button>
        </div>
      </div>
      <p className="figur-tekst">
        Oppdateringen er w ← w − η · 2(w − 2), så avstanden til minimum ganges med 1 − 2η = {fmt(faktor)} for hvert steg. Med denne læringsraten{" "}
        {regime}. Prøv η = 0,05 (tregt), 0,5 (ett steg), 0,8 (hopper) og 1,05 (divergerer).
      </p>
    </div>
  );
}
