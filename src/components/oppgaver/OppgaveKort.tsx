import { useState } from "react";
import { Link } from "react-router";
import Html from "../Html";
import Figur from "../../figurer";
import OppgaveFigur from "../../figurer/OppgaveFigur";
import { finnDelkapittel } from "../../data/innhold";
import { registrerFasitSett, registrerForsok, useFremgang } from "../../store/fremgang";
import { NIVA_NAVN, TYPE_NAVN, type Oppgave } from "../../types";
import ValgOppgave from "./ValgOppgave";
import PastandOppgave from "./PastandOppgave";
import TallOppgave from "./TallOppgave";
import TekstOppgave from "./TekstOppgave";

export type Fase = "svarer" | "vurdert" | "fasit";

export interface TypeProps {
  o: Oppgave;
  fase: Fase;
  onFerdig: (score: number, svar: unknown) => void;
}

const TAG_NAVN: Record<string, string> = {
  prosjekt: "Prosjekt",
  "oving-1": "Øving 1",
  "oving-2": "Øving 2",
  "oving-3": "Øving 3",
  "prosjekt-4": "Prosjekt 4",
  kode: "Kode",
  figur: "Figur/tabell",
  case: "Case",
  regning: "Regning",
  sammenheng: "På tvers",
};

export default function OppgaveKort({ o, nummer, antall, onVurdert }: { o: Oppgave; nummer?: number; antall?: number; onVurdert?: (score: number) => void }) {
  const [fase, setFase] = useState<Fase>("svarer");
  const [score, setScore] = useState<number | null>(null);
  const [bekrefter, setBekrefter] = useState(false);
  const [runde, setRunde] = useState(0);
  const t = useFremgang();
  const tidligere = t.forsok[o.id]?.[0];
  const del = finnDelkapittel(o.del);

  const ferdig = (s: number, svar: unknown) => {
    setScore(s);
    setFase("vurdert");
    registrerForsok(o.id, s, "oving", svar);
    onVurdert?.(s);
  };

  const visFasit = () => {
    setFase("fasit");
    setBekrefter(false);
    registrerFasitSett(o.id);
  };

  const prov = () => {
    setFase("svarer");
    setScore(null);
    setRunde((r) => r + 1);
  };

  const props: TypeProps = { o, fase, onFerdig: ferdig };
  const resultat = score === null ? null : score >= 0.999 ? "riktig" : score > 0 ? "delvis" : "feil";

  return (
    <article className={`oppgave oppgave-${o.type} fase-${fase}`} aria-labelledby={`oppg-${o.id}`}>
      <header className="oppgave-hode">
        <p className="oppgave-meta" id={`oppg-${o.id}`}>
          {nummer !== undefined && (
            <span className="oppgave-nummer">
              Oppgave {nummer}
              {antall ? ` av ${antall}` : ""}
            </span>
          )}
          <span className="etikett">{TYPE_NAVN[o.type]}</span>
          <span className={`etikett niva-${o.niva}`}>{NIVA_NAVN[o.niva]}</span>
          {o.tags
            .filter((tg) => TAG_NAVN[tg])
            .map((tg) => (
              <span key={tg} className="etikett etikett-tag">
                {TAG_NAVN[tg]}
              </span>
            ))}
          <Link to={`/pensum/${o.del}`} className="oppgave-del">
            {o.del} {del?.tittel}
          </Link>
        </p>
        {o.kilde && <p className="oppgave-kilde">{/^\d/.test(o.kilde) ? `Fra forelesningsnotatene, avsnitt ${o.kilde}` : `Fra ${o.kilde}`}</p>}
        {tidligere && fase === "svarer" && (
          <p className="tidligere">
            Sist: {tidligere.score >= 0.999 ? "riktig" : tidligere.score > 0 ? `${Math.round(tidligere.score * 100)} %` : "feil"},{" "}
            {new Date(tidligere.t).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
          </p>
        )}
      </header>

      {o.figur?.navn && <Figur navn={o.figur.navn} />}
      {o.figur?.data && <OppgaveFigur data={o.figur.data} />}
      <Html html={o.sporsmalHtml} className="prosa oppgave-sporsmal" />

      <div key={runde}>
        {(o.type === "enkeltvalg" || o.type === "flervalg") && <ValgOppgave {...props} />}
        {o.type === "pastand" && <PastandOppgave {...props} />}
        {o.type === "tall" && <TallOppgave {...props} />}
        {o.type === "tekst" && <TekstOppgave {...props} />}
      </div>

      {fase !== "svarer" && (
        <section className={`fasit ${resultat ? `fasit-${resultat}` : "fasit-vist"}`} aria-live="polite">
          <p className="fasit-status">
            {resultat === "riktig" && (
              <>
                <IkonRiktig /> Riktig
              </>
            )}
            {resultat === "delvis" && (
              <>
                <IkonDelvis /> Delvis riktig, {Math.round((score ?? 0) * 100)} %
              </>
            )}
            {resultat === "feil" && (
              <>
                <IkonFeil /> Ikke riktig
              </>
            )}
            {fase === "fasit" && "Fasit (du svarte ikke, så forsøket er ikke registrert)"}
          </p>
          {o.forklaringHtml && <Html html={o.forklaringHtml} className="prosa fasit-forklaring" />}
          {o.losningHtml && (
            <div className="fasit-losning">
              <h4>Løsning steg for steg</h4>
              <Html html={o.losningHtml} className="prosa" />
            </div>
          )}
          <div className="husk">
            <h4>Husk til eksamen</h4>
            <Html html={o.huskHtml} as="p" />
          </div>
          <p className="fasit-lenker">
            <Link to={`/pensum/${o.del}`}>Les {o.del} igjen</Link>
            <button type="button" className="knapp-tekst" onClick={prov}>
              Prøv oppgaven på nytt
            </button>
          </p>
        </section>
      )}

      {fase === "svarer" && (
        <div className="vis-fasit">
          {!bekrefter ? (
            <button type="button" className="knapp-tekst" onClick={() => setBekrefter(true)}>
              Vis fasit uten å svare
            </button>
          ) : (
            <p className="bekreft">
              Vil du se fasit uten å prøve først? Forsøket registreres ikke.
              <button type="button" className="knapp knapp-liten knapp-sekundaer" onClick={visFasit}>
                Ja, vis fasit
              </button>
              <button type="button" className="knapp-tekst" onClick={() => setBekrefter(false)}>
                Nei, jeg prøver selv
              </button>
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export function IkonRiktig() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" className="ikon">
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path d="M5.5 10.5l3 3 6-7" fill="none" stroke="var(--surface)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function IkonFeil() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" className="ikon">
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path d="M6.5 6.5l7 7M13.5 6.5l-7 7" stroke="var(--surface)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
export function IkonDelvis() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" className="ikon">
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path d="M6 10h8" stroke="var(--surface)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
