import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import Laster from "../components/Laster";
import OppgaveKort from "../components/oppgaver/OppgaveKort";
import { prosent } from "../components/Mestring";
import { lastNotatquiz, useAsync, type NotatquizSett } from "../data/innhold";
import { stokk } from "../lib/tilfeldig";
import { useFremgang } from "../store/fremgang";
import type { Oppgave } from "../types";

// Kapitlene i forelesningsnotatene. Oppgavenes «kilde» starter med avsnittsnummeret, f.eks. «1.2.4 Evaluering».
const NOTATKAPITLER: { nr: number; tittel: string }[] = [
  { nr: 1, tittel: "Veiledet læring" },
  { nr: 2, tittel: "Nevrale nettverk" },
  { nr: 3, tittel: "Uveiledet læring" },
  { nr: 4, tittel: "Reinforcement learning" },
  { nr: 5, tittel: "Explainable AI" },
  { nr: 6, tittel: "AI Act" },
  { nr: 7, tittel: "Etiske prinsipper" },
];
const notatkap = (o: Oppgave) => Number(o.kilde?.match(/^(\d+)/)?.[1] ?? 0);

const SETT: Record<NotatquizSett, { tittel: string; kort: string; beskrivelse: string }> = {
  notater: {
    tittel: "Oppgavene i forelesningsnotatene",
    kort: "Notatoppgaver",
    beskrivelse:
      "Alle «Oppgave:»-ene i forelesningsnotatene, skrevet om slik at de kan besvares uten notatene ved siden av. Praktiske oppgaver (plott, kjør koden) er gjort om til spørsmål om poenget med dem.",
  },
  eksempler: {
    tittel: "Eksempler på eksamensspørsmål",
    kort: "Eksamenseksempler",
    beskrivelse:
      "De ti spørsmålene fra siste kapittel i notatene, «Spørsmål til diskusjon og eksamensforberedelse», med alternativene fra notatene og fasit med forklaring. Notatene presiserer at de ikke er en garanti for hvordan eksamen blir.",
  },
};

export default function Notatquiz() {
  const { sett } = useParams();
  if (sett === "notater" || sett === "eksempler") return <NotatquizOkt key={sett} sett={sett} />;
  return <NotatquizOversikt />;
}

function NotatquizOversikt() {
  const t = useFremgang();
  const notater = useAsync(() => lastNotatquiz("notater"), []);
  const eksempler = useAsync(() => lastNotatquiz("eksempler"), []);
  const besvart = (liste?: Oppgave[]) => (liste ? liste.filter((o) => t.forsok[o.id]).length : 0);

  return (
    <div className="side notatquiz">
      <header className="side-hode">
        <h1>Notatquiz</h1>
        <p className="ingress">
          Spørsmålene som står i forelesningsnotatene (versjonen fra 23. november 2026), samlet i to quizer. Fasit og forklaringer bygger på det notatene sier.
          Der notatene ikke gir svar, står det i oppgaven. Quizene er holdt utenfor oppgavebanken og eksamenssimuleringen.
        </p>
      </header>

      {(["notater", "eksempler"] as const).map((s) => {
        const liste = s === "notater" ? notater.data : eksempler.data;
        return (
          <section key={s} className="panel notatquiz-sett" aria-labelledby={`nq-${s}`}>
            <div>
              <h2 id={`nq-${s}`}>{SETT[s].tittel}</h2>
              <p>{SETT[s].beskrivelse}</p>
              {liste && (
                <p className="dempet">
                  {liste.length} oppgaver, {besvart(liste)} besvart.
                </p>
              )}
              {s === "notater" && liste && (
                <p className="notatquiz-kapitler">
                  <span className="dempet">Bare ett kapittel i notatene: </span>
                  {NOTATKAPITLER.map((k) => {
                    const n = liste.filter((o) => notatkap(o) === k.nr).length;
                    return n ? (
                      <Link key={k.nr} to={`/notatquiz/notater?kap=${k.nr}`} className="brikke-lenke" title={`${n} oppgaver`}>
                        {k.nr} {k.tittel}
                      </Link>
                    ) : null;
                  })}
                </p>
              )}
            </div>
            <div className="notatquiz-start">
              <Link to={`/notatquiz/${s}`} className="knapp">
                Start i notatenes rekkefølge
              </Link>
              <Link to={`/notatquiz/${s}?rekkefolge=tilfeldig`} className="knapp knapp-sekundaer">
                Tilfeldig rekkefølge
              </Link>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function NotatquizOkt({ sett }: { sett: NotatquizSett }) {
  const [params] = useSearchParams();
  const kap = Number(params.get("kap") ?? 0);
  const tilfeldig = params.get("rekkefolge") === "tilfeldig";
  const { data, feil } = useAsync(() => lastNotatquiz(sett), [sett]);
  const [indeks, setIndeks] = useState(0);
  const [resultater, setResultater] = useState<Record<string, number>>({});
  const [ferdig, setFerdig] = useState(false);

  const oppgaver = useMemo(() => {
    if (!data) return [];
    const utvalg = kap ? data.filter((o) => notatkap(o) === kap) : data;
    return tilfeldig ? stokk(utvalg) : utvalg;
  }, [data, kap, tilfeldig]);

  const tittel = SETT[sett].kort + (kap ? `, kapittel ${kap}: ${NOTATKAPITLER.find((k) => k.nr === kap)?.tittel ?? ""}` : "");

  if (feil) return <div className="side smal"><p>Klarte ikke å laste quizen.</p></div>;
  if (!data) return <Laster tekst="Laster quizen …" />;
  if (oppgaver.length === 0) {
    return (
      <div className="side smal">
        <h1>{tittel}</h1>
        <p>Ingen oppgaver passer valget ditt.</p>
        <Link to="/notatquiz" className="knapp">
          Tilbake til notatquizen
        </Link>
      </div>
    );
  }

  const besvart = Object.keys(resultater).length;
  const o = oppgaver[indeks];

  if (ferdig) {
    const snitt = besvart ? Object.values(resultater).reduce((a, b) => a + b, 0) / besvart : null;
    const perKilde = new Map<string, number[]>();
    for (const x of oppgaver) {
      if (!(x.id in resultater)) continue;
      const k = sett === "notater" ? `${notatkap(x)} ${NOTATKAPITLER.find((n) => n.nr === notatkap(x))?.tittel ?? ""}` : `${x.del}`;
      perKilde.set(k, [...(perKilde.get(k) ?? []), resultater[x.id]]);
    }
    const feilede = oppgaver.filter((x) => x.id in resultater && resultater[x.id] < 0.999);
    return (
      <div className="side smal okt-oppsummering">
        <h1>Quizen er ferdig</h1>
        <p className="ingress">
          {tittel}: du svarte på {besvart} av {oppgaver.length} oppgaver, og fikk {prosent(snitt)} riktig.
        </p>
        {perKilde.size > 0 && (
          <table className="tabell-enkel">
            <thead>
              <tr>
                <th>{sett === "notater" ? "Kapittel i notatene" : "Delkapittel i portalen"}</th>
                <th>Besvart</th>
                <th>Riktig</th>
              </tr>
            </thead>
            <tbody>
              {[...perKilde.entries()]
                .sort((a, b) => a[0].localeCompare(b[0], "nb", { numeric: true }))
                .map(([k, s]) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td>{s.length}</td>
                    <td>{prosent(s.reduce((a, b) => a + b, 0) / s.length)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
        {feilede.length > 0 && (
          <>
            <h2>Oppgaver du bør se på igjen</h2>
            <ul className="notatquiz-feilede">
              {feilede.map((x) => (
                <li key={x.id}>
                  <button
                    type="button"
                    className="knapp-tekst"
                    onClick={() => {
                      setIndeks(oppgaver.indexOf(x));
                      setFerdig(false);
                    }}
                  >
                    {x.id}
                  </button>{" "}
                  <span className="dempet">({x.kilde})</span> {x.kort}
                  {x.kort.length >= 170 ? " …" : ""}
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="handlinger">
          <button
            type="button"
            className="knapp"
            onClick={() => {
              const neste = oppgaver.findIndex((x) => !(x.id in resultater));
              setIndeks(neste >= 0 ? neste : 0);
              setFerdig(false);
            }}
          >
            Tilbake til oppgavene
          </button>
          <Link to="/notatquiz" className="knapp knapp-sekundaer">
            Til notatquizen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="side okt">
      <header className="okt-hode">
        <nav className="brodsmuler" aria-label="Brødsmulesti">
          <Link to="/notatquiz">Notatquiz</Link>
          <span aria-hidden="true">/</span>
          <span>{tittel}</span>
        </nav>
        <div className="okt-fremdrift">
          <ol className="okt-prikker" aria-label="Oppgaver i quizen">
            {oppgaver.map((x, i) => {
              const r = resultater[x.id];
              const kl = r === undefined ? "" : r >= 0.999 ? "riktig" : r > 0 ? "delvis" : "feil";
              return (
                <li key={x.id}>
                  <button
                    type="button"
                    className={`okt-prikk ${kl} ${i === indeks ? "gjeldende" : ""}`}
                    aria-label={`Oppgave ${i + 1}${r === undefined ? "" : `, ${kl}`}`}
                    aria-current={i === indeks}
                    onClick={() => setIndeks(i)}
                  >
                    {i + 1}
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="dempet">
            {besvart} av {oppgaver.length} besvart
          </p>
        </div>
      </header>

      {o && (
        <OppgaveKort
          key={o.id}
          o={o}
          nummer={indeks + 1}
          antall={oppgaver.length}
          onVurdert={(s) => setResultater((r) => ({ ...r, [o.id]: s }))}
        />
      )}

      <nav className="okt-nav" aria-label="Bla i oppgavene">
        <button type="button" className="knapp knapp-sekundaer" disabled={indeks === 0} onClick={() => setIndeks((i) => i - 1)}>
          Forrige
        </button>
        {indeks < oppgaver.length - 1 ? (
          <button type="button" className="knapp" onClick={() => setIndeks((i) => i + 1)}>
            Neste oppgave
          </button>
        ) : (
          <button type="button" className="knapp" onClick={() => setFerdig(true)}>
            Avslutt og se oppsummering
          </button>
        )}
        {indeks < oppgaver.length - 1 && besvart > 0 && (
          <button type="button" className="knapp-tekst" onClick={() => setFerdig(true)}>
            Avslutt quizen
          </button>
        )}
      </nav>
    </div>
  );
}
