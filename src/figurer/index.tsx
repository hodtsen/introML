import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";

// Register over figurer som kan settes inn i pensum med <!-- figur: navn -->
// eller i oppgaver med «figur: navn». Hver figur lastes først når den vises.
export const FIGURER: Record<string, { tittel: string; komponent: LazyExoticComponent<ComponentType> }> = {};

export function registrer(navn: string, tittel: string, last: () => Promise<{ default: ComponentType }>) {
  FIGURER[navn] = { tittel, komponent: lazy(last) };
}

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
