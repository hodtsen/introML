# TDT4172 Eksamensportal

Lærings- og eksamensportal for **TDT4172 Introduksjon til maskinlæring** ved NTNU. Portalen dekker hele pensum med forklaringer, formler og interaktive figurer, har en oppgavebank med fasit og forklaringer, og simulerer eksamen etter formatet fra 2024 og 2025 og kunngjøringene for 2026.

Når branchen er merget til `main` og GitHub Pages er slått på (se [Publisering](#publisering-på-github-pages)), ligger portalen på **https://hodtsen.github.io/introML/**.

## Innhold

| Del | Hva |
|---|---|
| **Pensum** | 9 kapitler og 58 delkapitler. Hvert delkapittel har introduksjon, begreper, forklaring, formler, sammenhenger, vanlige misforståelser og «dette må du kunne». |
| **Figurer** | 14 interaktive figurer og diagrammer: sigmoid, gradient descent, terskel og ROC, entropi og Gini, bias–varians, gradient boosting, aktiveringer og softmax, k-means, PCA, ε-greedy, Shapley-kalkulator, nevralt nettverk, RL-løkka og risikonivåene i AI Act. |
| **Formelark og begrepsliste** | Alle formler samlet per kapittel, og 329 begreper med lenke til der de forklares. Søk med Ctrl+K. |
| **Oppgavebank** | 375 oppgaver, 6–9 per delkapittel, på tre nivåer: 169 enkeltvalg, 58 flervalg, 57 påstander, 39 regneoppgaver og 52 tekstoppgaver. 24 handler om å lese eller rette Python-kode, 13 om å tolke plott eller tabeller, og 38 er knyttet til øvingene og prosjekt 4. |
| **Øving** | Per delkapittel, per kapittel, blandet (filtrer på kapittel, nivå og type), kode- og figuroppgaver samlet, og repetisjon av feil. Fasit vises først etter at du har svart. |
| **Notatquiz** | Egen fane med tre quizer: alle 85 «Oppgave:»-ene i forelesningsnotatene (versjonen 23. november 2026), 47 spørsmål fra øving 1–3 og prosjekt 4, og de 10 eksempelspørsmålene fra notatenes siste kapittel. Alt er skrevet om med nok kontekst til å besvares alene. Kan filtreres på kapittel i notatene eller på prosjekt. Holdes utenfor oppgavebanken, eksamenssimuleringen og mestringstallene. |
| **Eksamenssimulering** | 40 flervalgsspørsmål fra hele pensum, med klokke, Inspera-regelen (enkeltvalg kan byttes, men ikke gjøres blanke igjen; flervalg kan krysses av og på fritt) og poeng etter 2026-kunngjøringen eller som eksamen 2025. Som på H25 er omtrent hvert tiende spørsmål om kode (H25-modus har en egen kodegruppe). Faste sett A–C eller tilfeldige sett, rapport med karakteranslag, mestring per kapittel og anbefalinger. |
| **Fremgang** | Mestringskart, historikk og eksport/import av fremgangen. Alt lagres lokalt i nettleseren. |

## Kom i gang

Krever Node.js 20 eller nyere (utviklet med Node 22).

```bash
npm install
npm run dev        # utviklingsserver på http://localhost:5173
npm run build      # produksjonsbygg i dist/
npm run preview    # server dist/ på http://localhost:4173
```

`npm run dev` og `npm run build` kjører først `npm run content`, som gjør innholdet om til JSON (se under).

## Testing

```bash
npm test                          # innholdsbygg + enhetstester (Vitest)
npm run check                     # innholdsbygg + typesjekk + enhetstester
npx playwright install chromium   # første gang
npm run test:e2e                  # ende-til-ende-tester mot bygget (Playwright)
```

Har du Chrome installert, kan du bruke den i stedet: `CHROME_PATH=/sti/til/chrome npm run test:e2e`.

- **Innholdsbygget** stopper med feilmelding hvis et delkapittel mangler en seksjon, en formel ikke lar seg sette, en oppgave peker til et ukjent delkapittel, et enkeltvalg ikke har nøyaktig ett riktig svar, et alternativ mangler forklaring, osv.
- **Enhetstestene** dekker poengreglene for 2026 og H25 (inkludert null-grense per gruppe), karakterskalaen, trekking av eksamenssett, tolking av tallsvar, stikkordmatching og innholdskravene (58 delkapitler med sju seksjoner, minst seks oppgaver per delkapittel, gyldige figurer).
- **Ende-til-ende-testene** åpner alle 58 delkapitler, sjekker formler og figurer, søk, formelark og begrepsliste, besvarer alle fem oppgavetyper, gjennomfører eksamen med levering, gjenopptakelse etter omlasting og automatisk levering ved tidsslutt, og tester mobilvisning.

Workflowen `Kontroll` kjører alt dette på pull requests.

## Prosjektstruktur

```
content/
  pensum/            01-…md … 09-…md   faginnholdet, ett kapittel per fil
  oppgaver/          kap1.yaml … kap9.yaml
  notatquiz/         notater-1…4.yaml (oppgavene i notatene), prosjekter.yaml og eksempler.yaml
scripts/
  build-content.mjs  markdown/YAML → src/generated/*.json, med KaTeX og validering
src/
  components/        layout, sidemeny, søk, mestringskart, oppgavekort
  components/oppgaver/  én komponent per oppgavetype
  pages/             startside, pensum, formelark, begreper, trening, eksamen, fremgang
  figurer/           interaktive figurer og registeret som kobler navn til komponent
  lib/               poengregler, eksamenstrekking, mestring, tall- og stikkordtolking
  store/             fremgang i localStorage
  styles/            CSS med designvariabler (lyst og mørkt tema)
tests/
  unit/              Vitest
  e2e/               Playwright
.github/workflows/   publisering til Pages og kontroll av pull requests
```

`src/generated/` lages av byggskriptet og er ikke sjekket inn.

## Redigere pensum

Hvert kapittel er en markdown-fil i `content/pensum/` med frontmatter (`kapittel`, `tittel`, `kilder`). Hvert delkapittel starter med

```markdown
## 3.4 Kryssvalidering {#kryssvalidering}

*Kilder: notater 1.4.4, F4, …*

### Introduksjon
### Begreper
### Forklaring
### Formler
### Sammenhenger
### Vanlige misforståelser
### Eksamensoppsummering
```

Alle sju seksjonene må være med, i denne rekkefølgen. Matte skrives med `$…$` og `$$…$$`. Begreper skrives som `- **Begrep:** forklaring` (eller som tabell) og havner automatisk i begrepslisten og søket. En interaktiv figur settes inn på egen linje med `<!-- figur: navn -->`, der `navn` er registrert i `src/figurer/register.ts`.

## Skrive oppgaver

Oppgavene ligger i `content/oppgaver/kapN.yaml`. Felles felt:

```yaml
- id: "3.4-07"            # unik, gjerne delkapittel-løpenummer
  del: "3.4"              # delkapittelet oppgaven hører til
  niva: middels           # grunnleggende | middels | avansert
  type: enkeltvalg        # enkeltvalg | flervalg | pastand | tall | tekst
  tags: [oving-2, kode]   # valgfritt: oving-1/2/3, prosjekt-4, kode, case, regning
  sporsmal: |
    Teksten, med markdown og $matte$.
  husk: 'Én linje om hva som er viktig å huske til eksamen.'
```

Bruk enkle anførselstegn eller blokk (`|`) for tekst med LaTeX. I doble anførselstegn tolker YAML `\f`, `\b` osv. som kontrolltegn, og byggskriptet stopper.

Typespesifikke felt:

- **enkeltvalg / flervalg:** `alternativer` med `tekst`, `forklaring` og `riktig: true` på de riktige, og en samlet `forklaring`. Enkeltvalg må ha nøyaktig ett riktig svar. Alle flervalgsoppgaver brukes også i eksamenssimuleringen, med mindre de har `eksamen: false`.
- **pastand:** `riktig: true/false` og `forklaring`.
- **tall:** `deler` med `sporsmal`, `svar` og enten `toleranse` (absolutt) eller `relativ` (standard 2 %), pluss `losning`.
- **tekst:** `eksempelsvar` og `punkter` med `tekst` og `stikkord`. Stikkord brukes til å forhåndsmarkere punkter: `a|b` betyr a eller b, `a+b` betyr både a og b.

### Skrive gode svaralternativer

Formen på alternativene skal ikke røpe fasiten. Du skal måtte vurdere hvert alternativ faglig. Tidligere eksamener (H24 og H25) har en svak tendens til at riktig svar er det lengste, og mange gale alternativer bruker ord som «alltid», «garantert» og «kun». Portalen skal ikke lære deg å stole på slike signaler.

- **Lik form:** Riktig svar skal ikke være lengre, mer detaljert eller mer nyansert enn feilalternativene. Skriv det kort og presist, og legg begrunnelsen i `forklaring`. Det korte og enkle alternativet skal være riktig like ofte som det lange.
- **Absolutte ord på begge sider:** Bruk «alltid», «aldri», «bare» osv. også i riktige svar og sanne påstander, og la gale alternativer være nyanserte.
- **Vanskelighetsgraden ligger i distraktorene:**
  - *grunnleggende:* De gale alternativene er tydelig feil hvis du kan definisjonen, men ser troverdige ut på overflaten.
  - *middels:* De gale alternativene er typiske misforståelser eller forvekslinger med beslektede begreper (for eksempel varians mot bias, eller Gini mot entropi).
  - *avansert:* De gale alternativene er nesten riktige. Det kan være sanne utsagn som ikke svarer på spørsmålet, riktig tall med feil begrunnelse, halvt riktige kombinasjoner eller én liten avgjørende feil.
- **Påstander:** omtrent halvparten sanne.

`tests/unit/formskjevhet.test.ts` sjekker dette for hele banken: hvor ofte riktig svar er lengst (per nivå), lengdeforholdet mellom riktige og gale alternativer, andelen sanne påstander og om absolutte ord avslører svaret.

En oppgave kan ha en figur: enten `figur: navn` (en registrert figur) eller data for et linje-, punkt- eller stolpediagram, se `3.3-03` (linje), `6.3-07` (punkter med `klassenavn`) og `6.5-08` (stolper). Oppgaver med figur, tabell eller kodeblokk får automatisk taggen `figur` eller `kode`.

### Notatquizen

Filene i `content/notatquiz/` bruker samme format som oppgavebanken, med ett ekstra påkrevd felt, `kilde`, som angir avsnittet i forelesningsnotatene (for eksempel `"1.2.5 Klassifiseringsterskel"`). Det første tallet i `kilde` bestemmer hvilket notatkapittel oppgaven filtreres under. `del` peker fortsatt på et delkapittel i portalen, slik at «Les igjen»-lenken virker. Filer som starter med `notater` havner i den første quizen, `prosjekter.yaml` i den andre og `eksempler.yaml` i den tredje. I prosjektquizen starter `kilde` med prosjektet (`Øving 1`–`Øving 3`, `Prosjekt 4 RL`, `Prosjekt 4 XAI`), som brukes til filtreringen. Id-ene (`N01`…, `P01`…, `E01`…) må ikke finnes i oppgavebanken. `tests/unit/notatquiz.test.ts` sjekker dette, at alle sju kapitlene i notatene og alle prosjektene er dekket og at alternativene ikke røper fasit gjennom lengden.

## Publisering på GitHub Pages

Workflowen `.github/workflows/pages.yml` bygger og publiserer portalen ved hver push til `main`. Første gang må Pages slås på:

1. Gå til **Settings → Pages** i repositoriet.
2. Under **Build and deployment**, velg **Source: GitHub Actions**.
3. Kjør workflowen på nytt (Actions → «Publiser på GitHub Pages» → Run workflow), eller push til `main`.

Bygget bruker relative stier og hash-ruting (`#/pensum/1.2`), så det virker under `/introML/` uten ekstra oppsett, og lenker kan deles direkte.

## Om innholdet

- Pensum bygger på forelesningsnotatene (hovedkilde), slidene F2–F13, eksamen 2024 (med fasit) og 2025, øving 1–3, prosjekt 4 og kunngjøringene fra emneansvarlig. Slidene F1 og F14 var ikke tilgjengelige.
- Der slides og notater er uenige, følger portalen notatene og sier det. Stoff som ikke står i kursmaterialet (for eksempel formelen for $p_{j|i}$ i SNE), er merket som standardkunnskap.
- Kapittel 9 (AI Act) beskriver situasjonen per november 2026, etter Digital Omnibus.
- Eksamenssimuleringen følger kunngjøringene for 2026: bare flervalg, regneoppgaver som svaralternativer, negative poeng for feil, og valgte alternativer kan ikke velges bort. Karakteranslaget bruker NTNUs standardskala, med de strengere 2024-grensene for A og B vist ved siden av.
- Oppgavene er nye og skrevet for portalen. Tidligere eksamener er bare brukt som mal for format og nivå.
- Fremgangen lagres bare i nettleseren du bruker. Bruk «Last ned fremgangen» på fremgangssiden for å ta vare på den eller flytte den til en annen enhet.
