import { Link } from "react-router";
import { KAPITLER } from "../data/innhold";
import { tekstPaViridis, viridis } from "../lib/farger";
import { delMestring, type Mestring } from "../lib/mestring";
import { useFremgang } from "../store/fremgang";

export function prosent(m: number | null) {
  return m === null ? "–" : `${Math.round(m * 100)} %`;
}

export function mestringTekst(m: Mestring) {
  if (m.totalt === 0) return "Ingen oppgaver ennå";
  if (m.mestring === null) return `${m.totalt} oppgaver, ingen forsøkt`;
  return `${prosent(m.mestring)} riktig på ${m.forsokte} av ${m.totalt} oppgaver`;
}

export function MestringsPrikk({ m, lest }: { m: Mestring; lest?: boolean }) {
  const farge = m.mestring === null ? undefined : viridis(m.mestring);
  return (
    <span
      className={`mestringsprikk ${m.mestring === null ? "tom" : ""} ${lest ? "lest" : ""}`}
      style={farge ? { background: farge } : undefined}
      title={mestringTekst(m) + (lest ? ". Lest." : "")}
      aria-hidden="true"
    />
  );
}

export function Mestringsstolpe({ verdi, etikett }: { verdi: number | null; etikett?: string }) {
  return (
    <span className="mestringsstolpe" role="img" aria-label={etikett ?? `Mestring ${prosent(verdi)}`}>
      <span style={{ width: `${Math.round((verdi ?? 0) * 100)}%`, background: verdi === null ? "transparent" : viridis(verdi) }} />
    </span>
  );
}

export function Fargeforklaring() {
  return (
    <div className="fargeforklaring" aria-hidden="true">
      <span className="ff-tom">Ikke forsøkt</span>
      <span className="ff-skala">
        <span>0 %</span>
        <span className="ff-gradient" />
        <span>100 %</span>
      </span>
      <span className="ff-lest">
        <span className="mestringsprikk tom lest" /> Lest
      </span>
    </div>
  );
}

// Mestringskartet: én rad per kapittel, én celle per delkapittel, farget etter mestring.
export default function Mestringskart({ kompakt = false }: { kompakt?: boolean }) {
  const t = useFremgang();
  return (
    <div className={`mestringskart ${kompakt ? "kompakt" : ""}`}>
      {KAPITLER.map((k) => (
        <div className="mk-rad" key={k.nr}>
          <Link to={`/pensum/kapittel-${k.nr}`} className="mk-kapittel">
            <span className="mk-nr">{k.nr}</span>
            <span className="mk-tittel">{k.tittel}</span>
          </Link>
          <div className="mk-celler">
            {k.delkapitler.map((d) => {
              const m = delMestring(d.nr, t);
              const lest = Boolean(t.lest[d.nr]);
              const stil = m.mestring === null ? undefined : { background: viridis(m.mestring), color: tekstPaViridis(m.mestring) };
              return (
                <Link
                  key={d.nr}
                  to={`/pensum/${d.nr}`}
                  className={`mk-celle ${m.mestring === null ? "tom" : ""} ${lest ? "lest" : ""}`}
                  style={stil}
                  aria-label={`${d.nr} ${d.tittel}: ${mestringTekst(m)}${lest ? ", lest" : ""}`}
                >
                  <span className="mk-celle-nr">{d.nr}</span>
                  {!kompakt && <span className="mk-celle-tittel">{d.tittel}</span>}
                  <span className="mk-celle-tips" role="tooltip">
                    <strong>
                      {d.nr} {d.tittel}
                    </strong>
                    {mestringTekst(m)}
                    {lest ? ". Lest." : ""}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
