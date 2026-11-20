import { useMemo, useState } from "react";
import Html from "../Html";
import { stokk } from "../../lib/tilfeldig";
import { eksamenspoeng2026, formaterPoeng, scoreValg } from "../../lib/vurdering";
import type { TypeProps } from "./OppgaveKort";
import { IkonFeil, IkonRiktig } from "./OppgaveKort";

export default function ValgOppgave({ o, fase, onFerdig }: TypeProps) {
  const alt = o.alternativer ?? [];
  const rekkefolge = useMemo(() => stokk(alt.map((_, i) => i)), [o.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [valgt, setValgt] = useState<number[]>([]);
  const fler = o.type === "flervalg";
  const laast = fase !== "svarer";

  const velg = (i: number) => {
    if (laast) return;
    if (fler) setValgt((v) => (v.includes(i) ? v.filter((x) => x !== i) : [...v, i]));
    else setValgt([i]);
  };

  const ep = eksamenspoeng2026(o, valgt);

  return (
    <div className="valg">
      <p className="instruks">{fler ? "Velg ett eller flere alternativer." : "Velg ett alternativ."}</p>
      <ul className="alternativer" role={fler ? "group" : "radiogroup"}>
        {rekkefolge.map((i, pos) => {
          const a = alt[i];
          const er = valgt.includes(i);
          let tilstand = "";
          if (laast) {
            if (a.riktig && er) tilstand = "riktig-valgt";
            else if (a.riktig) tilstand = fase === "fasit" ? "riktig-valgt" : "riktig-ikke-valgt";
            else if (er) tilstand = "feil-valgt";
            else tilstand = "noytral";
          }
          return (
            <li key={i} className={`alternativ ${er ? "valgt" : ""} ${tilstand}`}>
              <button
                type="button"
                role={fler ? "checkbox" : "radio"}
                aria-checked={er}
                disabled={laast}
                onClick={() => velg(i)}
                className="alternativ-knapp"
              >
                <span className={`velger ${fler ? "firkant" : "rund"}`} aria-hidden="true" />
                <span className="alternativ-bokstav" aria-hidden="true">
                  {String.fromCharCode(65 + pos)}
                </span>
                <Html html={a.html} as="span" className="alternativ-tekst" />
                {laast && tilstand !== "noytral" && (
                  <span className="alternativ-dom">
                    {tilstand === "riktig-valgt" && (
                      <>
                        <IkonRiktig /> {fase === "fasit" ? "Riktig svar" : "Riktig, og du valgte det"}
                      </>
                    )}
                    {tilstand === "riktig-ikke-valgt" && (
                      <>
                        <IkonRiktig /> Riktig svar, ikke valgt
                      </>
                    )}
                    {tilstand === "feil-valgt" && (
                      <>
                        <IkonFeil /> Feil, du valgte det
                      </>
                    )}
                  </span>
                )}
              </button>
              {laast && <Html html={a.forklaringHtml} as="p" className="alternativ-forklaring" />}
            </li>
          );
        })}
      </ul>
      {fase === "svarer" && (
        <div className="svarlinje">
          <button type="button" className="knapp" disabled={valgt.length === 0} onClick={() => onFerdig(scoreValg(o, valgt), valgt)}>
            Sjekk svar
          </button>
          {valgt.length === 0 && <span className="dempet">Velg et svar først.</span>}
        </div>
      )}
      {fase === "vurdert" && (
        <p className="eksamenspoeng">
          På eksamen ville dette svaret gitt <strong>{formaterPoeng(ep.poeng)}</strong> av {ep.maks} {ep.maks === 1 ? "poeng" : "mulige poeng"}
          {fler ? " (+1 per riktig kryss, −1 per feil kryss)." : `. Feil svar gir ${formaterPoeng(-1 / (alt.length - 1))} med ${alt.length} alternativer.`}
        </p>
      )}
    </div>
  );
}
