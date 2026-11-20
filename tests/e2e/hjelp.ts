import type { Page } from "@playwright/test";

// Samler konsollfeil og uventede unntak på siden.
export function fangFeil(page: Page) {
  const feil: string[] = [];
  page.on("pageerror", (e) => feil.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") feil.push(m.text());
  });
  return feil;
}
