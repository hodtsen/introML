// Datatyper for innholdet som scripts/build-content.mjs lager.

export type Del = { type: "html"; html: string } | { type: "figur"; navn: string };

export type SeksjonKey =
  | "introduksjon"
  | "begreper"
  | "forklaring"
  | "formler"
  | "sammenhenger"
  | "misforstaelser"
  | "oppsummering";

export const SEKSJONER: { key: SeksjonKey; tittel: string }[] = [
  { key: "introduksjon", tittel: "Introduksjon" },
  { key: "begreper", tittel: "Begreper" },
  { key: "forklaring", tittel: "Forklaring" },
  { key: "formler", tittel: "Formler" },
  { key: "sammenhenger", tittel: "Sammenhenger" },
  { key: "misforstaelser", tittel: "Vanlige misforståelser" },
  { key: "oppsummering", tittel: "Dette må du kunne" },
];

export interface DelkapittelMeta {
  nr: string;
  slug: string;
  tittel: string;
  ord: number;
}

export interface KapittelMeta {
  nr: number;
  tittel: string;
  kilder: string;
  introHtml: string;
  delkapitler: DelkapittelMeta[];
}

export interface Delkapittel extends DelkapittelMeta {
  kildeHtml: string;
  seksjoner: Record<SeksjonKey, Del[]>;
}

export interface Kapittel extends Omit<KapittelMeta, "delkapitler"> {
  fil: string;
  delkapitler: Delkapittel[];
}

export interface Begrep {
  term: string;
  termHtml: string;
  defHtml: string;
  del: string;
}

export interface SokPost {
  del: string;
  tittel: string;
  begreper: string[];
  tekst: string;
}

// ---------------------------------------------------------------- oppgaver

export type Niva = "grunnleggende" | "middels" | "avansert";
export type OppgaveType = "enkeltvalg" | "flervalg" | "pastand" | "tall" | "tekst";

export const NIVA_NAVN: Record<Niva, string> = {
  grunnleggende: "Grunnleggende",
  middels: "Middels",
  avansert: "Avansert",
};

export const TYPE_NAVN: Record<OppgaveType, string> = {
  enkeltvalg: "Enkeltvalg",
  flervalg: "Flervalg",
  pastand: "Påstand",
  tall: "Regneoppgave",
  tekst: "Tekstsvar",
};

export interface Alternativ {
  html: string;
  riktig: boolean;
  forklaringHtml: string;
}

export interface TallDel {
  sporsmalHtml: string;
  svar: number;
  toleranse: number | null;
  relativ: number | null;
  enhet: string;
}

export interface Vurderingspunkt {
  html: string;
  tekst: string;
  stikkord: string[];
}

export interface FigurData {
  type: "linje" | "punkter" | "stolper";
  tittel?: string;
  xlabel?: string;
  ylabel?: string;
  x?: number[];
  serier?: { navn: string; y: number[] }[];
  punkter?: { x: number; y: number; klasse?: number | string }[];
  klassenavn?: Record<string, string>;
  kategorier?: string[];
  verdier?: number[];
  ymin?: number;
  ymax?: number;
}

export interface Oppgave {
  id: string;
  del: string;
  kap: number;
  niva: Niva;
  type: OppgaveType;
  tags: string[];
  sporsmalHtml: string;
  kort: string;
  huskHtml: string;
  forklaringHtml?: string;
  /** Avsnitt i forelesningsnotatene (brukes av notatquizen). */
  kilde?: string;
  figur?: { navn?: string; data?: FigurData };
  // enkeltvalg / flervalg
  alternativer?: Alternativ[];
  eksamen?: boolean;
  // påstand
  riktig?: boolean;
  // tall
  deler?: TallDel[];
  losningHtml?: string;
  // tekst
  eksempelsvarHtml?: string;
  punkter?: Vurderingspunkt[];
  sporsmalTekst?: string;
  eksempelsvarTekst?: string;
}

export interface OppgaveMeta {
  id: string;
  del: string;
  kap: number;
  niva: Niva;
  type: OppgaveType;
  tags: string[];
  eksamen: boolean;
  antallAlt: number;
  antallRiktige: number;
}
