import { useMemo, useState } from "react";
import Plot, { Glider, sti, fmt, Forklaring } from "./plot";
import { polyfit, polyval, stoy } from "./numerikk";

const f = (x: number) => Math.sin(Math.PI * x) * 1.2 + 0.3 * x;
const r = stoy(7);
const TRENING = Array.from({ length: 12 }, (_, i) => {
  const x = -1 + (2 * i) / 11 + 0.03 * r();
  return { x, y: f(x) + 0.35 * r() };
});
const VALIDERING = Array.from({ length: 12 }, (_, i) => {
  const x = -0.95 + (1.9 * i) / 11;
  return { x, y: f(x) + 0.35 * r() };
});
const MAKSGRAD = 9;

const mse = (c: number[], data: { x: number; y: number }[]) => data.reduce((s, p) => s + (polyval(c, p.x) - p.y) ** 2, 0) / data.length;

export default function BiasVarians() {
  const [grad, setGrad] = useState(3);
  const tilpasninger = useMemo(
    () =>
      Array.from({ length: MAKSGRAD + 1 }, (_, d) => {
        const c = polyfit(
          TRENING.map((p) => p.x),
          TRENING.map((p) => p.y),
          d
        );
        return { c, tren: mse(c, TRENING), val: mse(c, VALIDERING) };
      }),
    []
  );
  const aktiv = tilpasninger[grad];
  const xs = Array.from({ length: 201 }, (_, i) => -1 + i * 0.01);
  const beste = tilpasninger.reduce((b, t, i) => (t.val < tilpasninger[b].val ? i : b), 0);
  const ymaks = Math.max(...tilpasninger.map((t) => t.val));
  return (
    <div>
      <p className="figur-tittel">Modellkompleksitet: polynomgrad mot trenings- og valideringsfeil</p>
      <div>
        <div>
          <Plot x={[-1.05, 1.05]} y={[-2.2, 2.2]} xlabel="x" ylabel="y" hoyde={300} tittel="Polynomtilpasning">
            {({ sx, sy }) => (
              <>
                <path d={sti(xs.map((x) => [x, f(x)]), sx, sy)} className="plot-linje serie-noytral stiplet" />
                <path d={sti(xs.map((x) => [x, Math.max(-2.3, Math.min(2.3, polyval(aktiv.c, x)))]), sx, sy)} className="plot-linje serie-3" />
                {TRENING.map((p, i) => (
                  <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={5} className="plot-punkt serie-1" />
                ))}
                {VALIDERING.map((p, i) => (
                  <rect key={i} x={sx(p.x) - 4.5} y={sy(p.y) - 4.5} width={9} height={9} className="plot-punkt serie-2" />
                ))}
              </>
            )}
          </Plot>
          <Forklaring
            elementer={[
              { navn: "Treningsdata", klasse: "serie-1" },
              { navn: "Valideringsdata", klasse: "serie-2" },
              { navn: `Modell, grad ${grad}`, klasse: "serie-3", strek: true },
              { navn: "Sann funksjon", klasse: "serie-noytral", strek: true },
            ]}
          />
        </div>
        <div>
          <Plot x={[0, MAKSGRAD]} y={[0, Math.min(1.6, ymaks * 1.05)]} xlabel="polynomgrad" ylabel="MSE" hoyde={240} xticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]} tittel="Feil mot grad">
            {({ sx, sy, m, h }) => (
              <>
                <line x1={sx(grad)} x2={sx(grad)} y1={m.t} y2={h - m.b} className="plot-sikte" />
                <path d={sti(tilpasninger.map((t, d) => [d, Math.min(1.6, t.tren)]), sx, sy)} className="plot-linje serie-1" />
                <path d={sti(tilpasninger.map((t, d) => [d, Math.min(1.6, t.val)]), sx, sy)} className="plot-linje serie-2" />
                {tilpasninger.map((t, d) => (
                  <g key={d}>
                    <circle cx={sx(d)} cy={sy(Math.min(1.6, t.tren))} r={3.5} className="plot-punkt serie-1" />
                    <rect x={sx(d) - 3.5} y={sy(Math.min(1.6, t.val)) - 3.5} width={7} height={7} className="plot-punkt serie-2" />
                  </g>
                ))}
              </>
            )}
          </Plot>
          <Forklaring
            elementer={[
              { navn: "Treningsfeil", klasse: "serie-1", strek: true },
              { navn: "Valideringsfeil", klasse: "serie-2", strek: true },
            ]}
          />
        </div>
      </div>
      <div className="figur-kontroller">
        <Glider etikett="Polynomgrad" verdi={grad} min={0} max={MAKSGRAD} steg={1} onEndre={setGrad} vis={String(grad)} />
      </div>
      <div className="figur-verdier">
        <span>
          Treningsfeil <strong>{fmt(aktiv.tren)}</strong>
        </span>
        <span>
          Valideringsfeil <strong>{fmt(aktiv.val)}</strong>
        </span>
        <span>
          Lavest valideringsfeil ved grad <strong>{beste}</strong>
        </span>
      </div>
      <p className="figur-tekst">
        Treningsfeilen synker alltid når modellen blir mer fleksibel. Valideringsfeilen synker først (mindre bias), så stiger den når modellen begynner å
        følge støyen i treningsdataene (mer varians). Lav grad gir undertilpasning, høy grad overtilpasning. Graden som gir lavest valideringsfeil, er
        valget vi tar med til testsettet.
      </p>
    </div>
  );
}
