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
// Prosjektene. Oppgavenes «kilde» starter med prosjektnavnet, f.eks. «Øving 2, problem 1: …».
const PROSJEKTER: { nokkel: string; tittel: string }[] = [
  { nokkel: "Øving 1", tittel: "Øving 1: lineær og logistisk regresjon" },
  { nokkel: "Øving 2", tittel: "Øving 2: beslutningstrær og Bayes" },
  { nokkel: "Øving 3", tittel: "Øving 3: nevrale nett og uveiledet læring" },
  { nokkel: "Prosjekt 4 RL", tittel: "Prosjekt 4: reinforcement learning" },
  { nokkel: "Prosjekt 4 XAI", tittel: "Prosjekt 4: forklarbar KI" },
];

interface Gruppe {
  nokkel: string;
  lenketekst: string;
  tittel: string;
}
interface SettInfo {
  tittel: string;
  kort: string;
  beskrivelse: string;
  grupperTekst?: string;
  grupper?: Gruppe[];
  gruppeAv?: (o: Oppgave) => string;
  oppsummering: string;
}

const SETT: Record<NotatquizSett, SettInfo> = {
  notater: {
    tittel: "Oppgavene i forelesningsnotatene",
    kort: "Notatoppgaver",
    beskrivelse:
      "Alle «Oppgave:»-ene i forelesningsnotatene, skrevet om slik at de kan besvares uten notatene ved siden av. Praktiske oppgaver (plott, kjør koden) er gjort om til spørsmål om poenget med dem.",
    grupperTekst: "Bare ett kapittel i notatene:",
    grupper: NOTATKAPITLER.map((k) => ({ nokkel: String(k.nr), lenketekst: `${k.nr} ${k.tittel}`, tittel: `kapittel ${k.nr}: ${k.tittel}` })),
    gruppeAv: (o) => o.kilde?.match(/^(\d+)/)?.[1] ?? "",
    oppsummering: "Kapittel i notatene",
  },
  prosjekter: {
    tittel: "Spørsmålene i øvingene og prosjektet",
    kort: "Prosjektspørsmål",
    beskrivelse:
      "Spørsmålene (❓) fra øving 1–3 og prosjekt 4 (reinforcement learning og forklarbar KI), skrevet om med koden, dataene og tallene som trengs. Øving 1 har ingen ❓-spørsmål i materialet, så der er spørsmålene laget ut fra kodeskjelettet og datasettene.",
    grupperTekst: "Bare ett prosjekt:",
    grupper: PROSJEKTER.map((p) => ({ nokkel: p.nokkel, lenketekst: p.tittel, tittel: p.tittel })),
    gruppeAv: (o) => PROSJEKTER.find((p) => o.kilde?.startsWith(p.nokkel))?.nokkel ?? "",
    oppsummering: "Prosjekt",
  },
  eksempler: {
    tittel: "Eksempler på eksamensspørsmål",
    kort: "Eksamenseksempler",
    beskrivelse:
      "De ti spørsmålene fra siste kapittel i notatene, «Spørsmål til diskusjon og eksamensforberedelse», med alternativene fra notatene og fasit med forklaring. Notatene presiserer at de ikke er en garanti for hvordan eksamen blir.",
    oppsummering: "Delkapittel i portalen",
  },
};
const REKKEFOLGE: NotatquizSett[] = ["notater", "prosjekter", "eksempler"];

export default function Notatquiz() {
  const { sett } = useParams();
  if (sett && (REKKEFOLGE as string[]).includes(sett)) return <NotatquizOkt key={sett} sett={sett as NotatquizSett} />;
  return <NotatquizOversikt />;
}

function NotatquizOversikt() {
  const t = useFremgang();
  const notater = useAsync(() => lastNotatquiz("notater"), []);
  const prosjekter = useAsync(() => lastNotatquiz("prosjekter"), []);
  const eksempler = useAsync(() => lastNotatquiz("eksempler"), []);
  const data: Record<NotatquizSett, Oppgave[] | undefined> = { notater: notater.data, prosjekter: prosjekter.data, eksempler: eksempler.data };
  const besvart = (liste?: Oppgave[]) => (liste ? liste.filter((o) => t.forsok[o.id]).length : 0);

  return (
    <div className="side notatquiz">
      <header className="side-hode">
        <h1>Notatquiz</h1>
        <p className="ingress">
          Spørsmålene som står i forelesningsnotatene (versjonen fra 23. november 2026) og i øvingene og prosjektet, samlet i tre quizer. Fasit og forklaringer
          bygger på notatene, koden og dataene. Der kildene ikke gir svar, står det i oppgaven. Quizene er holdt utenfor oppgavebanken og eksamenssimuleringen.
        </p>
      </header>

      {REKKEFOLGE.map((s) => {
        const info = SETT[s];
        const liste = data[s];
        return (
          <section key={s} className="panel notatquiz-sett" aria-labelledby={`nq-${s}`}>
            <div>
              <h2 id={`nq-${s}`}>{info.tittel}</h2>
              <p>{info.beskrivelse}</p>
              {liste && (
                <p className="dempet">
                  {liste.length} oppgaver, {besvart(liste)} besvart.
                </p>
              )}
              {info.grupper && info.gruppeAv && liste && (
                <p className="notatquiz-kapitler">
                  <span className="dempet">{info.grupperTekst} </span>
                  {info.grupper.map((g) => {
                    const n = liste.filter((o) => info.gruppeAv!(o) === g.nokkel).length;
                    return n ? (
                      <Link key={g.nokkel} to={`/notatquiz/${s}?gruppe=${encodeURIComponent(g.nokkel)}`} className="brikke-lenke" title={`${n} oppgaver`}>
                        {g.lenketekst}
                      </Link>
                    ) : null;
                  })}
                </p>
              )}
            </div>
            <div className="notatquiz-start">
              <Link to={`/notatquiz/${s}`} className="knapp">
                {s === "prosjekter" ? "Start i prosjektenes rekkefølge" : "Start i notatenes rekkefølge"}
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
  const info = SETT[sett];
  const gruppe = params.get("gruppe") ?? "";
  const gruppeInfo = info.grupper?.find((g) => g.nokkel === gruppe);
  const tilfeldig = params.get("rekkefolge") === "tilfeldig";
  const { data, feil } = useAsync(() => lastNotatquiz(sett), [sett]);
  const [indeks, setIndeks] = useState(0);
  const [resultater, setResultater] = useState<Record<string, number>>({});
  const [ferdig, setFerdig] = useState(false);

  const oppgaver = useMemo(() => {
    if (!data) return [];
    const utvalg = gruppe && info.gruppeAv ? data.filter((o) => info.gruppeAv!(o) === gruppe) : data;
    return tilfeldig ? stokk(utvalg) : utvalg;
  }, [data, gruppe, tilfeldig, info]);

  const tittel = info.kort + (gruppeInfo ? `, ${gruppeInfo.tittel}` : "");

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
      const nokkel = info.gruppeAv?.(x);
      const k = nokkel ? (info.grupper?.find((g) => g.nokkel === nokkel)?.lenketekst ?? nokkel) : x.del;
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
                <th>{info.oppsummering}</th>
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
