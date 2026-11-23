// Bygger faginnhold og oppgavebank til JSON som appen laster inn.
//
//   content/pensum/NN-*.md      -> src/generated/pensum/kapN.json (+ indeks, begreper, søk)
//   content/oppgaver/kapN.yaml  -> src/generated/oppgaver/kapN.json (+ indeks)
//   content/notatquiz/*.yaml    -> src/generated/notatquiz/{notater,eksempler,prosjekter}.json
//
// Skriptet stopper med feilkode hvis innholdet ikke er gyldig: manglende
// seksjoner, formler som ikke lar seg sette, oppgaver som peker til ukjente
// delkapitler, flervalg uten riktig svar osv. Kjøres automatisk av
// `npm run dev` og `npm run build`.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";
import katex from "katex";
import * as yaml from "js-yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pensumDir = path.join(root, "content", "pensum");
const oppgaveDir = path.join(root, "content", "oppgaver");
const outDir = path.join(root, "src", "generated");

const SEKSJONER = [
  ["Introduksjon", "introduksjon"],
  ["Begreper", "begreper"],
  ["Forklaring", "forklaring"],
  ["Formler", "formler"],
  ["Sammenhenger", "sammenhenger"],
  ["Vanlige misforståelser", "misforstaelser"],
  ["Eksamensoppsummering", "oppsummering"],
];
const NIVAER = ["grunnleggende", "middels", "avansert"];
const TYPER = ["enkeltvalg", "flervalg", "pastand", "tall", "tekst"];
const FIGURER_TILLATT = /^[a-z0-9-]+$/;

const errors = [];
const feil = (hvor, melding) => errors.push(`${hvor}: ${melding}`);

const md = new MarkdownIt({ html: true, linkify: false, typographer: false });
let mathCount = 0;

function renderTex(tex, displayMode, hvor) {
  mathCount++;
  try {
    return katex.renderToString(tex, {
      displayMode,
      output: "html",
      throwOnError: true,
      strict: "ignore",
    });
  } catch (e) {
    feil(hvor, `KaTeX: ${e.message} i «${tex.slice(0, 80)}»`);
    return `<code>${tex}</code>`;
  }
}

// Markdown med $…$ og $$…$$ til HTML. Kode beskyttes slik at $ i kode ikke tolkes som matte.
function renderMarkdown(src, hvor, { inline = false } = {}) {
  if (src === undefined || src === null) return "";
  src = String(src);
  const code = [];
  let s = src.replace(/```[\s\S]*?```/g, (m) => {
    code.push(m);
    return `@@C${code.length - 1}@@`;
  });
  s = s.replace(/`[^`\n]+`/g, (m) => {
    code.push(m);
    return `@@C${code.length - 1}@@`;
  });
  const math = [];
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    math.push(renderTex(tex.trim(), true, hvor));
    return `@@D${math.length - 1}@@`;
  });
  s = s.replace(/\$([^$\n]+?)\$/g, (_, tex) => {
    math.push(renderTex(tex.trim(), false, hvor));
    return `@@I${math.length - 1}@@`;
  });
  if (s.includes("$")) {
    const linje = s.split("\n").find((l) => l.includes("$"));
    feil(hvor, `ubalansert $ i «${linje.trim().slice(0, 100)}»`);
  }
  s = s.replace(/@@C(\d+)@@/g, (_, i) => code[+i]);
  let html = inline ? md.renderInline(s) : md.render(s);
  html = html
    .replace(/<p>@@D(\d+)@@<\/p>/g, (_, i) => `<div class="math-display">${math[+i]}</div>`)
    .replace(/@@D(\d+)@@/g, (_, i) => `<span class="math-display">${math[+i]}</span>`)
    .replace(/@@I(\d+)@@/g, (_, i) => math[+i])
    .replace(/<table>/g, '<div class="tabell"><table>')
    .replace(/<\/table>/g, "</table></div>");
  return html;
}

// Deler en seksjon i HTML-biter og figurmarkører: <!-- figur: navn -->
function renderDeler(src, hvor) {
  const deler = [];
  const re = /^<!--\s*figur:\s*([a-z0-9-]+)\s*-->\s*$/gm;
  let sist = 0;
  let m;
  while ((m = re.exec(src))) {
    const før = src.slice(sist, m.index);
    if (før.trim()) deler.push({ type: "html", html: renderMarkdown(før, hvor) });
    deler.push({ type: "figur", navn: m[1] });
    sist = m.index + m[0].length;
  }
  const rest = src.slice(sist);
  if (rest.trim()) deler.push({ type: "html", html: renderMarkdown(rest, hvor) });
  return deler;
}

function tilRentekst(src) {
  return src
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\$\$[\s\S]+?\$\$/g, " ")
    .replace(/\$([^$\n]+?)\$/g, (_, t) => " " + t.replace(/\\[a-zA-Z]+/g, " ").replace(/[{}_^]/g, " ") + " ")
    .replace(/[*_`#>|]/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFrontmatter(raw, hvor) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) {
    feil(hvor, "mangler frontmatter");
    return [{}, raw];
  }
  return [yaml.load(m[1]), raw.slice(m[0].length)];
}

function parseBegreper(src, del, hvor) {
  const items = [];
  let cur = null;
  for (const line of src.split("\n")) {
    const m = line.match(/^- \*\*(.+?)\*\*\s*(.*)$/);
    if (m) {
      if (cur) items.push(cur);
      let term = m[1];
      let def = m[2];
      if (term.endsWith(":")) term = term.slice(0, -1);
      else if (def.startsWith(":")) def = def.slice(1);
      cur = { term: term.trim(), def: def.trim() };
    } else if (cur && /^\s+\S/.test(line)) {
      cur.def += " " + line.trim();
    } else if (cur && line.trim() === "") {
      // tom linje avslutter ikke nødvendigvis, men neste ikke-innrykkede linje gjør
    } else if (cur) {
      items.push(cur);
      cur = null;
    }
  }
  if (cur) items.push(cur);
  if (items.length === 0) {
    // Begreper kan også stå som tabell: første kolonne er begrepet, resten forklaringen.
    const rader = src.split("\n").filter((l) => /^\|.*\|\s*$/.test(l.trim()));
    if (rader.length >= 3) {
      const celler = (l) => l.trim().slice(1, -1).split("|").map((c) => c.trim());
      const hode = celler(rader[0]);
      for (const r of rader.slice(2)) {
        const c = celler(r);
        const deler = [c[1]];
        for (let i = 2; i < c.length; i++) if (c[i]) deler.push(`${hode[i]}: ${c[i]}`);
        items.push({ term: c[0], def: deler.filter(Boolean).join(". ") });
      }
    }
  }
  if (items.length === 0) feil(hvor, "fant ingen begreper på formen «- **Begrep:** definisjon» eller som tabell");
  return items.map((b) => ({
    term: b.term,
    termHtml: renderMarkdown(b.term, hvor, { inline: true }),
    defHtml: renderMarkdown(b.def, hvor, { inline: true }),
    del,
  }));
}

// ---------------------------------------------------------------- pensum
const kapitler = [];
const begreper = [];
const sok = [];
const delkapIds = new Set();
const figurerIBruk = new Set();

const filer = fs.readdirSync(pensumDir).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();
for (const fil of filer) {
  const raw = fs.readFileSync(path.join(pensumDir, fil), "utf8").replace(/\r\n/g, "\n");
  const [fm, body] = parseFrontmatter(raw, fil);
  const nr = Number(fm.kapittel);
  const lines = body.split("\n");
  const subStart = [];
  lines.forEach((l, i) => {
    if (/^## /.test(l)) subStart.push(i);
  });
  const introLines = lines.slice(0, subStart[0] ?? lines.length).filter((l) => !/^# /.test(l) && l.trim() !== "---");
  const kap = {
    nr,
    tittel: fm.tittel,
    kilder: fm.kilder,
    fil,
    introHtml: renderMarkdown(introLines.join("\n"), `${fil} (innledning)`),
    delkapitler: [],
  };
  subStart.forEach((start, si) => {
    const end = subStart[si + 1] ?? lines.length;
    const head = lines[start].match(/^## (\d+\.\d+) (.+?) \{#([a-z0-9-]+)\}\s*$/);
    const hvorBase = `${fil}:${start + 1}`;
    if (!head) {
      feil(hvorBase, `delkapittel-overskrift har feil format: «${lines[start]}»`);
      return;
    }
    const [, dnr, tittel, slug] = head;
    if (!dnr.startsWith(`${nr}.`)) feil(hvorBase, `delkapittel ${dnr} ligger i kapittel ${nr}`);
    if (delkapIds.has(dnr)) feil(hvorBase, `delkapittel ${dnr} finnes flere ganger`);
    delkapIds.add(dnr);
    const sub = lines.slice(start + 1, end);
    while (sub.length && (sub[sub.length - 1].trim() === "" || sub[sub.length - 1].trim() === "---")) sub.pop();
    // kildelinje
    let kilder = "";
    const kildeIdx = sub.findIndex((l) => /^\*Kilder?:/.test(l.trim()));
    if (kildeIdx >= 0 && kildeIdx < 4) {
      kilder = sub[kildeIdx].trim().replace(/^\*/, "").replace(/\*$/, "");
      sub.splice(kildeIdx, 1);
    } else feil(hvorBase, "mangler kildelinje (*Kilder: …*)");
    // seksjoner
    const secIdx = [];
    sub.forEach((l, i) => {
      if (/^### /.test(l)) secIdx.push(i);
    });
    const navn = secIdx.map((i) => sub[i].slice(4).trim());
    const forventet = SEKSJONER.map((s) => s[0]);
    if (navn.join("|") !== forventet.join("|"))
      feil(hvorBase, `seksjonene er [${navn.join(", ")}], forventet [${forventet.join(", ")}]`);
    const seksjoner = {};
    let begrepSrc = "";
    let alleSrc = "";
    secIdx.forEach((i, k) => {
      const tekst = sub.slice(i + 1, secIdx[k + 1] ?? sub.length).join("\n").replace(/\n---\s*$/, "");
      const key = SEKSJONER.find((s) => s[0] === navn[k])?.[1] ?? navn[k];
      const hvor = `${fil} ${dnr} ${navn[k]}`;
      seksjoner[key] = renderDeler(tekst, hvor);
      for (const d of seksjoner[key]) if (d.type === "figur") figurerIBruk.add(d.navn);
      if (key === "begreper") begrepSrc = tekst;
      alleSrc += "\n" + tekst;
    });
    const dBegreper = parseBegreper(begrepSrc, dnr, `${fil} ${dnr} Begreper`);
    begreper.push(...dBegreper);
    sok.push({
      del: dnr,
      tittel,
      begreper: dBegreper.map((b) => tilRentekst(b.term)),
      tekst: tilRentekst(alleSrc),
    });
    kap.delkapitler.push({
      nr: dnr,
      slug,
      tittel,
      kildeHtml: renderMarkdown(kilder, `${hvorBase} kilder`, { inline: true }),
      seksjoner,
      ord: tilRentekst(alleSrc).split(" ").length,
    });
  });
  kapitler.push(kap);
}

// ---------------------------------------------------------------- oppgaver
const oppgaver = new Map(); // kap -> [oppgaver]
const oppgaveIds = new Set();
const indeks = [];

const krev = (o, felt, hvor) => {
  if (o[felt] === undefined || o[felt] === null || o[felt] === "") feil(hvor, `mangler feltet «${felt}»`);
};

function byggFigur(f, hvor) {
  if (!f) return undefined;
  if (typeof f === "string") {
    if (!FIGURER_TILLATT.test(f)) feil(hvor, `ugyldig figurnavn «${f}»`);
    figurerIBruk.add(f);
    return { navn: f };
  }
  if (f.type === "linje" || f.type === "punkter" || f.type === "stolper") {
    if (f.type === "linje" && !(Array.isArray(f.x) && Array.isArray(f.serier)))
      feil(hvor, "linjefigur trenger x og serier");
    if (f.type === "linje")
      for (const s of f.serier)
        if (!Array.isArray(s.y) || s.y.length !== f.x.length) feil(hvor, `serien «${s.navn}» har feil lengde`);
    if (f.type === "punkter" && !Array.isArray(f.punkter)) feil(hvor, "punktfigur trenger punkter");
    if (f.type === "stolper" && !(Array.isArray(f.kategorier) && Array.isArray(f.verdier)))
      feil(hvor, "stolpefigur trenger kategorier og verdier");
    return { data: f };
  }
  feil(hvor, `ukjent figurtype «${f.type}»`);
  return undefined;
}

function byggOppgave(o, hvor) {
  // Fanger LaTeX i doble anførselstegn i YAML, der \f, \b osv. blir kontrolltegn.
  const sjekkTegn = (v, sti) => {
    if (typeof v === "string" && /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(v))
      feil(hvor, `kontrolltegn i ${sti}: bruk enkle anførselstegn eller blokk (|) for tekst med LaTeX`);
    else if (Array.isArray(v)) v.forEach((x, i) => sjekkTegn(x, `${sti}[${i}]`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) sjekkTegn(x, `${sti}.${k}`);
  };
  sjekkTegn(o, "oppgaven");
  krev(o, "id", hvor);
  if (oppgaveIds.has(o.id)) feil(hvor, "id finnes fra før");
  oppgaveIds.add(o.id);
  const del = String(o.del ?? "");
  if (!delkapIds.has(del)) feil(hvor, `ukjent delkapittel «${del}»`);
  const kap = Number(del.split(".")[0]);
  if (!NIVAER.includes(o.niva)) feil(hvor, `ugyldig nivå «${o.niva}»`);
  if (!TYPER.includes(o.type)) feil(hvor, `ugyldig type «${o.type}»`);
  krev(o, "sporsmal", hvor);
  krev(o, "husk", hvor);
  const ut = {
    id: o.id,
    del,
    kap,
    niva: o.niva,
    type: o.type,
    tags: [...new Set([...(o.tags ?? []), ...(o.figur || /\|---/.test(String(o.sporsmal)) ? ["figur"] : []), ...(/```/.test(String(o.sporsmal)) ? ["kode"] : [])])],
    sporsmalHtml: renderMarkdown(o.sporsmal, hvor),
    kort: tilRentekst(String(o.sporsmal ?? "")).slice(0, 170),
    huskHtml: renderMarkdown(o.husk, hvor, { inline: true }),
    figur: byggFigur(o.figur, hvor),
  };
  if (o.forklaring) ut.forklaringHtml = renderMarkdown(o.forklaring, hvor);
  if (o.kilde) ut.kilde = String(o.kilde);
  if (o.type === "enkeltvalg" || o.type === "flervalg") {
    const alt = o.alternativer;
    if (!Array.isArray(alt) || alt.length < 3) feil(hvor, "trenger minst tre alternativer");
    else {
      const riktige = alt.filter((a) => a.riktig === true).length;
      if (o.type === "enkeltvalg" && riktige !== 1) feil(hvor, `enkeltvalg må ha nøyaktig ett riktig svar (har ${riktige})`);
      if (o.type === "flervalg" && riktige < 1) feil(hvor, "flervalg må ha minst ett riktig svar");
      alt.forEach((a, i) => {
        if (!a.tekst && a.tekst !== 0) feil(hvor, `alternativ ${i + 1} mangler tekst`);
        if (!a.forklaring) feil(hvor, `alternativ ${i + 1} mangler forklaring`);
      });
      const tekster = alt.map((a) => String(a.tekst));
      if (new Set(tekster).size !== tekster.length) feil(hvor, "to alternativer har samme tekst");
      ut.alternativer = alt.map((a) => ({
        html: renderMarkdown(String(a.tekst), hvor, { inline: true }),
        riktig: a.riktig === true,
        forklaringHtml: renderMarkdown(a.forklaring, hvor, { inline: true }),
      }));
    }
    ut.eksamen = o.eksamen !== false;
    if (!o.forklaring) feil(hvor, "mangler samlet forklaring («forklaring»)");
  }
  if (o.type === "pastand") {
    if (typeof o.riktig !== "boolean") feil(hvor, "påstand trenger «riktig: true/false»");
    ut.riktig = o.riktig;
    krev(o, "forklaring", hvor);
  }
  if (o.type === "tall") {
    if (!Array.isArray(o.deler) || o.deler.length === 0) feil(hvor, "regneoppgave trenger «deler»");
    else
      ut.deler = o.deler.map((d, i) => {
        if (typeof d.svar !== "number") feil(hvor, `del ${i + 1}: «svar» må være et tall`);
        return {
          sporsmalHtml: renderMarkdown(d.sporsmal ?? "", hvor, { inline: true }),
          svar: d.svar,
          toleranse: d.toleranse ?? null,
          relativ: d.relativ ?? (d.toleranse === undefined ? 0.02 : null),
          enhet: d.enhet ?? "",
        };
      });
    krev(o, "losning", hvor);
    ut.losningHtml = renderMarkdown(o.losning, hvor);
  }
  if (o.type === "tekst") {
    krev(o, "eksempelsvar", hvor);
    ut.eksempelsvarHtml = renderMarkdown(o.eksempelsvar, hvor);
    if (!Array.isArray(o.punkter) || o.punkter.length < 2) feil(hvor, "tekstoppgave trenger minst to vurderingspunkter");
    else
      ut.punkter = o.punkter.map((p, i) => {
        if (!p.tekst) feil(hvor, `vurderingspunkt ${i + 1} mangler tekst`);
        if (!Array.isArray(p.stikkord) || p.stikkord.length === 0) feil(hvor, `vurderingspunkt ${i + 1} mangler stikkord`);
        return { html: renderMarkdown(p.tekst, hvor, { inline: true }), tekst: p.tekst, stikkord: p.stikkord ?? [] };
      });
    ut.sporsmalTekst = tilRentekst(String(o.sporsmal));
    ut.eksempelsvarTekst = tilRentekst(String(o.eksempelsvar ?? ""));
  }
  return { ut, del, kap };
}

const oppgFiler = fs.existsSync(oppgaveDir)
  ? fs.readdirSync(oppgaveDir).filter((f) => /^kap\d+\.ya?ml$/.test(f)).sort()
  : [];
for (const fil of oppgFiler) {
  let liste;
  try {
    liste = yaml.load(fs.readFileSync(path.join(oppgaveDir, fil), "utf8"));
  } catch (e) {
    feil(fil, `YAML-feil: ${e.message}`);
    continue;
  }
  if (!Array.isArray(liste)) {
    feil(fil, "filen må være en liste med oppgaver");
    continue;
  }
  for (const o of liste) {
    const hvor = `${fil} ${o?.id ?? "(uten id)"}`;
    const { ut, del, kap } = byggOppgave(o, hvor);
    if (`kap${kap}.yaml` !== fil && `kap${kap}.yml` !== fil) feil(hvor, `delkapittel ${del} hører ikke hjemme i ${fil}`);
    if (!oppgaver.has(kap)) oppgaver.set(kap, []);
    oppgaver.get(kap).push(ut);
    indeks.push({
      id: ut.id,
      del,
      kap,
      niva: ut.niva,
      type: ut.type,
      tags: ut.tags,
      eksamen: Boolean(ut.eksamen),
      antallAlt: ut.alternativer?.length ?? 0,
      antallRiktige: ut.alternativer?.filter((a) => a.riktig).length ?? 0,
    });
  }
}

// ---------------------------------------------------------------- notatquiz
// content/notatquiz/notater-*.yaml, eksempler.yaml og prosjekter.yaml -> src/generated/notatquiz/<sett>.json
// Notatquizen holdes utenfor oppgavebanken: den får ikke plass i indeksen, eksamenspoolen eller statistikken.
const notatquizDir = path.join(root, "content", "notatquiz");
const notatquiz = { notater: [], eksempler: [], prosjekter: [] };
if (fs.existsSync(notatquizDir)) {
  for (const fil of fs.readdirSync(notatquizDir).filter((f) => /\.ya?ml$/.test(f)).sort()) {
    const sett = Object.keys(notatquiz).find((s) => fil.startsWith(s)) ?? null;
    if (!sett) {
      feil(`notatquiz/${fil}`, "filnavnet må starte med «notater», «eksempler» eller «prosjekter»");
      continue;
    }
    let liste;
    try {
      liste = yaml.load(fs.readFileSync(path.join(notatquizDir, fil), "utf8"));
    } catch (e) {
      feil(`notatquiz/${fil}`, `YAML-feil: ${e.message}`);
      continue;
    }
    if (!Array.isArray(liste)) {
      feil(`notatquiz/${fil}`, "filen må være en liste med oppgaver");
      continue;
    }
    for (const o of liste) {
      const hvor = `notatquiz/${fil} ${o?.id ?? "(uten id)"}`;
      if (!o.kilde) feil(hvor, "mangler feltet «kilde» (avsnitt i forelesningsnotatene)");
      notatquiz[sett].push(byggOppgave(o, hvor).ut);
    }
  }
  const sorter = (a, b) => a.id.localeCompare(b.id, "nb", { numeric: true });
  for (const liste of Object.values(notatquiz)) liste.sort(sorter);
}

// ---------------------------------------------------------------- skriv ut
const pensumOut = path.join(outDir, "pensum");
const oppgOut = path.join(outDir, "oppgaver");
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(pensumOut, { recursive: true });
fs.mkdirSync(oppgOut, { recursive: true });

const skriv = (fil, data) => fs.writeFileSync(fil, JSON.stringify(data));
const pensumIndeks = kapitler.map((k) => ({
  nr: k.nr,
  tittel: k.tittel,
  kilder: k.kilder,
  introHtml: k.introHtml,
  delkapitler: k.delkapitler.map((d) => ({ nr: d.nr, slug: d.slug, tittel: d.tittel, ord: d.ord })),
}));
skriv(path.join(outDir, "pensum-indeks.json"), pensumIndeks);
for (const k of kapitler) skriv(path.join(pensumOut, `kap${k.nr}.json`), k);
skriv(path.join(outDir, "begreper.json"), begreper);
skriv(path.join(outDir, "sok.json"), sok);
skriv(path.join(outDir, "oppgave-indeks.json"), indeks);
for (let k = 1; k <= kapitler.length; k++) skriv(path.join(oppgOut, `kap${k}.json`), oppgaver.get(k) ?? []);
skriv(path.join(outDir, "figurer-i-bruk.json"), [...figurerIBruk].sort());
fs.mkdirSync(path.join(outDir, "notatquiz"), { recursive: true });
skriv(path.join(outDir, "notatquiz", "notater.json"), notatquiz.notater);
skriv(path.join(outDir, "notatquiz", "eksempler.json"), notatquiz.eksempler);
skriv(path.join(outDir, "notatquiz", "prosjekter.json"), notatquiz.prosjekter);

const perType = {};
for (const o of indeks) perType[o.type] = (perType[o.type] ?? 0) + 1;
const perNiva = {};
for (const o of indeks) perNiva[o.niva] = (perNiva[o.niva] ?? 0) + 1;
console.log(
  `Pensum: ${kapitler.length} kapitler, ${delkapIds.size} delkapitler, ${begreper.length} begreper. ` +
    `Oppgaver: ${indeks.length} (${Object.entries(perType).map(([t, n]) => `${t} ${n}`).join(", ")}; ` +
    `${Object.entries(perNiva).map(([t, n]) => `${t} ${n}`).join(", ")}). Notatquiz: ${notatquiz.notater.length} + ${notatquiz.eksempler.length} + ${notatquiz.prosjekter.length}. Formler: ${mathCount}.`
);
if (errors.length) {
  console.error(`\n${errors.length} feil i innholdet:`);
  for (const e of errors.slice(0, 60)) console.error("  - " + e);
  process.exit(1);
}
