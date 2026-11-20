import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import Html from "../components/Html";
import Laster from "../components/Laster";
import { formaterVarighet, useNaa } from "../components/Nedtelling";
import Figur from "../figurer";
import OppgaveFigur from "../figurer/OppgaveFigur";
import { KAPITLER, lastOppgaver, useAsync } from "../data/innhold";
import { andel, beregnResultat, H25_GRUPPER } from "../lib/eksamen";
import { hentTilstand, lagreEksamenResultat, oppdaterAktivEksamen, useFremgang } from "../store/fremgang";

export default function EksamenPagar() {
  const { aktivEksamen: e } = useFremgang();
  const navigate = useNavigate();
  const ider = useMemo(() => e?.sporsmal.map((s) => s.id) ?? [], [e?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const { data: oppgaver } = useAsync(() => lastOppgaver(ider), [ider]);
  const naa = useNaa(500);
  const [leverDialog, setLeverDialog] = useState(false);
  const levert = useRef(false);

  const lever = useCallback(
    (automatisk: boolean) => {
      const aktiv = hentTilstand().aktivEksamen;
      if (!aktiv || !oppgaver || levert.current) return;
      levert.current = true;
      const r = beregnResultat(aktiv, oppgaver, automatisk);
      const forsok = aktiv.sporsmal
        .filter((s) => (aktiv.svar[s.id] ?? []).length > 0)
        .map((s) => ({ id: s.id, score: andel(r.perSporsmal[s.id]), svar: aktiv.svar[s.id] }));
      lagreEksamenResultat(r, forsok);
      navigate(`/eksamen/resultat/${r.id}`, { replace: true });
    },
    [oppgaver, navigate]
  );

  const igjen = e?.frist ? e.frist - naa : null;
  useEffect(() => {
    if (igjen !== null && igjen <= 0) lever(true);
  }, [igjen, lever]);

  useEffect(() => {
    if (!e) return;
    const advar = (ev: BeforeUnloadEvent) => ev.preventDefault();
    window.addEventListener("beforeunload", advar);
    return () => window.removeEventListener("beforeunload", advar);
  }, [e]);

  if (!e) {
    return (
      <div className="side smal">
        <h1>Ingen eksamen i gang</h1>
        <p>Sett opp en ny eksamenssimulering for å begynne.</p>
        <Link to="/eksamen" className="knapp">
          Til eksamenssimulering
        </Link>
      </div>
    );
  }
  if (!oppgaver) return <Laster tekst="Gjør klar eksamen …" />;

  const i = Math.min(e.gjeldende, e.sporsmal.length - 1);
  const s = e.sporsmal[i];
  const o = oppgaver.get(s.id)!;
  const valgt = e.svar[s.id] ?? [];
  const fler = o.type === "flervalg";
  const rekke = e.rekkefolge[s.id] ?? o.alternativer!.map((_, k) => k);
  const besvart = e.sporsmal.filter((x) => (e.svar[x.id] ?? []).length > 0).length;
  const flagget = e.flagget.includes(s.id);
  const kapTittel = KAPITLER.find((k) => k.nr === o.kap)?.tittel;
  const lite = igjen !== null && igjen < 5 * 60_000;

  const velg = (alt: number) => {
    oppdaterAktivEksamen((x) => {
      const n = x.svar[s.id] ?? [];
      let ny: number[];
      if (fler) {
        if (n.includes(alt)) ny = x.oppsett.inspera ? n : n.filter((v) => v !== alt);
        else ny = [...n, alt];
      } else ny = [alt];
      return { ...x, svar: { ...x.svar, [s.id]: ny } };
    });
  };
  const fjern = () => oppdaterAktivEksamen((x) => ({ ...x, svar: { ...x.svar, [s.id]: [] } }));
  const ga = (n: number) => oppdaterAktivEksamen((x) => ({ ...x, gjeldende: Math.max(0, Math.min(x.sporsmal.length - 1, n)) }));
  const veksleFlagg = () =>
    oppdaterAktivEksamen((x) => ({ ...x, flagget: x.flagget.includes(s.id) ? x.flagget.filter((f) => f !== s.id) : [...x.flagget, s.id] }));

  const ubesvart = e.sporsmal.length - besvart;

  return (
    <div className="eksamen">
      <div className="eksamen-topp">
        <div className="eksamen-topp-indre">
          <strong>Eksamenssimulering</strong>
          <span className="dempet">
            {besvart} av {e.sporsmal.length} besvart
          </span>
          {igjen !== null ? (
            <span className={`klokke ${lite ? "lite-tid" : ""}`} role="timer" aria-live={lite ? "polite" : "off"}>
              {formaterVarighet(igjen)} igjen
            </span>
          ) : (
            <span className="klokke">Uten tid, {formaterVarighet(naa - e.start)} brukt</span>
          )}
          <button type="button" className="knapp" onClick={() => setLeverDialog(true)}>
            Lever
          </button>
        </div>
      </div>

      <div className="eksamen-rutenett">
        <nav className="eksamen-navigator" aria-label="Spørsmål">
          <p className="dempet">Spørsmål</p>
          <ol>
            {e.sporsmal.map((x, k) => {
              const harSvar = (e.svar[x.id] ?? []).length > 0;
              const ny = x.gruppe !== undefined && (k === 0 || e.sporsmal[k - 1].gruppe !== x.gruppe);
              return (
                <li key={x.id} className={ny ? "ny-gruppe" : ""}>
                  <button
                    type="button"
                    className={`nav-celle ${harSvar ? "besvart" : ""} ${k === i ? "gjeldende" : ""} ${e.flagget.includes(x.id) ? "flagget" : ""}`}
                    aria-current={k === i}
                    aria-label={`Spørsmål ${k + 1}${harSvar ? ", besvart" : ", ubesvart"}${e.flagget.includes(x.id) ? ", merket" : ""}`}
                    onClick={() => ga(k)}
                  >
                    {k + 1}
                  </button>
                </li>
              );
            })}
          </ol>
          <ul className="nav-forklaring">
            <li>
              <span className="nav-celle besvart" aria-hidden="true" /> Besvart
            </li>
            <li>
              <span className="nav-celle flagget" aria-hidden="true" /> Merket
            </li>
          </ul>
        </nav>

        <article className="eksamen-sporsmal" aria-labelledby="spm-tittel">
          <header>
            <p className="dempet" id="spm-tittel">
              Spørsmål {i + 1} av {e.sporsmal.length}
              {s.gruppe !== undefined ? `, gruppe ${s.gruppe + 1}: ${H25_GRUPPER[s.gruppe].navn}` : `, ${kapTittel}`}
            </p>
            <button type="button" className={`knapp-tekst flaggknapp ${flagget ? "aktiv" : ""}`} aria-pressed={flagget} onClick={veksleFlagg}>
              {flagget ? "Merket for gjennomgang" : "Merk for gjennomgang"}
            </button>
          </header>
          {o.figur?.navn && <Figur navn={o.figur.navn} />}
          {o.figur?.data && <OppgaveFigur data={o.figur.data} />}
          <Html html={o.sporsmalHtml} className="prosa oppgave-sporsmal" />
          <p className="instruks">{fler ? "Velg ett eller flere alternativer." : "Velg ett alternativ."}</p>
          <ul className="alternativer" role={fler ? "group" : "radiogroup"}>
            {rekke.map((k, pos) => {
              const er = valgt.includes(k);
              const laast = fler && er && e.oppsett.inspera;
              return (
                <li key={k} className={`alternativ ${er ? "valgt" : ""}`}>
                  <button
                    type="button"
                    role={fler ? "checkbox" : "radio"}
                    aria-checked={er}
                    aria-disabled={laast || undefined}
                    className="alternativ-knapp"
                    onClick={() => velg(k)}
                    title={laast ? "Et valgt kryss kan ikke fjernes (Inspera-regelen)" : undefined}
                  >
                    <span className={`velger ${fler ? "firkant" : "rund"}`} aria-hidden="true" />
                    <span className="alternativ-bokstav" aria-hidden="true">
                      {String.fromCharCode(65 + pos)}
                    </span>
                    <Html html={o.alternativer![k].html} as="span" className="alternativ-tekst" />
                  </button>
                </li>
              );
            })}
          </ul>
          {!e.oppsett.inspera && valgt.length > 0 && (
            <button type="button" className="knapp-tekst" onClick={fjern}>
              Fjern svaret
            </button>
          )}
          {e.oppsett.inspera && valgt.length > 0 && (
            <p className="dempet liten">
              {fler ? "Kryssene står til du leverer." : "Du kan bytte alternativ, men ikke gjøre spørsmålet blankt igjen."}
            </p>
          )}
          <nav className="okt-nav">
            <button type="button" className="knapp knapp-sekundaer" disabled={i === 0} onClick={() => ga(i - 1)}>
              Forrige
            </button>
            {i < e.sporsmal.length - 1 ? (
              <button type="button" className="knapp" onClick={() => ga(i + 1)}>
                Neste
              </button>
            ) : (
              <button type="button" className="knapp" onClick={() => setLeverDialog(true)}>
                Gå til levering
              </button>
            )}
          </nav>
        </article>
      </div>

      {leverDialog && (
        <div className="dialog-bakgrunn" onMouseDown={(ev) => ev.target === ev.currentTarget && setLeverDialog(false)}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="lever-tittel">
            <h2 id="lever-tittel">Levere eksamen?</h2>
            <p>
              Du har svart på {besvart} av {e.sporsmal.length} spørsmål.
              {ubesvart > 0 && ` ${ubesvart} står blanke og gir 0 poeng.`}
              {e.flagget.length > 0 && ` ${e.flagget.length} er merket for gjennomgang.`}
            </p>
            <p className="dempet">Etter levering får du fasit, poeng og en oversikt over hva du bør øve mer på.</p>
            <div className="handlinger">
              <button type="button" className="knapp" onClick={() => lever(false)} autoFocus>
                Lever nå
              </button>
              <button type="button" className="knapp knapp-sekundaer" onClick={() => setLeverDialog(false)}>
                Fortsett eksamen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
