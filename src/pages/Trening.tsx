import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mestringsstolpe, mestringTekst, prosent } from "../components/Mestring";
import { KAPITLER, OPPGAVER } from "../data/innhold";
import { delMestring, feiledeOppgaver, kapMestring } from "../lib/mestring";
import { eksamensPool } from "../lib/eksamen";
import { useFremgang } from "../store/fremgang";
import { NIVA_NAVN, TYPE_NAVN, type Niva, type OppgaveType } from "../types";

const NIVAER = Object.keys(NIVA_NAVN) as Niva[];
const TYPER = Object.keys(TYPE_NAVN) as OppgaveType[];

export default function Trening() {
  const t = useFremgang();
  const navigate = useNavigate();
  const [apneKap, setApneKap] = useState<number | null>(null);
  const [kaps, setKaps] = useState<number[]>(KAPITLER.map((k) => k.nr));
  const [nivaer, setNivaer] = useState<Niva[]>(NIVAER);
  const [typer, setTyper] = useState<OppgaveType[]>(TYPER);
  const [antall, setAntall] = useState(10);
  const [nye, setNye] = useState(false);
  const feilede = feiledeOppgaver(t);
  const pool = eksamensPool().length;

  const tilgjengelig = OPPGAVER.filter((o) => kaps.includes(o.kap) && nivaer.includes(o.niva) && typer.includes(o.type) && (!nye || !t.forsok[o.id])).length;

  const veksle = <T,>(liste: T[], v: T, sett: (l: T[]) => void) => sett(liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v]);

  const startBlandet = () => {
    const p = new URLSearchParams({ modus: "blandet", kap: kaps.join(","), niva: nivaer.join(","), type: typer.join(","), antall: String(antall) });
    if (nye) p.set("nye", "1");
    navigate(`/trening/okt?${p}`);
  };

  const perType = TYPER.map((ty) => [ty, OPPGAVER.filter((o) => o.type === ty).length] as const);

  return (
    <div className="side trening">
      <header className="side-hode">
        <h1>Eksamenstrening</h1>
        <p className="ingress">
          {OPPGAVER.length} oppgaver på tre nivåer: {perType.map(([ty, n]) => `${n} ${TYPE_NAVN[ty].toLowerCase()}`).join(", ")}. Du svarer først, så
          får du fasit, forklaring på hvert alternativ og det du må huske til eksamen.
        </p>
      </header>

      <section className="trening-eksamen">
        <div>
          <h2>Eksamenssimulering</h2>
          <p>
            40 flervalgsspørsmål fra hele pensum med klokke og eksamensreglene for 2026. Trekkes fra {pool} eksamenslike spørsmål. Du får rapport med poeng,
            karakteranslag og hvilke temaer du bør øve mer på.
          </p>
        </div>
        <Link to="/eksamen" className="knapp">
          Sett opp eksamen
        </Link>
      </section>

      <div className="trening-kolonner">
        <section className="trening-tema" aria-labelledby="tema-tittel">
          <h2 id="tema-tittel">Øv etter tema</h2>
          <ol className="temaliste">
            {KAPITLER.map((k) => {
              const km = kapMestring(k.nr, t);
              const apen = apneKap === k.nr;
              return (
                <li key={k.nr} className={apen ? "apen" : ""}>
                  <div className="tema-kap">
                    <button type="button" className="tema-veksle" aria-expanded={apen} onClick={() => setApneKap(apen ? null : k.nr)}>
                      <span className="tema-nr">{k.nr}</span>
                      <span className="tema-tittel">{k.tittel}</span>
                      <span className="tema-meta">
                        <Mestringsstolpe verdi={km.mestring} />
                        <span className="dempet">{km.totalt} oppg.</span>
                      </span>
                    </button>
                    <Link to={`/trening/okt?kap=${k.nr}`} className="knapp knapp-liten knapp-sekundaer">
                      Øv på kapittel {k.nr}
                    </Link>
                  </div>
                  {apen && (
                    <ul className="tema-deler">
                      {k.delkapitler.map((d) => {
                        const m = delMestring(d.nr, t);
                        return (
                          <li key={d.nr}>
                            <Link to={`/trening/okt?del=${d.nr}`}>
                              <span className="tema-del-nr">{d.nr}</span>
                              <span className="tema-del-tittel">{d.tittel}</span>
                              <span className="tema-del-meta">
                                <Mestringsstolpe verdi={m.mestring} />
                                <span className="dempet">{mestringTekst(m)}</span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <div className="trening-side">
          <section className="panel" aria-labelledby="blandet-tittel">
            <h2 id="blandet-tittel">Blandet øving</h2>
            <p className="dempet">Oppgaver på tvers av kapitler, i tilfeldig rekkefølge.</p>
            <fieldset>
              <legend>Kapitler</legend>
              <div className="brikker">
                {KAPITLER.map((k) => (
                  <label key={k.nr} className="brikke" title={k.tittel}>
                    <input type="checkbox" checked={kaps.includes(k.nr)} onChange={() => veksle(kaps, k.nr, setKaps)} />
                    <span>{k.nr}</span>
                  </label>
                ))}
              </div>
              <div className="brikke-handlinger">
                <button type="button" className="knapp-tekst" onClick={() => setKaps(KAPITLER.map((k) => k.nr))}>
                  Alle
                </button>
                <button type="button" className="knapp-tekst" onClick={() => setKaps([])}>
                  Ingen
                </button>
              </div>
            </fieldset>
            <fieldset>
              <legend>Nivå</legend>
              <div className="brikker">
                {NIVAER.map((n) => (
                  <label key={n} className="brikke">
                    <input type="checkbox" checked={nivaer.includes(n)} onChange={() => veksle(nivaer, n, setNivaer)} />
                    <span>{NIVA_NAVN[n]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Oppgavetyper</legend>
              <div className="brikker">
                {TYPER.map((ty) => (
                  <label key={ty} className="brikke">
                    <input type="checkbox" checked={typer.includes(ty)} onChange={() => veksle(typer, ty, setTyper)} />
                    <span>{TYPE_NAVN[ty]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Antall oppgaver</legend>
              <div className="segmentert" role="group">
                {[5, 10, 20, 40].map((n) => (
                  <button key={n} type="button" aria-pressed={antall === n} onClick={() => setAntall(n)}>
                    {n}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="bryter">
              <input type="checkbox" checked={nye} onChange={(e) => setNye(e.target.checked)} />
              <span>Bare oppgaver jeg ikke har gjort</span>
            </label>
            <div className="svarlinje">
              <button type="button" className="knapp" disabled={tilgjengelig === 0} onClick={startBlandet}>
                Start {Math.min(antall, tilgjengelig)} oppgaver
              </button>
              <span className="dempet">{tilgjengelig} passer valgene</span>
            </div>
          </section>

          <section className="panel" aria-labelledby="kode-tittel">
            <h2 id="kode-tittel">Kode og figurer</h2>
            <p className="dempet">
              Eksamen har hatt spørsmål om Python-kode (H24 og H25) og om å lese plott (H24). Øv på dem samlet. Kodebitene med forklaring og
              fallgruver finner du i <Link to="/kode">Kode-fanen</Link>.
            </p>
            <div className="knapperad">
              <Link to="/trening/okt?modus=tag&tag=kode" className="knapp knapp-sekundaer">
                {OPPGAVER.filter((o) => o.tags.includes("kode")).length} kodeoppgaver
              </Link>
              <Link to="/trening/okt?modus=tag&tag=figur" className="knapp knapp-sekundaer">
                {OPPGAVER.filter((o) => o.tags.includes("figur")).length} figurer og tabeller
              </Link>
            </div>
          </section>

          <section className="panel" aria-labelledby="repeter-tittel">
            <h2 id="repeter-tittel">Repeter feil</h2>
            {feilede.length > 0 ? (
              <>
                <p>
                  {feilede.length} oppgaver der siste forsøk ikke var helt riktig. Å gjøre dem på nytt er den raskeste veien til å tette hull.
                </p>
                <Link to="/trening/okt?modus=feilede" className="knapp knapp-sekundaer">
                  Repeter {feilede.length} oppgaver
                </Link>
              </>
            ) : (
              <p className="dempet">Oppgaver du svarer feil eller delvis riktig på, samles her.</p>
            )}
          </section>

          <section className="panel">
            <h2>Samlet</h2>
            <p>
              {prosent(
                (() => {
                  const ider = OPPGAVER.map((o) => o.id).filter((id) => t.forsok[id]);
                  return ider.length ? ider.reduce((s, id) => s + (t.forsok[id][0]?.score ?? 0), 0) / ider.length : null;
                })()
              )}{" "}
              riktig på siste forsøk, {OPPGAVER.filter((o) => t.forsok[o.id]).length} av {OPPGAVER.length} oppgaver gjort.
            </p>
            <Link to="/fremgang" className="knapp-tekst">
              Se hele fremgangen
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
