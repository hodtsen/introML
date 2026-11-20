import { useState } from "react";
import Html from "../Html";
import { treffStikkord } from "../../lib/stikkord";
import type { TypeProps } from "./OppgaveKort";

function lagLedetekst(sporsmal: string, punkter: string[], eksempel: string, svar: string) {
  return [
    "Jeg øver til eksamen i TDT4172 Introduksjon til maskinlæring (NTNU). Vurder svaret mitt på oppgaven under faglig: se etter forståelse, ikke om jeg bruker samme ord som eksempelsvaret. Si kort hva som er riktig, hva som mangler eller er feil, og gi en samlet vurdering i prosent.",
    "",
    `Oppgave: ${sporsmal}`,
    "",
    "Vurderingspunkter:",
    ...punkter.map((p, i) => `${i + 1}. ${p}`),
    "",
    `Eksempelsvar: ${eksempel}`,
    "",
    `Mitt svar: ${svar}`,
  ].join("\n");
}

export default function TekstOppgave({ o, fase, onFerdig }: TypeProps) {
  const punkter = o.punkter ?? [];
  const [svar, setSvar] = useState("");
  const [steg, setSteg] = useState<"skriver" | "vurderer">("skriver");
  const [kryss, setKryss] = useState<boolean[]>([]);
  const [kopiert, setKopiert] = useState<"" | "ok" | "manuell">("");

  const startVurdering = () => {
    setKryss(punkter.map((p) => treffStikkord(svar, p.stikkord)));
    setSteg("vurderer");
  };

  const ledetekst = lagLedetekst(
    o.sporsmalTekst ?? "",
    punkter.map((p) => p.tekst),
    o.eksempelsvarTekst ?? "",
    svar
  );

  const kopier = async () => {
    try {
      await navigator.clipboard.writeText(ledetekst);
      setKopiert("ok");
    } catch {
      setKopiert("manuell");
    }
  };

  const viser = steg === "vurderer" || fase !== "svarer";
  const antall = kryss.filter(Boolean).length;

  return (
    <div className="tekstsvar">
      <label className="tekstfelt">
        <span>Ditt svar</span>
        <textarea
          value={svar}
          onChange={(e) => setSvar(e.target.value)}
          readOnly={viser}
          rows={6}
          placeholder="Skriv som du ville gjort på eksamen: kort, presist og med begrunnelse."
        />
      </label>
      {fase === "svarer" && steg === "skriver" && (
        <div className="svarlinje">
          <button type="button" className="knapp" disabled={svar.trim().length < 10} onClick={startVurdering}>
            Vurder svaret
          </button>
          <span className="dempet">Du får se eksempelsvaret og vurderingspunktene etterpå.</span>
        </div>
      )}
      {viser && (
        <div className="vurdering">
          <div className="eksempelsvar">
            <h4>Eksempelsvar</h4>
            <Html html={o.eksempelsvarHtml ?? ""} className="prosa" />
          </div>
          <div className="vurderingspunkter">
            <h4>Vurderingspunkter</h4>
            {fase === "svarer" && (
              <p className="dempet">
                Kryss av punktene svaret ditt dekker. Punkter der vi fant sentrale stikkord, er krysset av på forhånd. Sjekk at innholdet faktisk er
                riktig, ikke bare at ordet står der.
              </p>
            )}
            <ul>
              {punkter.map((p, i) => (
                <li key={i}>
                  {fase === "svarer" ? (
                    <label className="avkryssing">
                      <input type="checkbox" checked={kryss[i] ?? false} onChange={(e) => setKryss((k) => k.map((v, j) => (j === i ? e.target.checked : v)))} />
                      <Html html={p.html} as="span" />
                    </label>
                  ) : (
                    <Html html={p.html} as="span" />
                  )}
                </li>
              ))}
            </ul>
          </div>
          {fase === "svarer" && (
            <div className="svarlinje">
              <button type="button" className="knapp" onClick={() => onFerdig(antall / punkter.length, { svar, kryss })}>
                Lagre vurderingen ({antall} av {punkter.length})
              </button>
              <button type="button" className="knapp-tekst" onClick={() => setSteg("skriver")}>
                Endre svaret
              </button>
            </div>
          )}
          {svar.trim() && (
            <div className="claude-vurdering">
              <button type="button" className="knapp knapp-sekundaer knapp-liten" onClick={kopier}>
                Kopier ledetekst for vurdering hos Claude
              </button>
              {kopiert === "ok" && <span className="dempet">Kopiert. Lim den inn i en samtale med Claude.</span>}
              {kopiert === "manuell" && (
                <label className="tekstfelt">
                  <span>Kopier teksten under manuelt:</span>
                  <textarea readOnly rows={6} value={ledetekst} onFocus={(e) => e.currentTarget.select()} />
                </label>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
