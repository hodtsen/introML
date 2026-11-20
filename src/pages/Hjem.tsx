import { Link } from "react-router";
import Mestringskart, { Fargeforklaring, prosent } from "../components/Mestring";
import { ALLE_DELKAPITLER, KAPITLER, OPPGAVER, finnDelkapittel } from "../data/innhold";
import { feiledeOppgaver, samletMestring, svakesteDeler } from "../lib/mestring";
import { useFremgang } from "../store/fremgang";

export default function Hjem() {
  const t = useFremgang();
  const sist = t.sistBesokt ? finnDelkapittel(t.sistBesokt) : undefined;
  const samlet = samletMestring(t);
  const antLest = Object.keys(t.lest).length;
  const svake = svakesteDeler(t, 3);
  const feilede = feiledeOppgaver(t).length;
  const sisteEksamen = t.eksamener[0];

  return (
    <div className="side hjem">
      <section className="hjem-hode">
        <div className="hjem-tittel">
          <h1>Introduksjon til maskinlæring</h1>
          <p className="hjem-ingress">
            Eksamensportal for TDT4172. Hele pensum i {KAPITLER.length} kapitler og {ALLE_DELKAPITLER.length} delkapitler, {OPPGAVER.length} øvingsoppgaver med
            fasit og forklaring, og eksamenssimulering etter reglene for 2026.
          </p>
        </div>
        <div className="hjem-tall" aria-label="Din fremgang">
          <p>
            <strong>{antLest}</strong> av {ALLE_DELKAPITLER.length} delkapitler lest
          </p>
          <p>
            <strong>{samlet.forsokte}</strong> av {samlet.totalt} oppgaver forsøkt
          </p>
          <p>
            <strong>{prosent(samlet.mestring)}</strong> riktig på det du har forsøkt
          </p>
        </div>
      </section>

      <section className="hjem-kart" aria-labelledby="kart-tittel">
        <div className="seksjonshode">
          <h2 id="kart-tittel">Mestringskart</h2>
          <p>Hver rute er et delkapittel. Fargen viser hvor godt du gjør det på oppgavene der. Trykk på en rute for å lese.</p>
        </div>
        <Mestringskart />
        <Fargeforklaring />
      </section>

      <section className="hjem-videre" aria-label="Neste steg">
        <div className="videre-kort">
          <h2>Fortsett å lese</h2>
          {sist ? (
            <>
              <p>
                Du var sist på <strong>{sist.nr} {sist.tittel}</strong>.
              </p>
              <Link to={`/pensum/${sist.nr}`} className="knapp">
                Fortsett på {sist.nr}
              </Link>
            </>
          ) : (
            <>
              <p>Start med kapittel 1. Det bygger maskinlæringsprosessen fra bunnen, og nesten alt der går igjen senere.</p>
              <Link to="/pensum/1.1" className="knapp">
                Begynn med 1.1
              </Link>
            </>
          )}
        </div>
        <div className="videre-kort">
          <h2>Øv der du er svakest</h2>
          {svake.length > 0 ? (
            <ul className="enkel-liste">
              {svake.map((d) => (
                <li key={d.nr}>
                  <Link to={`/trening/okt?del=${d.nr}`}>
                    {d.nr} {d.tittel}
                  </Link>{" "}
                  <span className="dempet">{prosent(d.m.mestring)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Når du har svart på noen oppgaver, dukker temaene du bør jobbe mer med opp her.</p>
          )}
          <div className="handlinger">
            <Link to="/trening" className="knapp knapp-sekundaer">
              Velg oppgaver
            </Link>
            {feilede > 0 && (
              <Link to="/trening/okt?modus=feilede" className="knapp knapp-sekundaer">
                Repeter {feilede} feilede
              </Link>
            )}
          </div>
        </div>
        <div className="videre-kort">
          <h2>Eksamenssimulering</h2>
          <p>40 spørsmål fra hele pensum, med klokke, Inspera-regelen og negative poeng for feil svar.</p>
          {sisteEksamen && (
            <p className="dempet">
              Siste forsøk: {prosent(sisteEksamen.prosent)}, karakter {sisteEksamen.karakter}.{" "}
              <Link to={`/eksamen/resultat/${sisteEksamen.id}`}>Se rapporten</Link>
            </p>
          )}
          <Link to="/eksamen" className="knapp">
            Sett opp en eksamen
          </Link>
        </div>
      </section>

      <section className="hjem-format" aria-labelledby="format-tittel">
        <h2 id="format-tittel">Slik er eksamen</h2>
        <dl className="faktaliste">
          <div>
            <dt>Oppgavetype</dt>
            <dd>Bare flervalg. Regneoppgaver er gjort om til svaralternativer (kunngjøring 2026).</dd>
          </div>
          <div>
            <dt>Ett riktig svar</dt>
            <dd>+1 for riktig. Feil gir trekk slik at gjetting har forventning 0, for eksempel −0,25 med fem alternativer. Blankt gir 0.</dd>
          </div>
          <div>
            <dt>Flere riktige svar</dt>
            <dd>+1 for hvert riktige kryss, −1 for hvert feil kryss. Et riktig alternativ du lar stå tomt, koster ingenting.</dd>
          </div>
          <div>
            <dt>Valgte svar</dt>
            <dd>Et alternativ du har valgt, kan ikke velges bort igjen. Er du usikker, la spørsmålet stå blankt.</dd>
          </div>
          <div>
            <dt>Hjelpemidler</dt>
            <dd>Ingen trykte eller håndskrevne hjelpemidler, bestemt enkel kalkulator (kode D i 2024).</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
