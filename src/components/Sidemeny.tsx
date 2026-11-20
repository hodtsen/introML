import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { KAPITLER } from "../data/innhold";
import { delMestring } from "../lib/mestring";
import { useFremgang } from "../store/fremgang";
import { MestringsPrikk } from "./Mestring";

export default function Sidemeny({ aktivKap, aktivDel, apen, onLukk }: { aktivKap?: number; aktivDel?: string; apen: boolean; onLukk: () => void }) {
  const t = useFremgang();
  const [utvidet, setUtvidet] = useState<Set<number>>(() => new Set(aktivKap ? [aktivKap] : []));
  useEffect(() => {
    if (aktivKap) setUtvidet((s) => new Set(s).add(aktivKap));
  }, [aktivKap]);

  const veksle = (nr: number) =>
    setUtvidet((s) => {
      const n = new Set(s);
      if (n.has(nr)) n.delete(nr);
      else n.add(nr);
      return n;
    });

  return (
    <>
      <aside className={`sidemeny ${apen ? "apen" : ""}`} aria-label="Pensum">
        <div className="sidemeny-topp">
          <NavLink to="/pensum" end className="sidemeny-oversikt">
            Pensumoversikt
          </NavLink>
          <button type="button" className="knapp-tekst sidemeny-lukk" onClick={onLukk}>
            Lukk
          </button>
        </div>
        <ol className="sidemeny-kapitler">
          {KAPITLER.map((k) => {
            const er = utvidet.has(k.nr);
            return (
              <li key={k.nr} className={k.nr === aktivKap ? "aktiv-kap" : ""}>
                <div className="sm-kap">
                  <button type="button" className="sm-veksle" aria-expanded={er} aria-label={`${er ? "Skjul" : "Vis"} delkapitlene i kapittel ${k.nr}`} onClick={() => veksle(k.nr)}>
                    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" style={{ transform: er ? "rotate(90deg)" : undefined }}>
                      <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <NavLink to={`/pensum/kapittel-${k.nr}`} className="sm-kap-lenke" onClick={onLukk}>
                    <span className="sm-nr">{k.nr}</span> {k.tittel}
                  </NavLink>
                </div>
                {er && (
                  <ol className="sm-deler">
                    {k.delkapitler.map((d) => (
                      <li key={d.nr}>
                        <NavLink to={`/pensum/${d.nr}`} className={d.nr === aktivDel ? "active" : ""} onClick={onLukk}>
                          <span className="sm-del-nr">{d.nr}</span>
                          <span className="sm-del-tittel">{d.tittel}</span>
                          <MestringsPrikk m={delMestring(d.nr, t)} lest={Boolean(t.lest[d.nr])} />
                        </NavLink>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
        <div className="sidemeny-bunn">
          <NavLink to="/formelark" onClick={onLukk}>Formelark</NavLink>
          <NavLink to="/begreper" onClick={onLukk}>Begrepsliste</NavLink>
        </div>
      </aside>
      {apen && <div className="sidemeny-skygge" onClick={onLukk} aria-hidden="true" />}
    </>
  );
}
