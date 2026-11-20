import { useState } from "react";
import Plot, { Glider, sti, fmt } from "./plot";

export default function EpsilonGreedy() {
  const [e0, setE0] = useState(0.5);
  const [decay, setDecay] = useState(0.995);
  const [emin, setEmin] = useState(0.01);
  const treffer = emin > 0 && emin < e0 ? Math.ceil(Math.log(emin / e0) / Math.log(decay)) : null;
  const N = Math.min(3000, Math.max(200, Math.round((treffer ?? 500) * 1.4)));
  const eps = (n: number) => Math.max(emin, e0 * decay ** n);
  const punkter = Array.from({ length: 301 }, (_, i) => {
    const n = (i / 300) * N;
    return [n, eps(n)] as [number, number];
  });
  return (
    <div>
      <p className="figur-tittel">Nedtrapping av ε i ε-greedy</p>
      <Plot x={[0, N]} y={[0, Math.max(0.1, e0) * 1.05]} xlabel="episode n" ylabel="ε" hoyde={260} tittel="Epsilon over episoder">
        {({ sx, sy, m, h }) => (
          <>
            {treffer !== null && treffer <= N && <line x1={sx(treffer)} x2={sx(treffer)} y1={m.t} y2={h - m.b} className="plot-sikte" />}
            <line x1={sx(0)} x2={sx(N)} y1={sy(emin)} y2={sy(emin)} className="plot-referanse" />
            <path d={sti(punkter, sx, sy)} className="plot-linje serie-1" />
          </>
        )}
      </Plot>
      <div className="figur-kontroller">
        <Glider etikett="Start ε₀" verdi={e0} min={0.1} max={1} steg={0.05} onEndre={setE0} />
        <Glider etikett="Decay per episode" verdi={decay} min={0.95} max={0.9995} steg={0.0005} onEndre={setDecay} vis={decay.toFixed(4).replace(".", ",")} />
        <Glider etikett="Minste ε" verdi={emin} min={0} max={0.2} steg={0.005} onEndre={setEmin} vis={emin.toFixed(3).replace(".", ",")} />
      </div>
      <div className="figur-verdier">
        <span>
          ε etter 100 episoder: <strong>{fmt(eps(100))}</strong>
        </span>
        <span>
          {treffer !== null ? (
            <>
              ε når minimum etter <strong>{treffer}</strong> episoder
            </>
          ) : (
            "Minimum er ikke under startverdien"
          )}
        </span>
      </div>
      <p className="figur-tekst">
        ε_n = max(ε_min, ε₀ · decay^n). Med sannsynlighet ε velger agenten en tilfeldig handling (utforsking), ellers handlingen med høyest Q-verdi
        (utnyttelse). Høy ε tidlig lar agenten finne gode tilstander før Q-tabellen er pålitelig. Med ε₀ = 0,5 og decay 0,995 når ε 0,01 etter omtrent 780
        episoder, fordi 0,995^n = 0,02 gir n = ln 0,02 / ln 0,995 ≈ 780.
      </p>
    </div>
  );
}
