import { useMemo, useState } from "react";
import { Link } from "react-router";
import Html from "../components/Html";
import Laster from "../components/Laster";
import { KAPITLER, lastBegreper, useAsync } from "../data/innhold";
import { normaliser } from "../lib/stikkord";
import type { Begrep } from "../types";

export default function Begrepsliste() {
  const { data } = useAsync(lastBegreper, []);
  const [filter, setFilter] = useState("");
  const [visning, setVisning] = useState<"alfabetisk" | "kapittel">("alfabetisk");

  const filtrert = useMemo(() => {
    if (!data) return [];
    const q = normaliser(filter);
    return data.filter((b) => !q || normaliser(b.term).includes(q) || normaliser(b.defHtml.replace(/<[^>]+>/g, " ")).includes(q));
  }, [data, filter]);

  const grupper = useMemo(() => {
    const m = new Map<string, Begrep[]>();
    if (visning === "alfabetisk") {
      const sortert = [...filtrert].sort((a, b) => a.term.localeCompare(b.term, "nb", { sensitivity: "base" }));
      for (const b of sortert) {
        const bokstav = b.term.replace(/^[^A-Za-zÆØÅæøå0-9]+/, "").charAt(0).toUpperCase() || "#";
        if (!m.has(bokstav)) m.set(bokstav, []);
        m.get(bokstav)!.push(b);
      }
    } else {
      for (const k of KAPITLER) m.set(`Kapittel ${k.nr}: ${k.tittel}`, []);
      for (const b of filtrert) m.get(`Kapittel ${b.del.split(".")[0]}: ${KAPITLER.find((k) => String(k.nr) === b.del.split(".")[0])?.tittel}`)?.push(b);
      for (const [k, v] of m) if (v.length === 0) m.delete(k);
    }
    return [...m.entries()];
  }, [filtrert, visning]);

  return (
    <div className="side begrepsliste">
      <header className="side-hode">
        <h1>Begrepsliste</h1>
        <p className="ingress">Alle begrepene fra Begreper-seksjonene, med lenke til delkapittelet der de forklares.</p>
      </header>
      <div className="verktoylinje">
        <label className="filterfelt">
          <span className="visuelt-skjult">Filtrer begreper</span>
          <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrer, f.eks. «gini» eller «policy»" />
        </label>
        <div className="segmentert" role="group" aria-label="Sortering">
          <button type="button" aria-pressed={visning === "alfabetisk"} onClick={() => setVisning("alfabetisk")}>
            Alfabetisk
          </button>
          <button type="button" aria-pressed={visning === "kapittel"} onClick={() => setVisning("kapittel")}>
            Per kapittel
          </button>
        </div>
        {data && <span className="dempet">{filtrert.length} begreper</span>}
      </div>
      {!data && <Laster />}
      {data && filtrert.length === 0 && <p>Ingen begreper passer «{filter}».</p>}
      {grupper.map(([navn, liste]) => (
        <section key={navn} className="begrepsgruppe">
          <h2>{navn}</h2>
          <dl>
            {liste.map((b, i) => (
              <div key={b.del + b.term + i} className="begrep">
                <dt>
                  <Html html={b.termHtml} as="span" />
                  <Link to={`/pensum/${b.del}?seksjon=begreper`} className="begrep-del">
                    {b.del}
                  </Link>
                </dt>
                <Html html={b.defHtml} as="dd" />
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
