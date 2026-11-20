import { useRef, useState } from "react";
import { Link } from "react-router";
import Mestringskart, { Fargeforklaring, Mestringsstolpe, prosent } from "../components/Mestring";
import { KAPITLER, OPPGAVER } from "../data/innhold";
import { kapMestring, samletMestring, svakesteDeler } from "../lib/mestring";
import { eksporter, importer, nullstill, useFremgang } from "../store/fremgang";
import Plot, { sti } from "../figurer/plot";

export default function Fremgang() {
  const t = useFremgang();
  const samlet = samletMestring(t);
  const svake = svakesteDeler(t, 6);
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null);
  const [bekreftNullstill, setBekreftNullstill] = useState(false);
  const [visEksport, setVisEksport] = useState<string | null>(null);
  const fil = useRef<HTMLInputElement>(null);
  const antForsok = Object.values(t.forsok).reduce((s, l) => s + l.length, 0);
  const eksamener = [...t.eksamener].reverse();

  const lastNed = () => {
    const json = eksporter();
    try {
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `tdt4172-fremgang-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMelding({ ok: true, tekst: "Fremgangen er lastet ned som JSON-fil." });
    } catch {
      setVisEksport(json);
    }
  };

  const lesFil = async (f: File) => {
    const r = importer(await f.text());
    setMelding(r.ok ? { ok: true, tekst: "Fremgangen er importert." } : { ok: false, tekst: r.melding });
  };

  return (
    <div className="side fremgang">
      <header className="side-hode">
        <h1>Fremgang</h1>
        <p className="ingress">
          {Object.keys(t.lest).length} av 58 delkapitler lest. {samlet.forsokte} av {samlet.totalt} oppgaver forsøkt ({antForsok} forsøk i alt), og{" "}
          {prosent(samlet.mestring)} riktig på dem. {t.eksamener.length} eksamenssimuleringer levert.
        </p>
      </header>

      <section className="panel">
        <h2>Mestringskart</h2>
        <Mestringskart kompakt />
        <Fargeforklaring />
      </section>

      <div className="resultat-kolonner">
        <section className="panel">
          <h2>Per kapittel</h2>
          <table className="tabell-enkel">
            <thead>
              <tr>
                <th>Kapittel</th>
                <th>Lest</th>
                <th>Forsøkt</th>
                <th>Riktig</th>
              </tr>
            </thead>
            <tbody>
              {KAPITLER.map((k) => {
                const m = kapMestring(k.nr, t);
                const lest = k.delkapitler.filter((d) => t.lest[d.nr]).length;
                return (
                  <tr key={k.nr}>
                    <td>
                      <Link to={`/pensum/kapittel-${k.nr}`}>
                        {k.nr}. {k.tittel}
                      </Link>
                    </td>
                    <td>
                      {lest}/{k.delkapitler.length}
                    </td>
                    <td>
                      {m.forsokte}/{OPPGAVER.filter((o) => o.kap === k.nr).length}
                    </td>
                    <td>
                      <span className="andel-celle">
                        <Mestringsstolpe verdi={m.mestring} /> {prosent(m.mestring)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h2>Svakeste delkapitler</h2>
          {svake.length === 0 ? (
            <p className="dempet">Svar på noen oppgaver, så ser du her hvor du bør sette inn innsatsen.</p>
          ) : (
            <ul className="anbefalinger">
              {svake.map((d) => (
                <li key={d.nr}>
                  <span>
                    <strong>
                      {d.nr} {d.tittel}
                    </strong>
                    <span className="dempet">
                      {" "}
                      {prosent(d.m.mestring)} på {d.m.forsokte} av {d.m.totalt}
                    </span>
                  </span>
                  <span className="anbefaling-lenker">
                    <Link to={`/pensum/${d.nr}`}>Les</Link>
                    <Link to={`/trening/okt?del=${d.nr}`}>Øv</Link>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel">
        <h2>Eksamenssimuleringer</h2>
        {eksamener.length === 0 ? (
          <p className="dempet">
            Ingen levert ennå. <Link to="/eksamen">Sett opp en eksamen</Link>.
          </p>
        ) : (
          <>
            {eksamener.length >= 2 && (
              <div className="figur">
                <Plot
                  x={[1, eksamener.length]}
                  y={[0, 1]}
                  xlabel="Forsøk"
                  ylabel="Andel av maks"
                  xticks={eksamener.map((_, i) => i + 1).filter((i) => eksamener.length <= 12 || i % Math.ceil(eksamener.length / 12) === 0)}
                  yticks={[0, 0.25, 0.5, 0.75, 1]}
                  ytickFormat={(v) => `${Math.round(v * 100)} %`}
                  tittel="Resultat per eksamenssimulering"
                  hoyde={260}
                >
                  {({ sx, sy }) => (
                    <g className="serie serie-1">
                      {[0.89, 0.41].map((g) => (
                        <line key={g} x1={sx(1)} x2={sx(eksamener.length)} y1={sy(g)} y2={sy(g)} className="plot-referanse" />
                      ))}
                      <text x={sx(eksamener.length)} y={sy(0.89) - 5} textAnchor="end" className="plot-tick">
                        A
                      </text>
                      <text x={sx(eksamener.length)} y={sy(0.41) - 5} textAnchor="end" className="plot-tick">
                        E
                      </text>
                      <path d={sti(eksamener.map((e, i) => [i + 1, e.prosent]), sx, sy)} className="plot-linje" />
                      {eksamener.map((e, i) => (
                        <circle key={e.id} cx={sx(i + 1)} cy={sy(e.prosent)} r={4.5} className="plot-punkt">
                          <title>
                            Forsøk {i + 1}: {prosent(e.prosent)} ({e.karakter})
                          </title>
                        </circle>
                      ))}
                    </g>
                  )}
                </Plot>
              </div>
            )}
            <table className="tabell-enkel">
              <thead>
                <tr>
                  <th>Dato</th>
                  <th>Oppsett</th>
                  <th>Resultat</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {t.eksamener.map((e) => (
                  <tr key={e.id}>
                    <td>{new Date(e.slutt).toLocaleString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td>
                      {e.oppsett.modus === "H25" ? "Som 2025" : "Regler 2026"}, {e.sporsmal.length} spørsmål
                      {e.oppsett.sett !== "tilfeldig" ? `, sett ${e.oppsett.sett}` : ""}
                    </td>
                    <td>
                      {prosent(e.prosent)} ({e.karakter})
                    </td>
                    <td>
                      <Link to={`/eksamen/resultat/${e.id}`}>Rapport</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <section className="panel data-panel">
        <h2>Dine data</h2>
        <p>
          Fremgangen lagres bare i denne nettleseren. Last ned en kopi for å ta vare på den, eller for å flytte den til en annen enhet og importere den
          der.
        </p>
        <div className="handlinger">
          <button type="button" className="knapp knapp-sekundaer" onClick={lastNed}>
            Last ned fremgangen
          </button>
          <button type="button" className="knapp knapp-sekundaer" onClick={() => fil.current?.click()}>
            Importer fra fil
          </button>
          <input
            ref={fil}
            type="file"
            accept="application/json,.json"
            className="visuelt-skjult"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) lesFil(f);
              e.target.value = "";
            }}
          />
          {!bekreftNullstill ? (
            <button type="button" className="knapp knapp-sekundaer" onClick={() => setBekreftNullstill(true)}>
              Nullstill alt
            </button>
          ) : (
            <span className="bekreft">
              Slette all fremgang i denne nettleseren?
              <button
                type="button"
                className="knapp knapp-fare knapp-liten"
                onClick={() => {
                  nullstill();
                  setBekreftNullstill(false);
                  setMelding({ ok: true, tekst: "All fremgang er slettet." });
                }}
              >
                Ja, slett
              </button>
              <button type="button" className="knapp-tekst" onClick={() => setBekreftNullstill(false)}>
                Avbryt
              </button>
            </span>
          )}
        </div>
        {melding && (
          <p className={melding.ok ? "melding-ok" : "feilmelding"} role="status">
            {melding.tekst}
          </p>
        )}
        {visEksport && (
          <label className="tekstfelt">
            <span>Nedlasting er ikke tilgjengelig her. Kopier teksten og lagre den som en .json-fil:</span>
            <textarea readOnly rows={6} value={visEksport} onFocus={(e) => e.currentTarget.select()} />
          </label>
        )}
      </section>
    </div>
  );
}
