import { describe, expect, it } from "vitest";
import { erRiktigTall, lesTall } from "../../src/lib/tall";
import { treffStikkord } from "../../src/lib/stikkord";
import { oppgaveScore } from "../../src/lib/mestring";
import { rng, stokk } from "../../src/lib/tilfeldig";

describe("lesTall", () => {
  it("leser norske og engelske desimaltall", () => {
    expect(lesTall("0,25")).toBe(0.25);
    expect(lesTall("0.25")).toBe(0.25);
    expect(lesTall(" -3 ")).toBe(-3);
    expect(lesTall("1 234,5")).toBe(1234.5);
    expect(lesTall("−1,5")).toBe(-1.5);
  });
  it("leser brøk, prosent og eksponent", () => {
    expect(lesTall("2/3")).toBeCloseTo(0.6667, 4);
    expect(lesTall("25 %")).toBe(0.25);
    expect(lesTall("1e-3")).toBe(0.001);
  });
  it("avviser tekst som ikke er tall", () => {
    expect(lesTall("abc")).toBeNull();
    expect(lesTall("")).toBeNull();
    expect(lesTall("1,2,3")).toBeNull();
  });
});

describe("erRiktigTall", () => {
  const del = (svar: number, toleranse: number | null, relativ: number | null) => ({ sporsmalHtml: "", svar, toleranse, relativ, enhet: "" });
  it("bruker absolutt toleranse når den er gitt", () => {
    expect(erRiktigTall(0.574, del(0.574, 0.003, null))).toBe(true);
    expect(erRiktigTall(0.577, del(0.574, 0.003, null))).toBe(true);
    expect(erRiktigTall(0.58, del(0.574, 0.003, null))).toBe(false);
  });
  it("bruker relativ toleranse ellers", () => {
    expect(erRiktigTall(1.01, del(1, null, 0.02))).toBe(true);
    expect(erRiktigTall(1.03, del(1, null, 0.02))).toBe(false);
  });
  it("krever eksakt svar med toleranse 0", () => {
    expect(erRiktigTall(1360, del(1360, 0, null))).toBe(true);
    expect(erRiktigTall(1361, del(1360, 0, null))).toBe(false);
  });
});

describe("treffStikkord", () => {
  it("finner alternativer og kombinasjoner", () => {
    expect(treffStikkord("Modellen overtilpasser kraftig", ["overfit|overtilpass"])).toBe(true);
    expect(treffStikkord("lav bias og høy varians", ["lav+bias"])).toBe(true);
    expect(treffStikkord("høy bias", ["lav+bias"])).toBe(false);
    expect(treffStikkord("Recall er viktigst", ["recall", "tpr"])).toBe(true);
  });
  it("ignorerer store bokstaver og aksenter", () => {
    expect(treffStikkord("RECALL", ["recall"])).toBe(true);
  });
});

describe("oppgaveScore", () => {
  it("vekter nyeste forsøk mest", () => {
    const f = (score: number) => ({ t: 0, score, kilde: "oving" as const });
    expect(oppgaveScore(undefined)).toBeNull();
    expect(oppgaveScore([f(1)])).toBe(1);
    expect(oppgaveScore([f(1), f(0)])).toBeCloseTo(1 / 1.5);
    expect(oppgaveScore([f(0), f(1), f(1), f(1)])).toBeCloseTo(0.75 / 1.75);
  });
});

describe("stokk", () => {
  it("gir samme rekkefølge med samme seed og beholder elementene", () => {
    const a = stokk([1, 2, 3, 4, 5, 6], rng(42));
    const b = stokk([1, 2, 3, 4, 5, 6], rng(42));
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
