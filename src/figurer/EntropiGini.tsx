import { useState } from "react";
import Plot, { Glider, sti, fmt, Forklaring } from "./plot";

const H = (p: number) => (p <= 0 || p >= 1 ? 0 : -p * Math.log2(p) - (1 - p) * Math.log2(1 - p));
const G = (p: number) => 1 - p * p - (1 - p) * (1 - p);

export default function EntropiGini() {
  const [p, setP] = useState(0.2);
  const xs = Array.from({ length: 201 }, (_, i) => i / 200);
  return (
    <div>
      <p className="figur-tittel">Urenhet i en node med to klasser</p>
      <Plot x={[0, 1]} y={[0, 1.05]} xlabel="andel p av klasse 1 i noden" ylabel="urenhet" yticks={[0, 0.25, 0.5, 0.75, 1]} hoyde={280} tittel="Entropi og Gini-indeks">
        {({ sx, sy, m, h }) => (
          <>
            <line x1={sx(p)} x2={sx(p)} y1={m.t} y2={h - m.b} className="plot-sikte" />
            <path d={sti(xs.map((x) => [x, H(x)]), sx, sy)} className="plot-linje serie-1" />
            <path d={sti(xs.map((x) => [x, G(x)]), sx, sy)} className="plot-linje serie-2" />
            <circle cx={sx(p)} cy={sy(H(p))} r={5} className="plot-punkt serie-1" />
            <circle cx={sx(p)} cy={sy(G(p))} r={5} className="plot-punkt serie-2" />
          </>
        )}
      </Plot>
      <Forklaring
        elementer={[
          { navn: "Entropi H (bit)", klasse: "serie-1", strek: true },
          { navn: "Gini-indeks", klasse: "serie-2", strek: true },
        ]}
      />
      <div className="figur-kontroller">
        <Glider etikett="Andel p" verdi={p} min={0} max={1} steg={0.01} onEndre={setP} />
      </div>
      <div className="figur-verdier">
        <span>
          H = <strong>{fmt(H(p))}</strong> bit
        </span>
        <span>
          Gini = <strong>{fmt(G(p))}</strong>
        </span>
      </div>
      <p className="figur-tekst">
        Begge er 0 i en ren node (p = 0 eller 1) og størst når klassene er like store (p = 0,5): entropien er da 1 bit og Gini 0,5. Formen er nesten
        lik, så de velger stort sett de samme splittene. Beslutningstreet velger splitten som gir størst nedgang i urenhet (informasjonsgevinst).
      </p>
    </div>
  );
}
