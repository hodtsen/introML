import { useState } from "react";
import Plot, { Glider, sti, fmt, Forklaring } from "./plot";

type Navn = "heaviside" | "sigmoid" | "relu" | "lineaer";
const FUNK: Record<Navn, { navn: string; f: (z: number) => number; d: (z: number) => number; tekst: string; y: [number, number] }> = {
  heaviside: {
    navn: "Heaviside",
    f: (z) => (z >= 0 ? 1 : 0),
    d: () => 0,
    y: [-0.2, 1.2],
    tekst: "Perceptronets aktivering. Output er bare 0 eller 1. Den deriverte er 0 overalt unntatt i hoppet, der den ikke finnes, så gradient descent får ingen informasjon å gå etter.",
  },
  sigmoid: {
    navn: "Sigmoid",
    f: (z) => 1 / (1 + Math.exp(-z)),
    d: (z) => {
      const s = 1 / (1 + Math.exp(-z));
      return s * (1 - s);
    },
    y: [-0.2, 1.2],
    tekst: "Glatt versjon av Heaviside med output i (0, 1). Den deriverte er σ(z)(1 − σ(z)), høyst 0,25 i z = 0 og nær 0 for store |z|. Mange slike faktorer ganget sammen gir små gradienter i dype nett.",
  },
  relu: {
    navn: "ReLU",
    f: (z) => Math.max(0, z),
    d: (z) => (z > 0 ? 1 : 0),
    y: [-1, 5],
    tekst: "max(0, z). Kursets standardvalg i skjulte lag. Den deriverte er 1 for positive z, så gradienten krymper ikke gjennom mange lag, og den er billig å regne ut. For negative z er den deriverte 0.",
  },
  lineaer: {
    navn: "Lineær (ingen)",
    f: (z) => z,
    d: () => 1,
    y: [-5, 5],
    tekst: "Brukes i output-laget ved regresjon, der svaret kan være et hvilket som helst reelt tall. I skjulte lag gir den ingen gevinst: lineære lag etter hverandre er fortsatt én lineær funksjon.",
  },
};

export default function Aktiveringer() {
  const [valgt, setValgt] = useState<Navn>("sigmoid");
  const [logits, setLogits] = useState([2, 1, 0]);
  const F = FUNK[valgt];
  const zs = Array.from({ length: 401 }, (_, i) => -5 + i * 0.025);
  const eks = logits.map((z) => Math.exp(z));
  const sum = eks.reduce((a, b) => a + b, 0);
  const soft = eks.map((e) => e / sum);
  const deler = (f: (z: number) => number) => {
    if (valgt !== "heaviside") return [zs.map((z) => [z, f(z)] as [number, number])];
    return [zs.filter((z) => z < 0).map((z) => [z, f(z)] as [number, number]), zs.filter((z) => z >= 0).map((z) => [z, f(z)] as [number, number])];
  };
  return (
    <div>
      <p className="figur-tittel">Aktiveringsfunksjoner og deres deriverte</p>
      <div className="segmentert" role="group" aria-label="Velg funksjon">
        {(Object.keys(FUNK) as Navn[]).map((n) => (
          <button key={n} type="button" aria-pressed={valgt === n} onClick={() => setValgt(n)}>
            {FUNK[n].navn}
          </button>
        ))}
      </div>
      <Plot x={[-5, 5]} y={F.y} xlabel="z (vektet sum inn i noden)" hoyde={280} tittel={`${F.navn} og den deriverte`}>
        {({ sx, sy }) => (
          <>
            {deler(F.d).map((d, i) => (
              <path key={`d${i}`} d={sti(d, sx, sy)} className="plot-linje serie-2 stiplet" />
            ))}
            {deler(F.f).map((d, i) => (
              <path key={`f${i}`} d={sti(d, sx, sy)} className="plot-linje serie-1" />
            ))}
          </>
        )}
      </Plot>
      <Forklaring
        elementer={[
          { navn: "Funksjonen", klasse: "serie-1", strek: true },
          { navn: "Den deriverte", klasse: "serie-2", strek: true },
        ]}
      />
      <p className="figur-tekst">{F.tekst}</p>

      <p className="figur-tittel" style={{ marginTop: "1.25rem" }}>
        Softmax i output-laget
      </p>
      <div className="figur-to">
        <div className="figur-kontroller" style={{ flexDirection: "column", alignItems: "stretch" }}>
          {logits.map((z, i) => (
            <Glider key={i} etikett={`z${i + 1} (klasse ${i + 1})`} verdi={z} min={-3} max={4} steg={0.1} onEndre={(v) => setLogits((l) => l.map((x, k) => (k === i ? v : x)))} />
          ))}
        </div>
        <Plot x={[0, 3]} y={[0, 1]} xticks={[]} yticks={[0, 0.25, 0.5, 0.75, 1]} bredde={360} hoyde={220} ylabel="sannsynlighet" tittel="Softmax-output">
          {({ sx, sy, h, m }) =>
            soft.map((p, i) => {
              const x0 = sx(i + 0.2);
              const bw = sx(i + 0.8) - x0;
              return (
                <g key={i}>
                  <path d={`M${x0},${sy(0)} V${sy(p) + 3} q0,-3 3,-3 H${x0 + bw - 3} q3,0 3,3 V${sy(0)} Z`} className="plot-stolpe" />
                  <text x={x0 + bw / 2} y={sy(p) - 6} textAnchor="middle" className="plot-verdi">
                    {fmt(p)}
                  </text>
                  <text x={x0 + bw / 2} y={h - m.b + 18} textAnchor="middle" className="plot-tick">
                    klasse {i + 1}
                  </text>
                </g>
              );
            })
          }
        </Plot>
      </div>
      <p className="figur-tekst">
        Softmax gjør output-verdiene om til sannsynligheter som summerer til 1: e^(z_i) delt på summen av alle e^(z_j). Den største z-en får størst
        sannsynlighet, men de andre blir ikke 0. Legger du samme tall til alle z-ene, endres ingenting.
      </p>
    </div>
  );
}
