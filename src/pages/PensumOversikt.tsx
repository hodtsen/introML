import { Link } from "react-router";
import { MestringsPrikk, Fargeforklaring } from "../components/Mestring";
import { KAPITLER, OPPGAVER } from "../data/innhold";
import { delMestring } from "../lib/mestring";
import { useFremgang } from "../store/fremgang";

export default function PensumOversikt() {
  const t = useFremgang();
  return (
    <div className="side pensumoversikt">
      <header className="side-hode">
        <h1>Pensum</h1>
        <p className="ingress">
          Ni kapitler som følger forelesningene. Hvert delkapittel har samme oppbygning: introduksjon, begreper, forklaring, formler,
          sammenhenger, vanlige misforståelser og hva du må kunne til eksamen.
        </p>
        <div className="handlinger">
          <Link to="/formelark" className="knapp knapp-sekundaer">Formelark</Link>
          <Link to="/begreper" className="knapp knapp-sekundaer">Begrepsliste</Link>
        </div>
      </header>
      <ol className="kapittelrutenett">
        {KAPITLER.map((k) => {
          const ant = OPPGAVER.filter((o) => o.kap === k.nr).length;
          const ord = k.delkapitler.reduce((s, d) => s + d.ord, 0);
          return (
            <li key={k.nr} className="kapittelblokk">
              <Link to={`/pensum/kapittel-${k.nr}`} className="kb-hode">
                <span className="kb-nr">{k.nr}</span>
                <span className="kb-tittel">{k.tittel}</span>
              </Link>
              <p className="kb-meta">
                {k.delkapitler.length} delkapitler, ca. {Math.round(ord / 200)} min lesing, {ant} oppgaver
              </p>
              <ol className="kb-deler">
                {k.delkapitler.map((d) => (
                  <li key={d.nr}>
                    <Link to={`/pensum/${d.nr}`}>
                      <MestringsPrikk m={delMestring(d.nr, t)} lest={Boolean(t.lest[d.nr])} />
                      <span className="kb-del-nr">{d.nr}</span> {d.tittel}
                    </Link>
                  </li>
                ))}
              </ol>
            </li>
          );
        })}
      </ol>
      <Fargeforklaring />
    </div>
  );
}
