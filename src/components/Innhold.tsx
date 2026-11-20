import type { Del } from "../types";
import Html from "./Html";
import Figur from "../figurer";

// Viser en seksjon: HTML-biter med interaktive figurer der markdown har <!-- figur: navn -->.
export default function Innhold({ deler, className }: { deler: Del[]; className?: string }) {
  return (
    <div className={className}>
      {deler.map((d, i) => (d.type === "html" ? <Html key={i} html={d.html} className="prosa" /> : <Figur key={i} navn={d.navn} />))}
    </div>
  );
}
