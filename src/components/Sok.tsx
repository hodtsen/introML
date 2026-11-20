import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { finnDelkapittel, lastBegreper, lastSok, useAsync } from "../data/innhold";
import { normaliser } from "../lib/stikkord";
import type { Begrep, SokPost } from "../types";

interface Treff {
  type: "del" | "begrep";
  til: string;
  tittel: string;
  under: string;
  utdrag?: string;
  poeng: number;
}

function sok(q: string, poster: SokPost[], begreper: Begrep[]): Treff[] {
  const ord = normaliser(q).split(" ").filter((o) => o.length > 0);
  if (ord.length === 0) return [];
  const ut: Treff[] = [];
  for (const p of poster) {
    const tittel = normaliser(`${p.del} ${p.tittel}`);
    const termer = normaliser(p.begreper.join(" "));
    const tekst = normaliser(p.tekst);
    let poeng = 0;
    let alle = true;
    for (const o of ord) {
      let delpoeng = 0;
      if (tittel.includes(o)) delpoeng += 12;
      if (termer.includes(o)) delpoeng += 6;
      let forekomster = 0;
      let i = tekst.indexOf(o);
      while (i >= 0 && forekomster < 6) {
        forekomster++;
        i = tekst.indexOf(o, i + o.length);
      }
      delpoeng += forekomster;
      if (delpoeng === 0) alle = false;
      poeng += delpoeng;
    }
    if (!alle) continue;
    // Utdrag rundt første treff i originalteksten
    const lav = p.tekst.toLowerCase();
    const pos = lav.indexOf(q.trim().toLowerCase().split(/\s+/)[0]);
    const utdrag = pos >= 0 ? (pos > 60 ? "… " : "") + p.tekst.slice(Math.max(0, pos - 60), pos + 120) + " …" : undefined;
    const d = finnDelkapittel(p.del);
    ut.push({ type: "del", til: `/pensum/${p.del}`, tittel: `${p.del} ${p.tittel}`, under: d ? `Kapittel ${d.kap}` : "", utdrag, poeng });
  }
  for (const b of begreper) {
    const t = normaliser(b.term);
    if (ord.every((o) => t.includes(o))) {
      ut.push({
        type: "begrep",
        til: `/pensum/${b.del}?seksjon=begreper`,
        tittel: b.term,
        under: `Begrep i ${b.del}`,
        poeng: 20 + (t.startsWith(ord[0]) ? 5 : 0),
      });
    }
  }
  return ut.sort((a, b) => b.poeng - a.poeng).slice(0, 14);
}

export default function Sok({ onLukk }: { onLukk: () => void }) {
  const [q, setQ] = useState("");
  const [valgt, setValgt] = useState(0);
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const { data } = useAsync(() => Promise.all([lastSok(), lastBegreper()]), []);
  const treff = useMemo(() => (data ? sok(q, data[0], data[1]) : []), [q, data]);

  useEffect(() => {
    input.current?.focus();
    const forrige = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = forrige;
    };
  }, []);
  useEffect(() => setValgt(0), [q]);

  const ga = (t: Treff) => {
    onLukk();
    navigate(t.til);
  };

  return (
    <div className="dialog-bakgrunn" onMouseDown={(e) => e.target === e.currentTarget && onLukk()}>
      <div className="sokedialog" role="dialog" aria-modal="true" aria-label="Søk i pensum">
        <div className="sokefelt">
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Søk etter begrep, metode eller formel, f.eks. «entropi» eller «Bellman»"
            aria-label="Søkeord"
            aria-controls="sokeresultater"
            onKeyDown={(e) => {
              if (e.key === "Escape") onLukk();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setValgt((v) => Math.min(v + 1, treff.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setValgt((v) => Math.max(v - 1, 0));
              }
              if (e.key === "Enter" && treff[valgt]) ga(treff[valgt]);
            }}
          />
          <button type="button" className="knapp-tekst" onClick={onLukk}>
            Lukk
          </button>
        </div>
        <ul className="sokeresultater" id="sokeresultater" role="listbox">
          {!data && <li className="sok-tom">Laster søkeindeksen …</li>}
          {data && q.trim() && treff.length === 0 && <li className="sok-tom">Ingen treff på «{q}». Prøv et kortere ord eller et synonym.</li>}
          {data && !q.trim() && (
            <li className="sok-tom">Søket dekker titler, alle begreper og hele teksten i de 58 delkapitlene. Bruk piltastene og Enter.</li>
          )}
          {treff.map((t, i) => (
            <li key={t.type + t.til + t.tittel} role="option" aria-selected={i === valgt}>
              <button type="button" className={`sok-treff ${i === valgt ? "valgt" : ""}`} onMouseEnter={() => setValgt(i)} onClick={() => ga(t)}>
                <span className={`sok-type sok-type-${t.type}`}>{t.type === "begrep" ? "Begrep" : "Delkapittel"}</span>
                <span className="sok-tittel">{t.tittel}</span>
                <span className="sok-under">{t.under}</span>
                {t.utdrag && <span className="sok-utdrag">{t.utdrag}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
