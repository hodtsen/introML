import { Suspense } from "react";
import { FIGURER } from "./registry";
import "./register";

export default function Figur({ navn }: { navn: string }) {
  const f = FIGURER[navn];
  if (!f) {
    return (
      <div className="figur figur-mangler" role="note">
        Figuren «{navn}» finnes ikke.
      </div>
    );
  }
  const K = f.komponent;
  return (
    <figure className="figur" aria-label={f.tittel}>
      <Suspense fallback={<div className="figur-laster">Laster figuren …</div>}>
        <K />
      </Suspense>
    </figure>
  );
}
