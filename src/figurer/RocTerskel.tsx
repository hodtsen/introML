import { useMemo, useState } from "react";
import Plot, { Glider, sti, fmt, Forklaring } from "./plot";

// 12 negative og 12 positive datapunkter med modellens sannsynlighet for klasse 1.
const NEG = [0.05, 0.1, 0.15, 0.22, 0.28, 0.33, 0.38, 0.45, 0.52, 0.58, 0.66, 0.74];
const POS = [0.3, 0.42, 0.48, 0.55, 0.61, 0.68, 0.72, 0.79, 0.84, 0.88, 0.93, 0.97];

function tell(t: number) {
  const TP = POS.filter((s) => s >= t).length;
  const FN = POS.length - TP;
  const FP = NEG.filter((s) => s >= t).length;
  const TN = NEG.length - FP;
  return { TP, FN, FP, TN };
}

export default function RocTerskel() {
  const [t, setT] = useState(0.5);
  const c = tell(t);
  const tpr = c.TP / POS.length;
  const fpr = c.FP / NEG.length;
  const prec = c.TP + c.FP ? c.TP / (c.TP + c.FP) : null;
  const acc = (c.TP + c.TN) / (POS.length + NEG.length);

  const roc = useMemo(() => {
    const terskler = [1.01, ...[...NEG, ...POS].sort((a, b) => b - a), 0];
    return terskler.map((x) => {
      const k = tell(x);
      return [k.FP / NEG.length, k.TP / POS.length] as [number, number];
    });
  }, []);
  const auc = useMemo(() => {
    let a = 0;
    for (let i = 1; i < roc.length; i++) a += (roc[i][0] - roc[i - 1][0]) * (roc[i][1] + roc[i - 1][1]) / 2;
    return a;
  }, [roc]);

  return (
    <div>
      <p className="figur-tittel">Terskel, confusion matrix og ROC-kurve</p>
      <Plot x={[0, 1]} y={[0, 3]} xlabel="modellens sannsynlighet for klasse 1" yticks={[]} rutenett={false} hoyde={170} tittel="Prediksjoner per klasse">
        {({ sx, sy, m, h }) => (
          <>
            <rect x={sx(t)} y={m.t} width={sx(1) - sx(t)} height={h - m.b - m.t} className="serie-noytral plot-flate" />
            <line x1={sx(t)} x2={sx(t)} y1={m.t} y2={h - m.b} className="plot-sikte" />
            <text x={sx(t) + 5} y={m.t + 12} className="plot-tick">
              predikert positiv
            </text>
            {NEG.map((s, i) => (
              <circle key={`n${i}`} cx={sx(s)} cy={sy(0.9)} r={6} className="plot-punkt serie-2" />
            ))}
            {POS.map((s, i) => (
              <rect key={`p${i}`} x={sx(s) - 5.5} y={sy(2.1) - 5.5} width={11} height={11} className="plot-punkt serie-1" />
            ))}
            <text x={m.v - 6} y={sy(0.9) + 4} textAnchor="end" className="plot-tick">
              neg.
            </text>
            <text x={m.v - 6} y={sy(2.1) + 4} textAnchor="end" className="plot-tick">
              pos.
            </text>
          </>
        )}
      </Plot>
      <Forklaring
        elementer={[
          { navn: "Faktisk positiv", klasse: "serie-1" },
          { navn: "Faktisk negativ", klasse: "serie-2" },
        ]}
      />
      <div className="figur-kontroller">
        <Glider etikett="Terskel" verdi={t} min={0} max={1} steg={0.01} onEndre={setT} />
      </div>
      <div className="figur-to" style={{ marginTop: "1rem" }}>
        <Plot x={[0, 1]} y={[0, 1]} xlabel="FPR" ylabel="TPR" bredde={420} hoyde={360} yticks={[0, 0.25, 0.5, 0.75, 1]} xticks={[0, 0.25, 0.5, 0.75, 1]} tittel="ROC-kurve">
          {({ sx, sy }) => (
            <>
              <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} className="plot-referanse" />
              <path d={sti(roc, sx, sy)} className="plot-linje serie-1" />
              <circle cx={sx(fpr)} cy={sy(tpr)} r={7} className="plot-hoverpunkt serie-1" />
            </>
          )}
        </Plot>
        <div>
          <div className="forvirring" role="table" aria-label="Confusion matrix">
            <span />
            <span className="fv-hode">Pred. negativ</span>
            <span className="fv-hode">Pred. positiv</span>
            <span className="fv-hode">Faktisk neg.</span>
            <span className="fv-celle fv-riktig">
              <strong>{c.TN}</strong>TN
            </span>
            <span className="fv-celle fv-feil">
              <strong>{c.FP}</strong>FP
            </span>
            <span className="fv-hode">Faktisk pos.</span>
            <span className="fv-celle fv-feil">
              <strong>{c.FN}</strong>FN
            </span>
            <span className="fv-celle fv-riktig">
              <strong>{c.TP}</strong>TP
            </span>
          </div>
          <div className="figur-verdier" style={{ flexDirection: "column", alignItems: "flex-start" }}>
            <span>
              TPR (recall) = {c.TP}/12 = <strong>{fmt(tpr)}</strong>
            </span>
            <span>
              FPR = {c.FP}/12 = <strong>{fmt(fpr)}</strong>
            </span>
            <span>
              Precision = <strong>{prec === null ? "udefinert" : fmt(prec)}</strong>
            </span>
            <span>
              Accuracy = <strong>{fmt(acc)}</strong>
            </span>
            <span>
              AUC = <strong>{fmt(auc)}</strong> (uavhengig av terskelen)
            </span>
          </div>
        </div>
      </div>
      <p className="figur-tekst">
        Hvert mulig terskelvalg gir ett punkt (FPR, TPR). Lav terskel gir mange positive prediksjoner: høy recall, men mange falske alarmer. Høy terskel
        gir det motsatte. ROC-kurven samler alle tersklene, og arealet under den (AUC) er sannsynligheten for at et tilfeldig positivt punkt får høyere
        score enn et tilfeldig negativt. Den stiplede diagonalen er tilfeldig gjetting (AUC = 0,5).
      </p>
    </div>
  );
}
