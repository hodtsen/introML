import { lazy, type ComponentType, type LazyExoticComponent } from "react";

// Register over figurer som kan settes inn i pensum med <!-- figur: navn -->
// eller i oppgaver med «figur: navn». Hver figur lastes først når den vises.
export const FIGURER: Record<string, { tittel: string; komponent: LazyExoticComponent<ComponentType> }> = {};

export function registrer(navn: string, tittel: string, last: () => Promise<{ default: ComponentType }>) {
  FIGURER[navn] = { tittel, komponent: lazy(last) };
}
