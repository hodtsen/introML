import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import Sidemeny from "../components/Sidemeny";
import Innhold from "../components/Innhold";
import Html from "../components/Html";
import Laster from "../components/Laster";
import { Mestringsstolpe, mestringTekst } from "../components/Mestring";
import { KAPITLER, finnDelkapittel, lastKapittel, nabo, oppgaverForDel, useAsync, OPPGAVER } from "../data/innhold";
import { delMestring, kapMestring } from "../lib/mestring";
import { settLest, settSistBesokt, useFremgang } from "../store/fremgang";
import { SEKSJONER, type Delkapittel } from "../types";
import IkkeFunnet from "./IkkeFunnet";

export default function PensumSide() {
  const { id = "" } = useParams();
  const [menyApen, setMenyApen] = useState(false);
  const kapMatch = id.match(/^kapittel-(\d+)$/);
  const del = /^\d+\.\d+$/.test(id) ? finnDelkapittel(id) : undefined;
  const kapNr = kapMatch ? Number(kapMatch[1]) : del?.kap;
  const kap = KAPITLER.find((k) => k.nr === kapNr);
  if (!kap || (!kapMatch && !del)) return <IkkeFunnet />;

  return (
    <div className="pensum-ramme">
      <Sidemeny aktivKap={kap.nr} aktivDel={del?.nr} apen={menyApen} onLukk={() => setMenyApen(false)} />
      <div className="pensum-hoved">
        <button type="button" className="knapp knapp-sekundaer vis-sidemeny" onClick={() => setMenyApen(true)}>
          Kapitler og delkapitler
        </button>
        {del ? <DelkapittelVisning key={del.nr} nr={del.nr} kap={kap.nr} /> : <KapittelVisning kap={kap.nr} />}
      </div>
    </div>
  );
}

function KapittelVisning({ kap: nr }: { kap: number }) {
  const kap = KAPITLER.find((k) => k.nr === nr)!;
  const t = useFremgang();
  const m = kapMestring(nr, t);
  const antOppg = OPPGAVER.filter((o) => o.kap === nr).length;
  return (
    <article className="kapittelside">
      <nav className="brodsmuler" aria-label="Brødsmulesti">
        <Link to="/pensum">Pensum</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Kapittel {nr}</span>
      </nav>
      <header className="side-hode">
        <p className="kapittel-etikett">Kapittel {nr}</p>
        <h1>{kap.tittel}</h1>
        <Html html={kap.introHtml} className="prosa ingress" />
        <p className="kildelinje">Kilder: {kap.kilder}</p>
        <div className="handlinger">
          <Link to={`/pensum/${kap.delkapitler[0].nr}`} className="knapp">
            Begynn å lese
          </Link>
          {antOppg > 0 && (
            <Link to={`/trening/okt?kap=${nr}`} className="knapp knapp-sekundaer">
              Øv på hele kapitlet ({antOppg} oppgaver)
            </Link>
          )}
        </div>
        <p className="mestring-linje">
          <Mestringsstolpe verdi={m.mestring} /> {mestringTekst(m)}
        </p>
      </header>
      <ol className="delkapittel-liste">
        {kap.delkapitler.map((d) => {
          const dm = delMestring(d.nr, t);
          const lest = Boolean(t.lest[d.nr]);
          return (
            <li key={d.nr}>
              <Link to={`/pensum/${d.nr}`} className="dk-rad">
                <span className="dk-nr">{d.nr}</span>
                <span className="dk-tittel">{d.tittel}</span>
                <span className="dk-meta">
                  {Math.max(1, Math.round(d.ord / 200))} min lesing
                  {lest && <span className="merke-lest">Lest</span>}
                </span>
                <span className="dk-mestring">
                  <Mestringsstolpe verdi={dm.mestring} />
                  <span>{mestringTekst(dm)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </article>
  );
}

function DelkapittelVisning({ nr, kap }: { nr: string; kap: number }) {
  const { data, feil } = useAsync(() => lastKapittel(kap), [kap]);
  const d = data?.delkapitler.find((x) => x.nr === nr);
  useEffect(() => settSistBesokt(nr), [nr]);
  if (feil) return <p className="feilmelding">Kunne ikke laste kapittelet: {feil.message}</p>;
  if (!d) return <Laster tekst="Laster delkapittelet …" />;
  return <Delkapittelinnhold d={d} kap={kap} />;
}

function Delkapittelinnhold({ d, kap }: { d: Delkapittel; kap: number }) {
  const t = useFremgang();
  const [params] = useSearchParams();
  const [aktiv, setAktiv] = useState<string>("introduksjon");
  const m = delMestring(d.nr, t);
  const antOppg = oppgaverForDel(d.nr).length;
  const forrige = nabo(d.nr, -1);
  const neste = nabo(d.nr, 1);
  const lest = Boolean(t.lest[d.nr]);
  const kapTittel = KAPITLER.find((k) => k.nr === kap)?.tittel;

  const seksjoner = useMemo(() => SEKSJONER.filter((s) => d.seksjoner[s.key]?.length), [d]);

  useEffect(() => {
    const mål = params.get("seksjon");
    if (mål) requestAnimationFrame(() => document.getElementById(`s-${mål}`)?.scrollIntoView({ block: "start" }));
  }, [params, d.nr]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (oppf) => {
        const synlige = oppf.filter((o) => o.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (synlige[0]) setAktiv(synlige[0].target.id.slice(2));
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );
    seksjoner.forEach((s) => {
      const el = document.getElementById(`s-${s.key}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [seksjoner]);

  const tilSeksjon = (key: string) => document.getElementById(`s-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="delkapittel-grid">
      <article className="delkapittel">
        <nav className="brodsmuler" aria-label="Brødsmulesti">
          <Link to="/pensum">Pensum</Link>
          <span aria-hidden="true">/</span>
          <Link to={`/pensum/kapittel-${kap}`}>
            Kapittel {kap} {kapTittel}
          </Link>
        </nav>
        <header className="side-hode">
          <h1>
            <span className="h1-nr">{d.nr}</span> {d.tittel}
          </h1>
          <Html html={d.kildeHtml} as="p" className="kildelinje" />
          <div className="dk-verktoy">
            {antOppg > 0 ? (
              <Link to={`/trening/okt?del=${d.nr}`} className="knapp">
                Øv på {d.nr} ({antOppg} oppgaver)
              </Link>
            ) : null}
            <button type="button" className={`knapp knapp-sekundaer ${lest ? "er-lest" : ""}`} aria-pressed={lest} onClick={() => settLest(d.nr, !lest)}>
              {lest ? "Lest" : "Marker som lest"}
            </button>
            <span className="dk-mestring-tekst">
              <Mestringsstolpe verdi={m.mestring} /> {mestringTekst(m)}
            </span>
          </div>
        </header>

        <details className="innholdsliste-mobil">
          <summary>På denne siden</summary>
          <ul>
            {seksjoner.map((s) => (
              <li key={s.key}>
                <button type="button" onClick={() => tilSeksjon(s.key)}>
                  {s.tittel}
                </button>
              </li>
            ))}
          </ul>
        </details>

        {seksjoner.map((s) => (
          <section key={s.key} id={`s-${s.key}`} className={`seksjon seksjon-${s.key}`} aria-labelledby={`h-${s.key}`}>
            <h2 id={`h-${s.key}`}>{s.tittel}</h2>
            <Innhold deler={d.seksjoner[s.key]} />
          </section>
        ))}

        <div className="dk-slutt">
          {!lest && (
            <button type="button" className="knapp knapp-sekundaer" onClick={() => settLest(d.nr, true)}>
              Marker {d.nr} som lest
            </button>
          )}
          {antOppg > 0 && (
            <Link to={`/trening/okt?del=${d.nr}`} className="knapp">
              Test deg selv på {d.nr}
            </Link>
          )}
        </div>
        <nav className="forrige-neste" aria-label="Forrige og neste delkapittel">
          {forrige ? (
            <Link to={`/pensum/${forrige.nr}`} className="fn-lenke fn-forrige">
              <span>Forrige</span>
              <strong>
                {forrige.nr} {forrige.tittel}
              </strong>
            </Link>
          ) : (
            <span />
          )}
          {neste ? (
            <Link to={`/pensum/${neste.nr}`} className="fn-lenke fn-neste">
              <span>Neste</span>
              <strong>
                {neste.nr} {neste.tittel}
              </strong>
            </Link>
          ) : (
            <Link to="/trening" className="fn-lenke fn-neste">
              <span>Ferdig med pensum</span>
              <strong>Gå til eksamenstrening</strong>
            </Link>
          )}
        </nav>
      </article>
      <aside className="innholdsliste" aria-label="På denne siden">
        <p className="innholdsliste-tittel">På denne siden</p>
        <ul>
          {seksjoner.map((s) => (
            <li key={s.key}>
              <button type="button" className={aktiv === s.key ? "aktiv" : ""} onClick={() => tilSeksjon(s.key)}>
                {s.tittel}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
