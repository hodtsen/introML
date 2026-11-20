import { Link, useSearchParams } from "react-router";
import Innhold from "../components/Innhold";
import Laster from "../components/Laster";
import { KAPITLER, lastKapittel, useAsync } from "../data/innhold";

export default function Formelark() {
  const [params, setParams] = useSearchParams();
  const kapNr = Number(params.get("kap") ?? 1);
  const kap = KAPITLER.find((k) => k.nr === kapNr) ?? KAPITLER[0];
  const { data } = useAsync(() => lastKapittel(kap.nr), [kap.nr]);

  return (
    <div className="side formelark">
      <header className="side-hode">
        <h1>Formelark</h1>
        <p className="ingress">
          Alle Formler-seksjonene samlet, med symbolforklaringer. På eksamen har du ingen formelsamling, så bruk dette til å sjekke at du kan
          skrive formlene selv.
        </p>
      </header>
      <div className="fanerad" role="tablist" aria-label="Velg kapittel">
        {KAPITLER.map((k) => (
          <button
            key={k.nr}
            type="button"
            role="tab"
            aria-selected={k.nr === kap.nr}
            className={k.nr === kap.nr ? "aktiv" : ""}
            onClick={() => setParams({ kap: String(k.nr) }, { replace: true })}
          >
            <span className="fane-nr">{k.nr}</span>
            <span className="fane-tittel">{k.tittel}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" className="formelark-innhold">
        <h2 className="formelark-kap">
          Kapittel {kap.nr}: {kap.tittel}
        </h2>
        {!data && <Laster />}
        {data?.delkapitler.map((d) => (
          <section key={d.nr} className="formelark-del seksjon-formler">
            <h3>
              <Link to={`/pensum/${d.nr}?seksjon=formler`}>
                {d.nr} {d.tittel}
              </Link>
            </h3>
            <Innhold deler={d.seksjoner.formler} />
          </section>
        ))}
      </div>
    </div>
  );
}
