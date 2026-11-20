// Statiske diagrammer: nevralt nettverk, RL-løkka og risikonivåene i AI Act.

export function NevraltNettverk() {
  const lag = [3, 4, 4, 1];
  const navn = ["Input-lag", "Skjult lag 1", "Skjult lag 2", "Output-lag"];
  const B = 640;
  const H = 300;
  const x = (l: number) => 80 + l * ((B - 160) / (lag.length - 1));
  const y = (l: number, i: number) => H / 2 + (i - (lag[l] - 1) / 2) * 58;
  return (
    <div>
      <p className="figur-tittel">Fullt koblet nevralt nettverk 3 → 4 → 4 → 1</p>
      <svg viewBox={`0 0 ${B} ${H + 40}`} className="diagram-svg" role="img" aria-label="Nevralt nettverk med tre input, to skjulte lag med fire noder og én output">
        {lag.slice(0, -1).map((n, l) =>
          Array.from({ length: n }).flatMap((_, i) =>
            Array.from({ length: lag[l + 1] }).map((__, j) => <line key={`${l}-${i}-${j}`} x1={x(l)} y1={y(l, i)} x2={x(l + 1)} y2={y(l + 1, j)} className="d-kant" />)
          )
        )}
        {lag.map((n, l) =>
          Array.from({ length: n }).map((_, i) => (
            <g key={`${l}-${i}`}>
              <circle cx={x(l)} cy={y(l, i)} r={17} className="d-node" />
              <text x={x(l)} y={y(l, i) + 5} textAnchor="middle" className="d-liten">
                {l === 0 ? `x${i + 1}` : l === lag.length - 1 ? "ŷ" : `a${i + 1}`}
              </text>
            </g>
          ))
        )}
        {navn.map((t, l) => (
          <text key={t} x={x(l)} y={H + 28} textAnchor="middle" className="d-tekst">
            {t}
          </text>
        ))}
      </svg>
      <p className="figur-tekst">
        Hver kant har en vekt, og hver node i de skjulte lagene og output-laget har en bias. Parametre: (3·4 + 4) + (4·4 + 4) + (4·1 + 1) = 16 + 20 + 5 = 41.
        Generelt gir et lag fra n til m noder n·m vekter og m biaser.
      </p>
    </div>
  );
}

export function RlLokke() {
  return (
    <div>
      <p className="figur-tittel">Samspillet mellom agent og miljø</p>
      <svg viewBox="0 0 640 260" className="diagram-svg" role="img" aria-label="Agenten velger handling, miljøet svarer med ny tilstand og belønning">
        <defs>
          <marker id="pil" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--ink-2)" />
          </marker>
        </defs>
        <rect x="240" y="20" width="160" height="64" rx="10" className="d-boks" />
        <text x="320" y="58" textAnchor="middle" className="d-tekst">
          Agent (policy π)
        </text>
        <rect x="240" y="176" width="160" height="64" rx="10" className="d-boks" />
        <text x="320" y="214" textAnchor="middle" className="d-tekst">
          Miljø (environment)
        </text>
        <path d="M400,52 H520 V208 H405" className="d-pil" markerEnd="url(#pil)" />
        <text x="530" y="134" className="d-tekst">
          handling aₜ
        </text>
        <path d="M240,198 H120 V52 H235" className="d-pil" markerEnd="url(#pil)" />
        <path d="M240,218 H90 V62 H235" className="d-pil" markerEnd="url(#pil)" />
        <text x="14" y="116" className="d-tekst">
          tilstand sₜ₊₁
        </text>
        <text x="14" y="140" className="d-tekst">
          belønning rₜ₊₁
        </text>
      </svg>
      <p className="figur-tekst">
        I hvert tidssteg ser agenten tilstanden sₜ og velger en handling aₜ. Miljøet svarer med ny tilstand sₜ₊₁ og belønning rₜ₊₁. Målet er å velge
        handlinger som gir størst mulig samlet (diskontert) belønning over tid, ikke størst belønning i neste steg.
      </p>
    </div>
  );
}

export function AiActRisiko() {
  const nivaer = [
    { tittel: "Uakseptabel risiko", tekst: "Forbudt (art. 5): sosial scoring, manipulering, følelsesgjenkjenning på jobb og i utdanning", farge: "var(--bad)", b: 330 },
    { tittel: "Høy risiko", tekst: "Strenge krav (art. 6 og 9–15): utdanning, rekruttering, kredittvurdering, kritisk infrastruktur", farge: "var(--series-2)", b: 420 },
    { tittel: "Begrenset risiko", tekst: "Åpenhetskrav (art. 50): chatboter må si fra, KI-generert innhold merkes", farge: "var(--series-1)", b: 510 },
    { tittel: "Øvrige systemer", tekst: "Ingen egne krav i forordningen, for eksempel spamfiltre", farge: "var(--ink-3)", b: 600 },
  ];
  return (
    <div>
      <p className="figur-tittel">Risikonivåene i AI Act</p>
      <svg viewBox="0 0 640 345" className="diagram-svg" role="img" aria-label="Risikopyramide med fire nivåer">
        {nivaer.map((n, i) => {
          const y = 10 + i * 83;
          const x = (640 - n.b) / 2;
          return (
            <g key={n.tittel}>
              <rect x={x} y={y} width={n.b} height={76} rx={8} fill={n.farge} opacity={0.16} />
              <rect x={x} y={y} width={6} height={76} rx={3} fill={n.farge} />
              <text x={320} y={y + 28} textAnchor="middle" className="d-tekst" style={{ fontWeight: 600 }}>
                {n.tittel}
              </text>
              <foreignObject x={x + 12} y={y + 34} width={n.b - 24} height={40}>
                <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.3, textAlign: "center", color: "var(--ink-2)", fontFamily: "var(--font-ui)" }}>{n.tekst}</p>
              </foreignObject>
            </g>
          );
        })}
      </svg>
      <p className="figur-tekst">
        Kravene øker med risikoen. GPAI-modeller (general purpose AI) har egne regler ved siden av denne inndelingen (9.5). Et system i et Anneks
        3-område kan unntas fra høyrisiko hvis det bare gjør en snever, prosedyremessig oppgave, men aldri hvis det profilerer enkeltpersoner.
      </p>
    </div>
  );
}
