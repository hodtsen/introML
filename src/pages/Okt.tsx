import { useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import Laster from "../components/Laster";
import OppgaveKort from "../components/oppgaver/OppgaveKort";
import { prosent } from "../components/Mestring";
import { finnDelkapittel, KAPITLER, lastOppgaver, OPPGAVER, useAsync } from "../data/innhold";
import { feiledeOppgaver } from "../lib/mestring";
import { stokk } from "../lib/tilfeldig";
import { hentTilstand } from "../store/fremgang";
import type { OppgaveMeta } from "../types";

const NIVA_REKKE = { grunnleggende: 0, middels: 1, avansert: 2 };
const sorterTema = (a: OppgaveMeta, b: OppgaveMeta) =>
  a.del.localeCompare(b.del, "nb", { numeric: true }) || NIVA_REKKE[a.niva] - NIVA_REKKE[b.niva] || a.id.localeCompare(b.id, "nb", { numeric: true });

type Valg = { ider: string[]; tittel: string; tilbake: { til: string; tekst: string }; brodsmule: { til: string; tekst: string } };
const TRENING = { til: "/trening", tekst: "Eksamenstrening" };

// Kodequizen i Kode-fanen: alle oppgaver merket «kode», eventuelt bare fra ett kapittel.
function velgKodeoppgaver(p: URLSearchParams): Valg {
  const kap = Number(p.get("kap") ?? 0);
  const k = KAPITLER.find((x) => x.nr === kap);
  const utvalg = OPPGAVER.filter((o) => o.tags.includes("kode") && (!k || o.kap === kap)).sort(sorterTema);
  const ider = (p.get("rekkefolge") === "tilfeldig" ? stokk(utvalg) : utvalg).map((o) => o.id);
  const kode = { til: k ? `/kode?tema=${k.nr}` : "/kode", tekst: "Kode" };
  return { ider, tittel: k ? `Kodequiz, kapittel ${k.nr}: ${k.tittel}` : "Kodequiz", tilbake: kode, brodsmule: kode };
}

function velgOppgaver(p: URLSearchParams): Valg {
  const valg = velgTrening(p);
  return { ...valg, brodsmule: TRENING };
}

function velgTrening(p: URLSearchParams): Omit<Valg, "brodsmule"> {
  const t = hentTilstand();
  const del = p.get("del");
  const kap = p.get("kap");
  const modus = p.get("modus");
  if (modus === "feilede") {
    const ider = feiledeOppgaver(t);
    return { ider: stokk(ider), tittel: "Repeter feilede oppgaver", tilbake: { til: "/trening", tekst: "Eksamenstrening" } };
  }
  if (modus === "tag") {
    const tag = p.get("tag") ?? "";
    const titler: Record<string, string> = { kode: "Kodeoppgaver", figur: "Figurer og tabeller" };
    return {
      ider: OPPGAVER.filter((o) => o.tags.includes(tag)).sort(sorterTema).map((o) => o.id),
      tittel: titler[tag] ?? `Oppgaver merket «${tag}»`,
      tilbake: { til: "/trening", tekst: "Eksamenstrening" },
    };
  }
  if (modus === "blandet") {
    const kaps = (kap ?? "").split(",").map(Number).filter(Boolean);
    const nivaer = (p.get("niva") ?? "").split(",");
    const typer = (p.get("type") ?? "").split(",");
    const antall = Number(p.get("antall") ?? 10);
    const nye = p.get("nye") === "1";
    const kandidater = OPPGAVER.filter(
      (o) => (!kaps.length || kaps.includes(o.kap)) && nivaer.includes(o.niva) && typer.includes(o.type) && (!nye || !t.forsok[o.id])
    );
    return { ider: stokk(kandidater).slice(0, antall).map((o) => o.id), tittel: "Blandet øving", tilbake: { til: "/trening", tekst: "Eksamenstrening" } };
  }
  if (del) {
    const d = finnDelkapittel(del);
    return {
      ider: OPPGAVER.filter((o) => o.del === del).sort(sorterTema).map((o) => o.id),
      tittel: d ? `${d.nr} ${d.tittel}` : `Delkapittel ${del}`,
      tilbake: { til: `/pensum/${del}`, tekst: `Les ${del}` },
    };
  }
  if (kap) {
    const k = KAPITLER.find((x) => x.nr === Number(kap));
    return {
      ider: OPPGAVER.filter((o) => o.kap === Number(kap)).sort(sorterTema).map((o) => o.id),
      tittel: k ? `Kapittel ${k.nr}: ${k.tittel}` : `Kapittel ${kap}`,
      tilbake: { til: `/pensum/kapittel-${kap}`, tekst: `Kapittel ${kap}` },
    };
  }
  return { ider: [], tittel: "Øving", tilbake: { til: "/trening", tekst: "Eksamenstrening" } };
}

export default function Okt({ kodequiz = false }: { kodequiz?: boolean }) {
  const { search } = useLocation();
  return <OktInnhold key={search} kodequiz={kodequiz} />;
}

function OktInnhold({ kodequiz }: { kodequiz: boolean }) {
  const [params] = useSearchParams();
  const [valg] = useState(() => (kodequiz ? velgKodeoppgaver(params) : velgOppgaver(params)));
  const { data } = useAsync(() => lastOppgaver(valg.ider), [valg]);
  const [indeks, setIndeks] = useState(0);
  const [resultater, setResultater] = useState<Record<string, number>>({});
  const [ferdig, setFerdig] = useState(false);

  const oppgaver = useMemo(() => (data ? valg.ider.map((id) => data.get(id)!).filter(Boolean) : []), [data, valg]);

  if (valg.ider.length === 0) {
    return (
      <div className="side smal">
        <h1>{valg.tittel}</h1>
        <p>Ingen oppgaver passer valget ditt.</p>
        <Link to={valg.brodsmule.til} className="knapp">
          Tilbake til {valg.brodsmule.tekst.toLowerCase()}
        </Link>
      </div>
    );
  }
  if (!data) return <Laster tekst="Laster oppgavene …" />;

  const besvart = Object.keys(resultater).length;
  const o = oppgaver[indeks];

  if (ferdig) {
    const snitt = besvart ? Object.values(resultater).reduce((a, b) => a + b, 0) / besvart : null;
    const perDel = new Map<string, number[]>();
    for (const [id, s] of Object.entries(resultater)) {
      const d = OPPGAVER.find((x) => x.id === id)!.del;
      perDel.set(d, [...(perDel.get(d) ?? []), s]);
    }
    return (
      <div className="side smal okt-oppsummering">
        <h1>Økten er ferdig</h1>
        <p className="ingress">
          {valg.tittel}: du svarte på {besvart} av {oppgaver.length} oppgaver, og fikk {prosent(snitt)} riktig.
        </p>
        <table className="tabell-enkel">
          <thead>
            <tr>
              <th>Delkapittel</th>
              <th>Besvart</th>
              <th>Riktig</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {[...perDel.entries()]
              .sort((a, b) => a[0].localeCompare(b[0], "nb", { numeric: true }))
              .map(([d, s]) => (
                <tr key={d}>
                  <td>
                    {d} {finnDelkapittel(d)?.tittel}
                  </td>
                  <td>{s.length}</td>
                  <td>{prosent(s.reduce((a, b) => a + b, 0) / s.length)}</td>
                  <td>
                    <Link to={`/pensum/${d}`}>Les</Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="handlinger">
          <button
            type="button"
            className="knapp"
            onClick={() => {
              setFerdig(false);
              setIndeks(oppgaver.findIndex((x) => !(x.id in resultater)) >= 0 ? oppgaver.findIndex((x) => !(x.id in resultater)) : 0);
            }}
          >
            Tilbake til oppgavene
          </button>
          <Link to="/trening/okt?modus=feilede" className="knapp knapp-sekundaer">
            Repeter feilede
          </Link>
          <Link to={valg.brodsmule.til} className="knapp knapp-sekundaer">
            {kodequiz ? "Tilbake til kodekortene" : "Ny øving"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="side okt">
      <header className="okt-hode">
        <nav className="brodsmuler" aria-label="Brødsmulesti">
          <Link to={valg.brodsmule.til}>{valg.brodsmule.tekst}</Link>
          <span aria-hidden="true">/</span>
          <span>{valg.tittel}</span>
        </nav>
        <div className="okt-fremdrift">
          <ol className="okt-prikker" aria-label="Oppgaver i økten">
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
            Avslutt økten
          </button>
        )}
      </nav>
    </div>
  );
}
