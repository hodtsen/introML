import { useState } from "react";
import Html from "../Html";
import { erRiktigTall, formaterTall, lesTall } from "../../lib/tall";
import type { TypeProps } from "./OppgaveKort";
import { IkonFeil, IkonRiktig } from "./OppgaveKort";

export default function TallOppgave({ o, fase, onFerdig }: TypeProps) {
  const deler = o.deler ?? [];
  const [svar, setSvar] = useState<string[]>(() => deler.map(() => ""));
  const laast = fase !== "svarer";
  const tolket = svar.map(lesTall);
  const kanSjekke = tolket.some((v) => v !== null);
  const riktig = tolket.map((v, i) => v !== null && erRiktigTall(v, deler[i]));

  const sjekk = () => {
    const andel = riktig.filter(Boolean).length / deler.length;
    onFerdig(andel, svar);
  };

  return (
    <div className="tall">
      <p className="instruks">Skriv svaret som tall. Både komma og punktum fungerer, og du kan skrive brøk som 2/3.</p>
      <ol className="talldeler">
        {deler.map((d, i) => (
          <li key={i} className={laast && fase === "vurdert" ? (riktig[i] ? "riktig-valgt" : "feil-valgt") : ""}>
            <label>
              {d.sporsmalHtml ? <Html html={d.sporsmalHtml} as="span" className="talldel-sporsmal" /> : <span className="talldel-sporsmal">Svar</span>}
              <span className="tallinput">
                <input
                  inputMode="decimal"
                  value={svar[i]}
                  readOnly={laast}
                  onChange={(e) => setSvar((s) => s.map((v, k) => (k === i ? e.target.value : v)))}
                  onKeyDown={(e) => e.key === "Enter" && kanSjekke && !laast && sjekk()}
                  aria-invalid={svar[i] !== "" && tolket[i] === null}
                />
                {d.enhet && <span className="enhet">{d.enhet}</span>}
              </span>
            </label>
            {svar[i] !== "" && tolket[i] === null && !laast && <span className="feilmelding-liten">Kan ikke lese «{svar[i]}» som et tall.</span>}
            {laast && (
              <span className="talldel-fasit">
                {fase === "vurdert" && (riktig[i] ? <IkonRiktig /> : <IkonFeil />)} Fasit: {formaterTall(d.svar)}
                {d.enhet ? ` ${d.enhet}` : ""}
              </span>
            )}
          </li>
        ))}
      </ol>
      {fase === "svarer" && (
        <div className="svarlinje">
          <button type="button" className="knapp" disabled={!kanSjekke} onClick={sjekk}>
            Sjekk svar
          </button>
          <span className="dempet">Svar innenfor avrundingsfeil godtas.</span>
        </div>
      )}
    </div>
  );
}
