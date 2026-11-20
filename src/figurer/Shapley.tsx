import { useState } from "react";
import { fmt } from "./plot";

// Koalisjoner av spillerne 1, 2, 3 som bitmasker.
const KOALISJONER = [0b000, 0b001, 0b010, 0b100, 0b011, 0b101, 0b110, 0b111];
const navn = (m: number) => (m === 0 ? "{ }" : `{${[1, 2, 3].filter((_, i) => m & (1 << i)).join(", ")}}`);
const FORHÅND: Record<string, { tittel: string; v: number[] }> = {
  taxi: { tittel: "Taxi (km)", v: [0, 3, 7, 10, 7, 10, 10, 10] },
  katter: { tittel: "Katter og mus", v: [0, 2, 4, 5, 3, 3, 2, 3] },
};
const REKKEFØLGER = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

export default function Shapley() {
  const [v, setV] = useState<number[]>(FORHÅND.taxi.v);
  const verdi = (m: number) => v[KOALISJONER.indexOf(m)];
  const bidrag = REKKEFØLGER.map((rek) => {
    let m = 0;
    const b = [0, 0, 0];
    for (const s of rek) {
      b[s] = verdi(m | (1 << s)) - verdi(m);
      m |= 1 << s;
    }
    return b;
  });
  const phi = [0, 1, 2].map((s) => bidrag.reduce((a, b) => a + b[s], 0) / 6);
  const sum = phi.reduce((a, b) => a + b, 0);
  return (
    <div>
      <p className="figur-tittel">Shapley-kalkulator for tre spillere</p>
      <div className="handlinger" style={{ marginTop: 0 }}>
        {Object.entries(FORHÅND).map(([k, f]) => (
          <button key={k} type="button" className="knapp knapp-liten knapp-sekundaer" onClick={() => setV(f.v)}>
            Last inn {f.tittel.toLowerCase()}
          </button>
        ))}
      </div>
      <div className="figur-to" style={{ marginTop: "0.75rem" }}>
        <div>
          <table className="tabell-mini">
            <thead>
              <tr>
                <th>Koalisjon S</th>
                <th>v(S)</th>
              </tr>
            </thead>
            <tbody>
              {KOALISJONER.map((m, i) => (
                <tr key={m}>
                  <td>{navn(m)}</td>
                  <td>
                    {m === 0 ? (
                      "0"
                    ) : (
                      <input
                        type="number"
                        step="any"
                        value={v[i]}
                        aria-label={`v av ${navn(m)}`}
                        onChange={(e) => setV((x) => x.map((y, j) => (j === i ? Number(e.target.value) || 0 : y)))}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <table className="tabell-mini">
            <thead>
              <tr>
                <th>Rekkefølge</th>
                <th>Bidrag 1</th>
                <th>Bidrag 2</th>
                <th>Bidrag 3</th>
              </tr>
            </thead>
            <tbody>
              {REKKEFØLGER.map((rek, i) => (
                <tr key={i}>
                  <td>{rek.map((s) => s + 1).join(" → ")}</td>
                  {bidrag[i].map((b, s) => (
                    <td key={s}>{fmt(b)}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td>
                  <strong>Snitt = φ</strong>
                </td>
                {phi.map((p, s) => (
                  <td key={s}>
                    <strong>{fmt(p)}</strong>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="figur-verdier">
        <span>
          φ₁ + φ₂ + φ₃ = <strong>{fmt(sum)}</strong>
        </span>
        <span>
          v({"{1, 2, 3}"}) = <strong>{fmt(verdi(7))}</strong>
        </span>
        <span>{Math.abs(sum - verdi(7)) < 1e-9 ? "Effektivitet: summen er lik verdien av storkoalisjonen." : ""}</span>
      </div>
      <p className="figur-tekst">
        Shapley-verdien er gjennomsnittet av en spillers marginale bidrag over alle rekkefølger spillerne kan komme i. Med tre spillere er det 3! = 6
        rekkefølger. Dette gir samme svar som formelen med vekter |S|!(|N| − |S| − 1)!/|N|!: 1/3 for den tomme koalisjonen, 1/6 for koalisjoner med én
        annen spiller og 1/3 for koalisjonen med begge de andre. Endre tallene og se at summen alltid blir v({"{1, 2, 3}"}).
      </p>
    </div>
  );
}
