import { describe, expect, it } from "vitest";
import { KAPITLER, OPPGAVER, lastKapittel, lastOppgaverForKapittel } from "../../src/data/innhold";
import { FIGURER } from "../../src/figurer/registry";
import "../../src/figurer/register";
import figurerIBruk from "../../src/generated/figurer-i-bruk.json";
import { SEKSJONER } from "../../src/types";

describe("pensum", () => {
  it("har 9 kapitler og 58 delkapitler", () => {
    expect(KAPITLER).toHaveLength(9);
    expect(KAPITLER.reduce((s, k) => s + k.delkapitler.length, 0)).toBe(58);
  });
  it("har alle sju seksjoner med innhold i hvert delkapittel", async () => {
    for (const k of KAPITLER) {
      const kap = await lastKapittel(k.nr);
      for (const d of kap.delkapitler) {
        for (const s of SEKSJONER) {
          expect(d.seksjoner[s.key]?.length, `${d.nr} ${s.key}`).toBeGreaterThan(0);
        }
        expect(d.ord, d.nr).toBeGreaterThan(250);
      }
    }
  });
  it("bruker bare figurer som finnes", () => {
    for (const navn of figurerIBruk as string[]) expect(FIGURER[navn], navn).toBeDefined();
  });
});

describe("oppgavebanken", () => {
  it("har minst seks oppgaver per delkapittel", () => {
    for (const k of KAPITLER)
      for (const d of k.delkapitler) expect(OPPGAVER.filter((o) => o.del === d.nr).length, d.nr).toBeGreaterThanOrEqual(6);
  });
  it("har alle tre nivåer og alle fem typer", () => {
    expect(new Set(OPPGAVER.map((o) => o.niva)).size).toBe(3);
    expect(new Set(OPPGAVER.map((o) => o.type)).size).toBe(5);
  });
  it("har unike id-er og gyldige flervalg", async () => {
    expect(new Set(OPPGAVER.map((o) => o.id)).size).toBe(OPPGAVER.length);
    for (const k of KAPITLER) {
      for (const o of await lastOppgaverForKapittel(k.nr)) {
        expect(o.huskHtml.length, o.id).toBeGreaterThan(0);
        if (o.type === "enkeltvalg") expect(o.alternativer!.filter((a) => a.riktig), o.id).toHaveLength(1);
        if (o.type === "flervalg") expect(o.alternativer!.some((a) => a.riktig), o.id).toBe(true);
        if (o.type === "enkeltvalg" || o.type === "flervalg") for (const a of o.alternativer!) expect(a.forklaringHtml.length, o.id).toBeGreaterThan(0);
        if (o.type === "tall") expect(o.deler!.length, o.id).toBeGreaterThan(0);
        if (o.type === "tekst") expect(o.punkter!.length, o.id).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
