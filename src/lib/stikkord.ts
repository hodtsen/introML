// Forhåndsmarkering av vurderingspunkter i tekstsvar. Et punkt foreslås som
// dekket når minst ett av stikkordene finnes i svaret. Stikkord kan inneholde
// «|» for alternativer innenfor samme stikkord og «+» for ord som alle må finnes,
// f.eks. «overfit|overtilpass» eller «lav+bias».

export function normaliser(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9æøå+\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function treffStikkord(svar: string, stikkord: string[]): boolean {
  const tekst = " " + normaliser(svar) + " ";
  return stikkord.some((sk) =>
    sk.split("|").some((alt) =>
      alt
        .split("+")
        .map((d) => normaliser(d))
        .filter(Boolean)
        .every((ord) => tekst.includes(ord))
    )
  );
}
