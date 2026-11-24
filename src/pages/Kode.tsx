import { Link, useSearchParams } from "react-router";
import Html from "../components/Html";
import Laster from "../components/Laster";
import { finnDelkapittel, KAPITLER, lastKode, OPPGAVER, useAsync } from "../data/innhold";
import type { KodeKort, KodeTema } from "../types";

const KODEOPPGAVER = OPPGAVER.filter((o) => o.tags.includes("kode"));
const antallKodeoppgaver = (kap?: number) => KODEOPPGAVER.filter((o) => kap === undefined || o.kap === kap).length;

// Hash-ruting gjør at vanlige #-lenker ikke kan brukes til å hoppe innad på siden.
function hoppTil(slug: string) {
  document.getElementById(`kort-${slug}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Kode() {
  const [params, setParams] = useSearchParams();
  const { data, feil } = useAsync(() => lastKode(), []);
  const valgt = params.get("tema") ?? "oversikt";
  const tema = data?.temaer.find((t) => String(t.kap) === valgt);
  const velg = (v: string) => {
    setParams(v === "oversikt" ? {} : { tema: v }, { replace: true });
    window.scrollTo(0, 0);
  };

  return (
    <div className="side kode">
      <header className="side-hode">
        <h1>Kode</h1>
        <p className="ingress">
          De viktigste kodebitene i pensum, med hva de gjør og hvilke feil som typisk brukes som feilalternativer. Eksamen ber deg lese korte
          kodesnutter, ikke skrive kode, så her er det korte linjer og hvorfor de er riktige eller gale som teller.
        </p>
      </header>

      {feil && <p>Klarte ikke å laste kodekortene.</p>}
      {!data && !feil && <Laster tekst="Laster kodekortene …" />}

      {data && (
        <>
          <div className="fanerad" role="tablist" aria-label="Velg tema">
            <button type="button" role="tab" aria-selected={!tema} className={!tema ? "aktiv" : ""} onClick={() => velg("oversikt")}>
              <span className="fane-tittel">Oversikt og quiz</span>
            </button>
            {data.temaer.map((t) => (
              <button
                key={t.kap}
                type="button"
                role="tab"
                aria-selected={tema?.kap === t.kap}
                className={tema?.kap === t.kap ? "aktiv" : ""}
                onClick={() => velg(String(t.kap))}
              >
                <span className="fane-nr">{t.kap}</span>
                <span className="fane-tittel">{KAPITLER.find((k) => k.nr === t.kap)?.tittel ?? t.tittel}</span>
              </button>
            ))}
          </div>

          <div role="tabpanel">
            {tema ? (
              <TemaVisning tema={tema} temaer={data.temaer} onVelg={velg} />
            ) : (
              <Oversikt html={data.oversiktHtml} temaer={data.temaer} onVelg={velg} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function QuizPanel({ kap }: { kap?: number }) {
  const n = antallKodeoppgaver(kap);
  const k = kap ? KAPITLER.find((x) => x.nr === kap) : undefined;
  const sok = kap ? `?kap=${kap}` : "";
  return (
    <section className="panel notatquiz-sett kodequiz" aria-labelledby={`kodequiz-${kap ?? "alle"}`}>
      <div>
        <h2 id={`kodequiz-${kap ?? "alle"}`}>{k ? `Kodequiz for kapittel ${k.nr}` : "Kodequiz"}</h2>
        <p>
          {n} {n === 1 ? "oppgave" : "oppgaver"} om å lese, rette og velge kode
          {k ? ` i ${k.tittel.toLowerCase()}` : " fra hele pensum"}. Fasit og forklaring for hvert alternativ vises etter at du har svart, og
          resultatene teller i mestringskartet.
        </p>
      </div>
      <div className="notatquiz-start">
        <Link to={`/kode/quiz${sok}`} className="knapp">
          Start kodequizen
        </Link>
        <Link to={`/kode/quiz${sok ? `${sok}&` : "?"}rekkefolge=tilfeldig`} className="knapp knapp-sekundaer">
          Tilfeldig rekkefølge
        </Link>
      </div>
    </section>
  );
}

function Oversikt({ html, temaer, onVelg }: { html: string; temaer: KodeTema[]; onVelg: (v: string) => void }) {
  return (
    <>
      <QuizPanel />
      <p className="kodequiz-kapitler">
        <span className="dempet">Bare ett kapittel: </span>
        {temaer.map((t) => {
          const n = antallKodeoppgaver(t.kap);
          return n ? (
            <Link key={t.kap} to={`/kode/quiz?kap=${t.kap}`} className="brikke-lenke" title={`${n} oppgaver`}>
              {t.kap} {KAPITLER.find((k) => k.nr === t.kap)?.tittel} ({n})
            </Link>
          ) : null;
        })}
      </p>

      <div className="kode-oversikt">
        <Html className="prosa kode-intro" html={html} />
        <nav className="panel kode-register" aria-labelledby="kode-register-tittel">
          <h2 id="kode-register-tittel">Alle kodekortene</h2>
          {temaer.map((t) => (
            <div key={t.kap} className="kode-register-tema">
              <h3>
                <button type="button" className="knapp-tekst" onClick={() => onVelg(String(t.kap))}>
                  {t.kap} {t.tittel}
                </button>
              </h3>
              <ul>
                {t.kort.map((k) => (
                  <li key={k.slug}>
                    <button
                      type="button"
                      className="knapp-tekst"
                      onClick={() => {
                        onVelg(String(t.kap));
                        setTimeout(() => hoppTil(k.slug), 50);
                      }}
                    >
                      {k.tittel}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}

function TemaVisning({ tema, temaer, onVelg }: { tema: KodeTema; temaer: KodeTema[]; onVelg: (v: string) => void }) {
  const i = temaer.indexOf(tema);
  const forrige = temaer[i - 1];
  const neste = temaer[i + 1];
  return (
    <>
      <header className="kode-tema-hode">
        <h2>
          Kapittel {tema.kap}: {tema.tittel}
        </h2>
        <Html as="p" className="ingress" html={tema.ingressHtml} />
        <nav aria-label="Kodekort i dette kapittelet" className="kode-innhold">
          <span className="dempet">Kortene: </span>
          {tema.kort.map((k) => (
            <button key={k.slug} type="button" className="brikke-lenke" onClick={() => hoppTil(k.slug)}>
              {k.tittel}
            </button>
          ))}
        </nav>
      </header>

      {tema.kort.map((k) => (
        <Kodekort key={k.slug} kort={k} />
      ))}

      {antallKodeoppgaver(tema.kap) > 0 && <QuizPanel kap={tema.kap} />}

      <nav className="kode-bla" aria-label="Bla mellom kapitlene">
        {forrige ? (
          <button type="button" className="knapp knapp-sekundaer" onClick={() => onVelg(String(forrige.kap))}>
            ← {forrige.kap} {KAPITLER.find((k) => k.nr === forrige.kap)?.tittel}
          </button>
        ) : (
          <button type="button" className="knapp knapp-sekundaer" onClick={() => onVelg("oversikt")}>
            ← Oversikt og quiz
          </button>
        )}
        {neste && (
          <button type="button" className="knapp knapp-sekundaer" onClick={() => onVelg(String(neste.kap))}>
            {neste.kap} {KAPITLER.find((k) => k.nr === neste.kap)?.tittel} →
          </button>
        )}
      </nav>
    </>
  );
}

function Kodekort({ kort }: { kort: KodeKort }) {
  return (
    <article className="kodekort panel" id={`kort-${kort.slug}`} aria-labelledby={`kort-${kort.slug}-tittel`}>
      <header className="kodekort-hode">
        <h3 id={`kort-${kort.slug}-tittel`}>{kort.tittel}</h3>
        <p className="kodekort-meta">
          <span className="dempet">Pensum: </span>
          {kort.deler.map((d, i) => (
            <span key={d}>
              {i > 0 && ", "}
              <Link to={`/pensum/${d}`}>
                {d} {finnDelkapittel(d)?.tittel}
              </Link>
            </span>
          ))}
          {kort.kildeHtml && (
            <>
              <span className="dempet"> · Kilder: </span>
              <Html as="span" html={kort.kildeHtml} />
            </>
          )}
        </p>
      </header>
      <Html className="prosa kodekort-kode" html={kort.kodeHtml} />
      <section className="kodekort-del">
        <h4>Hva koden gjør</h4>
        <Html className="prosa" html={kort.forklaringHtml} />
      </section>
      <section className="kodekort-del kodekort-fallgruver">
        <h4>Fallgruver</h4>
        <Html className="prosa" html={kort.fallgruverHtml} />
      </section>
      {kort.ovingerHtml && (
        <section className="kodekort-del kodekort-ovinger">
          <h4>Fra øvingene</h4>
          <Html className="prosa" html={kort.ovingerHtml} />
        </section>
      )}
    </article>
  );
}
