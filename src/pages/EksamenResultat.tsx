import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import Html from "../components/Html";
import Laster from "../components/Laster";
import { prosent } from "../components/Mestring";
import { formaterVarighet } from "../components/Nedtelling";
import { IkonDelvis, IkonFeil, IkonRiktig } from "../components/oppgaver/OppgaveKort";
import Figur from "../figurer";
import OppgaveFigur from "../figurer/OppgaveFigur";
import { finnDelkapittel, KAPITLER, lastOppgaver, useAsync } from "../data/innhold";
import { andel, H25_GRUPPER, karakter } from "../lib/eksamen";
import { tekstPaViridis, viridis } from "../lib/farger";
import { formaterPoeng } from "../lib/vurdering";
import { useFremgang } from "../store/fremgang";
import IkkeFunnet from "./IkkeFunnet";

type Filter = "alle" | "feil" | "blanke" | "riktige";

export default function EksamenResultatSide() {
  const { id } = useParams();
  const t = useFremgang();
  const r = t.eksamener.find((e) => e.id === id);
  const ider = useMemo(() => r?.sporsmal.map((s) => s.id) ?? [], [r?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const { data: oppgaver } = useAsync(() => lastOppgaver(ider), [ider]);
  const [filter, setFilter] = useState<Filter>("alle");
  const [apne, setApne] = useState<Set<string>>(new Set());

  if (!r) return <IkkeFunnet />;
  if (!oppgaver) return <Laster tekst="Laster rapporten …" />;

  const status = (sid: string) => {
    const valgt = r.svar[sid] ?? [];
    const p = r.perSporsmal[sid];
    if (valgt.length === 0) return "blank";
    if (p && p.poeng >= p.maks - 1e-9) return "riktig";
    if (p && p.poeng > 0) return "delvis";
    return "feil";
  };
  const tellinger = { riktig: 0, delvis: 0, feil: 0, blank: 0 };
  r.sporsmal.forEach((s) => tellinger[status(s.id) as keyof typeof tellinger]++);
  const tapt = Object.values(r.perSporsmal).reduce((sum, p) => sum + Math.min(0, p.poeng), 0);

  const svake = Object.entries(r.perDel)
    .map(([d, v]) => ({ d, a: andel(v), v }))
    .filter((x) => x.a < 0.75)
    .sort((a, b) => a.a - b.a)
    .slice(0, 6);

  const synlige = r.sporsmal.filter((s) => {
    const st = status(s.id);
    if (filter === "feil") return st === "feil" || st === "delvis";
    if (filter === "blanke") return st === "blank";
    if (filter === "riktige") return st === "riktig";
    return true;
  });

  const veksle = (sid: string) =>
    setApne((a) => {
      const n = new Set(a);
      if (n.has(sid)) n.delete(sid);
      else n.add(sid);
      return n;
    });

  return (
    <div className="side resultat">
      <nav className="brodsmuler" aria-label="Brødsmulesti">
        <Link to="/eksamen">Eksamenssimulering</Link>
        <span aria-hidden="true">/</span>
        <span>Rapport</span>
      </nav>
      <header className="resultat-hode">
        <div className="resultat-karakter" style={{ background: viridis(r.prosent), color: tekstPaViridis(r.prosent) }}>
          <span className="rk-bokstav">{r.karakter}</span>
          <span className="rk-prosent">{prosent(r.prosent)}</span>
        </div>
        <div>
          <h1>Resultat</h1>
          <p className="ingress">
            {formaterPoeng(r.poeng).replace("+", "")} av {r.maks.toLocaleString("nb-NO")} poeng.{" "}
            {r.oppsett.modus === "H25" ? "Poengregler som eksamen 2025." : "Poengregler fra kunngjøringen for 2026."}{" "}
            {r.oppsett.sett !== "tilfeldig" && `Sett ${r.oppsett.sett}. `}
            Brukt tid {formaterVarighet(r.slutt - r.start)}
            {r.oppsett.varighetMin ? ` av ${formaterVarighet(r.oppsett.varighetMin * 60_000)}` : ""}.
            {r.automatisk && " Levert automatisk da tiden var ute."}
          </p>
          <p className="dempet">
            Karakteranslag etter NTNUs standardskala (A fra 89 %, B fra 77 %, C fra 65 %, D fra 53 %, E fra 41 %). Med de strengere grensene fra 2024
            (A fra 92 %, B fra 82 %) blir det {karakter(r.prosent, true)}.
          </p>
        </div>
      </header>

      <section className="resultat-tall">
        <p>
          <strong>{tellinger.riktig}</strong> riktige
        </p>
        {tellinger.delvis > 0 && (
          <p>
            <strong>{tellinger.delvis}</strong> delvis riktige
          </p>
        )}
        <p>
          <strong>{tellinger.feil}</strong> feil
        </p>
        <p>
          <strong>{tellinger.blank}</strong> blanke
        </p>
        <p>
          <strong>{formaterPoeng(tapt)}</strong> poeng tapt på feil kryss
        </p>
      </section>

      <div className="resultat-kolonner">
        <section className="panel" aria-labelledby="perkap-tittel">
          <h2 id="perkap-tittel">{r.perGruppe ? "Per gruppe" : "Per kapittel"}</h2>
          <table className="tabell-enkel resultat-tabell">
            <thead>
              <tr>
                <th>{r.perGruppe ? "Gruppe" : "Kapittel"}</th>
                <th>Poeng</th>
                <th>Andel</th>
              </tr>
            </thead>
            <tbody>
              {r.perGruppe
                ? Object.entries(r.perGruppe).map(([g, v]) => (
                    <Rad key={g} navn={`${Number(g) + 1}. ${H25_GRUPPER[Number(g)].navn}`} v={{ ...v, poeng: Math.max(0, v.poeng) }} />
                  ))
                : KAPITLER.filter((k) => r.perKap[k.nr]).map((k) => <Rad key={k.nr} navn={`${k.nr}. ${k.tittel}`} v={r.perKap[k.nr]} />)}
            </tbody>
          </table>
          {r.perGruppe && <p className="dempet liten">Negative gruppesummer er satt til 0, som på eksamen 2025.</p>}
        </section>

        <section className="panel" aria-labelledby="ov-tittel">
          <h2 id="ov-tittel">Dette bør du øve mer på</h2>
          {svake.length === 0 ? (
            <p>Du fikk minst 75 % på alle delkapitlene som var med. Prøv et nytt sett, eller kortere tid.</p>
          ) : (
            <ul className="anbefalinger">
              {svake.map((x) => {
                const d = finnDelkapittel(x.d);
                return (
                  <li key={x.d}>
                    <span>
                      <strong>
                        {x.d} {d?.tittel}
                      </strong>
                      <span className="dempet">
                        {" "}
                        {prosent(x.a)} på {x.v.antall} {x.v.antall === 1 ? "spørsmål" : "spørsmål"}
                      </span>
                    </span>
                    <span className="anbefaling-lenker">
                      <Link to={`/pensum/${x.d}`}>Les</Link>
                      <Link to={`/trening/okt?del=${x.d}`}>Øv</Link>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="handlinger">
            <Link to="/eksamen" className="knapp">
              Ny eksamen
            </Link>
            <Link to="/fremgang" className="knapp knapp-sekundaer">
              Se all fremgang
            </Link>
          </div>
        </section>
      </div>

      <section aria-labelledby="gj-tittel" className="gjennomgang">
        <div className="seksjonshode">
          <h2 id="gj-tittel">Gjennomgang</h2>
          <div className="segmentert" role="group" aria-label="Vis spørsmål">
            {(
              [
                ["alle", `Alle (${r.sporsmal.length})`],
                ["feil", `Feil (${tellinger.feil + tellinger.delvis})`],
                ["blanke", `Blanke (${tellinger.blank})`],
                ["riktige", `Riktige (${tellinger.riktig})`],
              ] as [Filter, string][]
            ).map(([f, navn]) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {navn}
              </button>
            ))}
          </div>
          <button type="button" className="knapp-tekst" onClick={() => setApne(apne.size ? new Set() : new Set(synlige.map((s) => s.id)))}>
            {apne.size ? "Lukk alle" : "Åpne alle"}
          </button>
        </div>
        <ol className="gjennomgang-liste">
          {synlige.map((s) => {
            const o = oppgaver.get(s.id);
            if (!o) return null;
            const nr = r.sporsmal.findIndex((x) => x.id === s.id) + 1;
            const st = status(s.id);
            const p = r.perSporsmal[s.id];
            const valgt = r.svar[s.id] ?? [];
            const rekke = r.rekkefolge[s.id] ?? o.alternativer!.map((_, k) => k);
            const apen = apne.has(s.id);
            return (
              <li key={s.id} className={`gj-post gj-${st}`}>
                <button type="button" className="gj-hode" aria-expanded={apen} onClick={() => veksle(s.id)}>
                  <span className="gj-status">
                    {st === "riktig" && <IkonRiktig />}
                    {st === "feil" && <IkonFeil />}
                    {st === "delvis" && <IkonDelvis />}
                    {st === "blank" && <span className="ikon-blank" aria-hidden="true" />}
                    <span className="visuelt-skjult">{st}</span>
                  </span>
                  <span className="gj-nr">{nr}</span>
                  <span className="gj-utdrag">{o.kort}{o.kort.length >= 170 ? " …" : ""}</span>
                  <span className="gj-poeng">{formaterPoeng(p?.poeng ?? 0)}</span>
                </button>
                {apen && (
                  <div className="gj-innhold">
                    <p className="dempet liten">
                      <Link to={`/pensum/${o.del}`}>
                        {o.del} {finnDelkapittel(o.del)?.tittel}
                      </Link>
                    </p>
                    {o.figur?.navn && <Figur navn={o.figur.navn} />}
                    {o.figur?.data && <OppgaveFigur data={o.figur.data} />}
                    <Html html={o.sporsmalHtml} className="prosa oppgave-sporsmal" />
                    <ul className="alternativer">
                      {rekke.map((k, pos) => {
                        const a = o.alternativer![k];
                        const er = valgt.includes(k);
                        const kl = a.riktig ? (er ? "riktig-valgt" : "riktig-ikke-valgt") : er ? "feil-valgt" : "noytral";
                        return (
                          <li key={k} className={`alternativ ${kl}`}>
                            <div className="alternativ-knapp statisk">
                              <span className={`velger ${o.type === "flervalg" ? "firkant" : "rund"} ${er ? "fylt" : ""}`} aria-hidden="true" />
                              <span className="alternativ-bokstav">{String.fromCharCode(65 + pos)}</span>
                              <Html html={a.html} as="span" className="alternativ-tekst" />
                              <span className="alternativ-dom">
                                {a.riktig && er && (
                                  <>
                                    <IkonRiktig /> Riktig, valgt
                                  </>
                                )}
                                {a.riktig && !er && (
                                  <>
                                    <IkonRiktig /> Riktig, ikke valgt
                                  </>
                                )}
                                {!a.riktig && er && (
                                  <>
                                    <IkonFeil /> Feil, valgt
                                  </>
                                )}
                              </span>
                            </div>
                            <Html html={a.forklaringHtml} as="p" className="alternativ-forklaring" />
                          </li>
                        );
                      })}
                    </ul>
                    {o.forklaringHtml && <Html html={o.forklaringHtml} className="prosa fasit-forklaring" />}
                    <div className="husk">
                      <h4>Husk til eksamen</h4>
                      <Html html={o.huskHtml} as="p" />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function Rad({ navn, v }: { navn: string; v: { poeng: number; maks: number; antall: number } }) {
  const a = andel(v);
  return (
    <tr>
      <td>{navn}</td>
      <td>
        {formaterPoeng(v.poeng).replace("+", "")} / {v.maks.toLocaleString("nb-NO")}
      </td>
      <td>
        <span className="andel-celle">
          <span className="andel-stolpe">
            <span style={{ width: `${Math.round(a * 100)}%`, background: viridis(a) }} />
          </span>
          {prosent(a)}
        </span>
      </td>
    </tr>
  );
}
