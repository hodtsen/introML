import { useState } from "react";
import Plot, { Glider, sti, fmt } from "./plot";

const sigma = (z: number) => 1 / (1 + Math.exp(-z));

export default function Sigmoid() {
  const [w, setW] = useState(1.2);
  const [b, setB] = useState(-1);
  const [t, setT] = useState(0.5);
  const xs = Array.from({ length: 241 }, (_, i) => -6 + i * 0.05);
  const grense = w !== 0 ? (Math.log(t / (1 - t)) - b) / w : null;
  const synlig = grense !== null && grense > -6 && grense < 6;
  return (
    <div>
      <p className="figur-tittel">Logistisk regresjon med én feature</p>
      <Plot x={[-6, 6]} y={[0, 1]} xlabel="feature x" ylabel="ŷ = σ(wx + b)" yticks={[0, 0.25, 0.5, 0.75, 1]} hoyde={300} tittel="Sigmoidkurve med beslutningsgrense">
        {({ sx, sy, m, h }) => (
          <>
            {synlig && (
              <rect
                x={w > 0 ? sx(grense!) : sx(-6)}
                y={m.t}
                width={w > 0 ? sx(6) - sx(grense!) : sx(grense!) - sx(-6)}
                height={h - m.b - m.t}
                className="serie-1 plot-flate"
              />
            )}
            <line x1={sx(-6)} x2={sx(6)} y1={sy(t)} y2={sy(t)} className="plot-referanse" />
            {synlig && <line x1={sx(grense!)} x2={sx(grense!)} y1={m.t} y2={h - m.b} className="plot-sikte" />}
            <path d={sti(xs.map((x) => [x, sigma(w * x + b)]), sx, sy)} className="plot-linje serie-1" />
            {synlig && (
              <text x={sx(grense!) + 6} y={m.t + 14} className="plot-tick">
                x = {fmt(grense!)}
              </text>
            )}
          </>
        )}
      </Plot>
      <div className="figur-kontroller">
        <Glider etikett="Vekt w" verdi={w} min={-3} max={3} steg={0.1} onEndre={setW} />
        <Glider etikett="Bias b" verdi={b} min={-5} max={5} steg={0.1} onEndre={setB} />
        <Glider etikett="Terskel" verdi={t} min={0.05} max={0.95} steg={0.05} onEndre={setT} />
      </div>
      <p className="figur-tekst">
        Det skraverte området predikeres som klasse 1. Beslutningsgrensen ligger der σ(wx + b) er lik terskelen, altså der wx + b = ln(t/(1 − t)). Med
        terskel 0,5 er det der wx + b = 0, så x = −b/w. Større |w| gir brattere kurve (sikrere prediksjoner), negativ w snur kurven, og b flytter den
        sidelengs.
      </p>
    </div>
  );
}
