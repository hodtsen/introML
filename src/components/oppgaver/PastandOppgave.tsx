import { useState } from "react";
import type { TypeProps } from "./OppgaveKort";

export default function PastandOppgave({ o, fase, onFerdig }: TypeProps) {
  const [valg, setValg] = useState<boolean | null>(null);
  const [begrunnelse, setBegrunnelse] = useState("");
  const laast = fase !== "svarer";
  const fasit = o.riktig!;
  return (
    <div className="pastand">
      <p className="instruks">Er påstanden riktig eller gal? Begrunn svaret før du sjekker. Begrunnelsen er det eksamen egentlig tester.</p>
      <div className="pastand-valg" role="radiogroup" aria-label="Riktig eller galt">
        {[true, false].map((v) => {
          let kl = valg === v ? "valgt" : "";
          if (laast) kl += v === fasit ? " riktig-valgt" : valg === v ? " feil-valgt" : " noytral";
          return (
            <button key={String(v)} type="button" role="radio" aria-checked={valg === v} disabled={laast} className={`pastand-knapp ${kl}`} onClick={() => setValg(v)}>
              {v ? "Riktig" : "Galt"}
            </button>
          );
        })}
      </div>
      <label className="tekstfelt">
        <span>Begrunnelse</span>
        <textarea
          value={begrunnelse}
          onChange={(e) => setBegrunnelse(e.target.value)}
          readOnly={laast}
          rows={3}
          placeholder="Hvorfor? Skriv ett eller to setninger."
        />
      </label>
      {fase === "svarer" && (
        <div className="svarlinje">
          <button type="button" className="knapp" disabled={valg === null} onClick={() => onFerdig(valg === fasit ? 1 : 0, { valg, begrunnelse })}>
            Sjekk svar
          </button>
          {valg === null && <span className="dempet">Velg riktig eller galt først.</span>}
        </div>
      )}
      {laast && (
        <p className="pastand-fasit">
          Påstanden er <strong>{fasit ? "riktig" : "gal"}</strong>.
          {fase === "vurdert" && begrunnelse.trim() && " Sammenlign begrunnelsen din med forklaringen under."}
        </p>
      )}
    </div>
  );
}
