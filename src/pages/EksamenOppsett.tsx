import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { prosent } from "../components/Mestring";
import { eksamensPool, lagEksamen, lagRekkefolge, STANDARD_OPPSETT, type EksamenOppsett, type SettValg } from "../lib/eksamen";
import { settAktivEksamen, settSisteOppsett, useFremgang } from "../store/fremgang";
import { formaterVarighet } from "../components/Nedtelling";

const TIDER: { min: number | null; navn: string }[] = [
  { min: 240, navn: "4 timer" },
  { min: 120, navn: "2 timer" },
  { min: 60, navn: "1 time" },
  { min: 30, navn: "30 min" },
  { min: null, navn: "Uten tid" },
];

export default function EksamenOppsettSide() {
  const t = useFremgang();
  const navigate = useNavigate();
  const [o, setO] = useState<EksamenOppsett>(t.sisteOppsett ?? STANDARD_OPPSETT);
  const [bekreftAvbryt, setBekreftAvbryt] = useState(false);
  const pool = eksamensPool();
  const antallEnkelt = pool.filter((p) => p.type === "enkeltvalg").length;
  const antallSporsmal = o.modus === "H25" ? 40 : o.antall;
  const endre = (endring: Partial<EksamenOppsett>) => setO((x) => ({ ...x, ...endring }));

  const start = () => {
    const sett = new Set(Object.keys(t.forsok));
    const sporsmal = lagEksamen(o, sett);
    const naa = Date.now();
    settSisteOppsett(o);
    settAktivEksamen({
      id: `e${naa.toString(36)}`,
      start: naa,
      frist: o.varighetMin ? naa + o.varighetMin * 60_000 : null,
      oppsett: o,
      sporsmal,
      rekkefolge: lagRekkefolge(sporsmal, naa % 2147483647),
      svar: {},
      flagget: [],
      gjeldende: 0,
    });
    navigate("/eksamen/pagar");
  };

  return (
    <div className="side eksamen-oppsett">
      <nav className="brodsmuler" aria-label="Brødsmulesti">
        <Link to="/trening">Eksamenstrening</Link>
        <span aria-hidden="true">/</span>
        <span>Eksamenssimulering</span>
      </nav>
      <header className="side-hode">
        <h1>Eksamenssimulering</h1>
        <p className="ingress">
          Som på eksamen 2024 og 2025 er alt flervalg, og regneoppgavene har svaralternativer. Du ser ikke fasit før du leverer. Spørsmålene trekkes fra{" "}
          {pool.length} eksamenslike spørsmål og fordeles over hele pensum.
        </p>
      </header>

      {t.aktivEksamen && (
        <div className="varsel varsel-info">
          <p>
            Du har allerede en eksamen i gang ({Object.keys(t.aktivEksamen.svar).length} av {t.aktivEksamen.sporsmal.length} besvart).
          </p>
          <div className="handlinger">
            <Link to="/eksamen/pagar" className="knapp">
              Fortsett eksamen
            </Link>
            {!bekreftAvbryt ? (
              <button type="button" className="knapp knapp-sekundaer" onClick={() => setBekreftAvbryt(true)}>
                Forkast den
              </button>
            ) : (
              <>
                <button type="button" className="knapp knapp-fare" onClick={() => settAktivEksamen(undefined)}>
                  Ja, forkast uten å levere
                </button>
                <button type="button" className="knapp-tekst" onClick={() => setBekreftAvbryt(false)}>
                  Avbryt
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="oppsett-rutenett">
        <section className="panel oppsett-valg" aria-labelledby="oppsett-tittel">
          <h2 id="oppsett-tittel">Oppsett</h2>

          <fieldset>
            <legend>Poengregler</legend>
            <label className="radiokort">
              <input type="radio" name="modus" checked={o.modus === "2026"} onChange={() => endre({ modus: "2026" })} />
              <span>
                <strong>Kunngjøringen for 2026</strong>
                Ett riktig svar: +1, feil gir −1/(k−1) slik at gjetting har forventning 0, blankt 0. Flere riktige: +1 per riktig kryss, −1 per feil kryss.
                Blanding av enkeltvalg og flervalg, og omtrent hvert tiende spørsmål handler om kode.
              </span>
            </label>
            <label className="radiokort">
              <input type="radio" name="modus" checked={o.modus === "H25"} onChange={() => endre({ modus: "H25" })} />
              <span>
                <strong>Som eksamen 2025</strong>
                Ti temagrupper med fire enkeltvalg, der siste gruppe er Python-kode som på H25. Riktig +2,5, feil −0,83, blankt 0. En gruppe kan ikke gi under 0. Maks 100 poeng.
              </span>
            </label>
          </fieldset>

          {o.modus === "2026" && (
            <fieldset>
              <legend>Antall spørsmål</legend>
              <div className="segmentert" role="group">
                {[40, 20, 10].map((n) => (
                  <button key={n} type="button" aria-pressed={o.antall === n} onClick={() => endre({ antall: n })}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="dempet">40 er like mange som på eksamen 2024 og 2025. Færre spørsmål fordeles likt over kapitlene.</p>
            </fieldset>
          )}

          <fieldset>
            <legend>Tid</legend>
            <div className="segmentert" role="group">
              {TIDER.map((tid) => (
                <button key={tid.navn} type="button" aria-pressed={o.varighetMin === tid.min} onClick={() => endre({ varighetMin: tid.min })}>
                  {tid.navn}
                </button>
              ))}
            </div>
            <p className="dempet">
              Eksamen 2025 varte i 4 timer for 40 spørsmål, altså 6 minutter per spørsmål.
              {o.varighetMin && ` Med ${antallSporsmal} spørsmål gir valget ${formaterVarighet((o.varighetMin * 60_000) / antallSporsmal)} per spørsmål.`} Når tiden er ute,
              leveres eksamen automatisk.
            </p>
          </fieldset>

          <fieldset>
            <legend>Spørsmålssett</legend>
            <div className="segmentert" role="group">
              {(["tilfeldig", "A", "B", "C"] as SettValg[]).map((s) => (
                <button key={s} type="button" aria-pressed={o.sett === s} onClick={() => endre({ sett: s })}>
                  {s === "tilfeldig" ? "Tilfeldig" : `Sett ${s}`}
                </button>
              ))}
            </div>
            <p className="dempet">
              Sett A, B og C trekkes alltid likt, så du kan sammenligne resultatene dine over tid. Et tilfeldig sett er nytt hver gang.
            </p>
            {o.sett === "tilfeldig" && (
              <label className="bryter">
                <input type="checkbox" checked={o.prioriterUsette} onChange={(e) => endre({ prioriterUsette: e.target.checked })} />
                <span>Velg helst spørsmål jeg ikke har sett før</span>
              </label>
            )}
          </fieldset>

          <fieldset>
            <legend>Inspera-regelen</legend>
            <label className="bryter">
              <input type="checkbox" checked={o.inspera} onChange={(e) => endre({ inspera: e.target.checked })} />
              <span>Enkeltvalg kan ikke gjøres blanke igjen (som på eksamen)</span>
            </label>
            <p className="dempet">
              Når du skal velge ett alternativ, kan du bytte svar, men ikke gå tilbake til blankt etter at du har svart. På flervalg kan du krysse av og fjerne kryss fritt, også helt til ingen kryss.
            </p>
          </fieldset>

          <div className="svarlinje">
            <button type="button" className="knapp knapp-stor" onClick={start} disabled={pool.length === 0 || Boolean(t.aktivEksamen)}>
              Start eksamen
            </button>
            {t.aktivEksamen && <span className="dempet">Fortsett eller forkast eksamenen som er i gang først.</span>}
            {o.modus === "H25" && antallEnkelt < 40 && <span className="dempet">Banken har bare {antallEnkelt} enkeltvalg, så noen grupper fylles fra andre temaer.</span>}
          </div>
        </section>

        <aside className="oppsett-side">
          <section className="panel">
            <h2>Taktikk med minuspoeng</h2>
            <p>
              Med fire alternativer gir et feil svar −1/3. Gjetter du helt tilfeldig, er forventet poeng 0. Kan du utelukke ett alternativ, er gjetting
              mellom de tre som er igjen verdt 1/3 − (2/3)·(1/3) = 1/9 ≈ +0,11 i snitt. Kan du utelukke to, er det 1/2 − (1/2)·(1/3) = 1/3 ≈ +0,33.
            </p>
            <p>Simuleringen viser hvor mye du tapte på feil svar, så du kan se om du gjetter for mye eller for lite.</p>
          </section>
          {t.eksamener.length > 0 && (
            <section className="panel">
              <h2>Tidligere forsøk</h2>
              <ul className="historikk">
                {t.eksamener.slice(0, 8).map((e) => (
                  <li key={e.id}>
                    <Link to={`/eksamen/resultat/${e.id}`}>
                      <span>{new Date(e.slutt).toLocaleDateString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      <span>
                        {e.oppsett.modus === "H25" ? "H25" : "2026"}, {e.sporsmal.length} spm.
                        {e.oppsett.sett !== "tilfeldig" && `, sett ${e.oppsett.sett}`}
                      </span>
                      <strong>
                        {prosent(e.prosent)} ({e.karakter})
                      </strong>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
