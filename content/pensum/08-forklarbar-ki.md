---
kapittel: 8
tittel: Forklarbar KI (XAI)
kilder: Forelesningsnotater 5, F12 (Explainable AI del 1), F13 (Explainable AI del 2), eksamen 2024 oppg. 34–36, notater kap. 8 (eksempeloppgave), øving 4 XAI (Project4_XAI)
---

# Kapittel 8 – Forklarbar KI (XAI)

Regresjonsmodeller og beslutningstrær er tolkbare. Nevrale nettverk er det ikke, og det er nettopp de som fungerer best på de vanskeligste problemene. Forklarbar KI (explainable AI, XAI) er verktøyene vi bruker for å forstå hva slike modeller gjør. Kapittelet dekker én metode fra hver av tre kategorier: SHAP (modellagnostisk), LIME (surrogatmodell) og konseptdeteksjon med CAV og TCAV (modellspesifikk).

---

## 8.1 Hvorfor forklarbar KI? {#hvorfor-xai}

*Kilder: notater 5.1, F12.*

### Introduksjon

Nevrale nettverk er svært treffsikre, men representasjonene deres gir ikke mening for mennesker. Da vet vi ikke om de har lært spuriøse korrelasjoner, og de er vanskelige å bruke der forståelse og etterlevelse (for eksempel juridisk) er viktig. Etter denne delen skal du kunne forklare den historiske bakgrunnen, forskjellen på tolkbarhet og forklarbarhet, og hva en forklaring må oppfylle.

### Begreper

- **Symbolsk KI:** mennesker koder kunnskap inn i datamaskiner som eksplisitte regler, planer og søk med symboler som betyr noe for oss (for eksempel ekspertsystemer). Dominerte fra Dartmouth-prosjektet i 1956 til omtrent 1990.
- **Subsymbolsk KI:** reglene læres fra data med statistiske metoder, altså ved å oppdage og modellere korrelasjoner. Kunnskapen ligger *under* symbolene. Nevrale nett er det ekstreme tilfellet.
- **Transparent og sporbar:** vi kan skrive ut hver parameter og aktivering. Et nevralt nett er det.
- **Tolkbarhet (interpretability):** en *passiv* egenskap. Et system er tolkbart hvis det gir direkte mening for mennesker, slik en lineær regresjon kan gjøre.
- **Forklarbarhet (explainability):** en *aktiv* egenskap. Vi legger til ekstra funksjonalitet for å forklare et system som ikke er tolkbart i seg selv.
- **XAI:** samlingen av verktøy, metoder og rammeverk som skal hjelpe mennesker å forstå prediksjonene fra KI-systemer, særlig nevrale nett.
- **Forklaring:** et grensesnitt mellom mennesket og modellen.

### Forklaring

**Hvorfor subsymbolsk KI vant.** Symbolske systemer har notorisk vanskelig for å håndtere usikkerheten i den virkelige verden: varierende kontekster og persepsjon av bilder, lyd og tekst. Subsymbolsk KI lærer i stedet fra data, og det fungerer spektakulært godt. AlphaFold, som forutsier proteiners tredimensjonale struktur, var grunnlaget for halve nobelprisen i kjemi i 2024. Teoretisk vet vi at nevrale nett er universelle funksjonsapproksimatorer: med nok nevroner kan de tilnærme enhver kontinuerlig funksjon så nøyaktig vi vil.

**Det vi ikke vet.** Hvorfor generaliserer store nett så godt? Zhang et al. viste at vanlige nett kan memorere tilfeldige labels perfekt, så de har kapasitet til ren memorering. Likevel lærer de generaliserbare mønstre, og empiriske studier tyder på at de lærer mønstre før de memorerer støy. Ali Rahimi sammenlignet i 2017 maskinlæring med alkymi og argumenterte for at systemer som styrer helse og offentlig debatt, bør bygge på verifiserbar kunnskap. Yann LeCun var uenig og pekte på at vi bruker mange systemer uten teoretisk forståelse av hvorfor de virker. Debatten pågår fortsatt.

**Forklaringsproblemet.** Et nevralt nett er fullstendig transparent og sporbart, men ingen av tallene gir mening for oss eller forklarer hvorfor det predikerer som det gjør. Transparens er altså ikke det samme som tolkbarhet.

**To krav til en forklaring.**

1. Den må være en *treffsikker* representasjon av modellen.
2. Den må være *forståelig* for mennesker.

En forklaring som er lett å forstå, men ikke speiler modellen, er verdiløs. En forklaring som speiler modellen perfekt, er bare modellen selv og dermed ikke mer forståelig.

### Formler

Ingen formler i denne delen.

### Sammenhenger

- Kapittel 3.6 viste at regresjonsmodeller og trær er tolkbare: koeffisienter og splitter gir mening. Nevrale nett (kapittel 5) er ikke det. XAI fyller hullet.
- AI Act krever transparens, menneskelig tilsyn og rett til forklaring for visse systemer (kapittel 9).
- *Explicability* er et av de fem etiske prinsippene (kapittel 9).

### Vanlige misforståelser

- «Et nevralt nett er en svart boks fordi vi ikke kan se parametrene.» Vi kan se alt. Problemet er at det ikke gir mening.
- «Tolkbarhet og forklarbarhet er det samme.» Tolkbarhet er passiv (modellen er forståelig i seg selv), forklarbarhet er aktiv (vi legger til en forklaring).
- «Den beste forklaringen gjengir modellen perfekt.» Da er den like uforståelig som modellen.

### Eksamensoppsummering

- Kunne forskjellen på symbolsk og subsymbolsk KI, og hvorfor subsymbolsk KI er vanskelig å forstå.
- Definere tolkbarhet (passiv) og forklarbarhet (aktiv), og vite at et nevralt nett er transparent, men ikke tolkbart.
- Kunne de to kravene til en forklaring.

---

## 8.2 Taksonomi: hvordan forklaringer kan klassifiseres {#taksonomi}

*Kilder: notater 5.1 og 5.5, F12, F13, notater kap. 8 (eksempeloppgave).*

### Introduksjon

Det finnes hundrevis av XAI-metoder og mange konkurrerende taksonomier. Kurset bruker en enkel inndeling basert på hva vi undersøker i modellen. Etter denne delen skal du kunne sortere metoder etter tilnærming og etter begrepene post-hoc, lokal, global, modellspesifikk og modellagnostisk.

### Begreper

- **Post-hoc:** forklaringen lages etter at modellen er trent. Gjelder alle metodene i kurset.
- **Lokal forklaring:** gjelder én prediksjon, eller modellen i et lite område av input-rommet.
- **Global forklaring:** gjelder hele modellen.
- **Modellagnostisk:** trenger bare å kunne gi modellen input og lese output, og kan brukes på enhver modell. Typisk resultat er en rangering av hvor viktige input-featurene er.
- **Modellspesifikk:** bruker informasjon om modellens parametre, arkitektur eller gradienter.
- **Surrogatmodell:** modellen erstattes av en tolkbar modell som etterligner den, ofte bare lokalt.

### Forklaring

**Tre ting å undersøke i $f(\mathbf{x}, \theta)$.** En modell tar input $\mathbf{x}$ og er definert av parametrene $\theta$. Tenk deg at en mystisk svart boks faller ned fra himmelen.

| Tilnærming | Kategori | Intuitivt | Metode i kurset |
|---|---|---|---|
| Hvor følsom er $f$ for endringer i $\mathbf{x}$? | Modellagnostiske forklaringer | Dytt på boksen og se hva som skjer | SHAP |
| Kan $f$ erstattes av en tolkbar funksjon? | Surrogatmodeller | Finn et tilsvarende fenomen du forstår | LIME |
| Hva betyr verdiene og strukturen i $\theta$? | Modellspesifikke forklaringer | Knus boksen og se inni | Konseptdeteksjon (CAV, TCAV) |

**Andre inndelinger (Arrieta et al. 2020).** *Når* forklarbarheten innføres (under modellering eller post-hoc), *hvem* forklaringen er for (utvikler, beslutningstaker, sluttbruker), og *hvordan* den lages (tilpasset en modelltype eller modellagnostisk).

**Metodene sortert.**

| | SHAP | LIME | TCAV |
|---|---|---|---|
| Kategori | Modellagnostisk (feature-attribusjon) | Surrogatmodell | Modellspesifikk |
| Lokal eller global | Lokal, men lokale forklaringer kan aggregeres til et globalt bilde | Lokal | Global |
| Post-hoc | Ja | Ja | Ja |
| Forklarer via | Input-features | Input-features | Konsepter |

**En global XAI-metode** gir en overordnet forklaring av hvordan modellen tar beslutninger på tvers av datasettet (eksempeloppgave i notatene). Det er ikke det samme som «virker på enhver modell» (det er modellagnostisk) eller «forklarer én prediksjon» (det er lokal).

### Formler

Ingen formler i denne delen.

### Sammenhenger

- Lokal vs global går igjen i alle metodene: SHAP er lokal, men brukes globalt via beeswarm-plott (8.4). TCAV er global fordi den oppsummerer en hel klasse (8.6).
- At noen SHAP-explainere bruker modellens indre (trær, gradienter), utfordrer «modellagnostisk». Se 8.4.

### Vanlige misforståelser

- «Global betyr modellagnostisk.» Global handler om omfanget av forklaringen, modellagnostisk om hvilke modeller den kan brukes på.
- «Post-hoc betyr mindre presis.» Post-hoc betyr bare at forklaringen lages etter trening.

### Eksamensoppsummering

- Kunne tabellen med de tre tilnærmingene og metoden fra hver.
- Definere post-hoc, lokal, global, modellagnostisk, modellspesifikk og surrogatmodell, og gi et eksempel på hver.
- Klassifisere SHAP, LIME og TCAV som lokal eller global.

---

## 8.3 Shapley-verdier {#shapley}

*Kilder: notater 5.2.1, F12, eksamen 2024 oppg. 36.*

### Introduksjon

For å forklare en modell gjennom følsomheten for input trenger vi en systematisk måte å variere input på. SHAP bygger på Shapley-dekomposisjonen fra kooperativ spillteori (Lloyd Shapley, 1953, nobelprisen i økonomi 2012), som svarer på hvordan gevinsten eller kostnaden i et spill der spillerne kan samarbeide, bør fordeles rettferdig. Etter denne delen skal du kunne formelen, regne Shapley-verdier for tre spillere, og kunne aksiomene.

### Begreper

- **Kooperativt spill:** et spill der spillerne kan samarbeide i koalisjoner.
- **Karakteristisk funksjon $v$:** gir verdien (gevinst eller kostnad) for hver koalisjon. Den karakteriserer spillet entydig.
- **Koalisjon $S$:** en delmengde av spillerne.
- **Storkoalisjonen $N$:** alle spillerne.
- **Marginalt bidrag:** $v(S \cup \{i\}) - v(S)$, hvor mye verdien endres når spiller $i$ blir med i $S$.
- **Shapley-verdi $\phi_i$:** spiller $i$ sin rettferdige andel, et vektet gjennomsnitt av de marginale bidragene over alle koalisjoner uten $i$.

### Forklaring

**Taxi-eksempelet (notatene og F12).** Tre venner deler taxi langs samme rute. Passasjer 1 skal 3 km, passasjer 2 skal 7 km og passasjer 3 skal 10 km. Kostnaden for en koalisjon er hvor langt taxien må kjøre for den:

| $S$ | $\{\}$ | $\{1\}$ | $\{2\}$ | $\{3\}$ | $\{1,2\}$ | $\{1,3\}$ | $\{2,3\}$ | $\{1,2,3\}$ |
|---|---|---|---|---|---|---|---|---|
| $v(S)$ (km) | 0 | 3 | 7 | 10 | 7 | 10 | 10 | 10 |

Med $|N| = 3$ er vektene $\tfrac{1}{3}$ for $|S| = 0$, $\tfrac{1}{6}$ for $|S| = 1$ og $\tfrac{1}{3}$ for $|S| = 2$.

Passasjer 1 (koalisjonene uten 1 er $\{\}, \{2\}, \{3\}, \{2,3\}$):

$$
\phi_1 = \tfrac{1}{3}(3 - 0) + \tfrac{1}{6}(7 - 7) + \tfrac{1}{6}(10 - 10) + \tfrac{1}{3}(10 - 10) = 1
$$

Passasjer 2 (uten 2: $\{\}, \{1\}, \{3\}, \{1,3\}$):

$$
\phi_2 = \tfrac{1}{3}(7 - 0) + \tfrac{1}{6}(7 - 3) + \tfrac{1}{6}(10 - 10) + \tfrac{1}{3}(10 - 10) = \tfrac{7}{3} + \tfrac{2}{3} = 3
$$

Passasjer 3 (uten 3: $\{\}, \{1\}, \{2\}, \{1,2\}$):

$$
\phi_3 = \tfrac{1}{3}(10 - 0) + \tfrac{1}{6}(10 - 3) + \tfrac{1}{6}(10 - 7) + \tfrac{1}{3}(10 - 7) = \tfrac{10}{3} + \tfrac{7}{6} + \tfrac{1}{2} + 1 = 6
$$

Den rettferdige fordelingen er altså 1, 3 og 6 km. Tolkning: de første 3 km deles på tre (1 km hver), de neste 4 km deles på to (2 km hver til passasjer 2 og 3), og de siste 3 km betaler passasjer 3 alene.

**Aksiomene.**

| Aksiom | Betydning | I taxi-eksempelet |
|---|---|---|
| Symmetri | To spillere som bidrar likt til alle koalisjoner, får samme verdi | |
| Effektivitet | Verdiene summerer til storkoalisjonens verdi | $1 + 3 + 6 = 10$ |
| Nullspiller (dummy) | En spiller som ikke endrer verdien av noen koalisjon, får 0 | En som ikke tar taxien, betaler 0 |
| Additivitet | For to spill $v$ og $w$ er verdien i spillet $v + w$ summen av verdiene | To taxiturer kan regnes hver for seg og summeres |

Shapley-dekomposisjonen er beviselig den eneste fordelingen som oppfyller alle fire. Notatene nevner som en kuriositet at Young (1985) ga en alternativ karakterisering der nullspiller og additivitet byttes ut med monotonitet. (F12 krediterer Young for selve entydigheten. Følg notatene.) Dette solide fundamentet er grunnen til at Shapley-verdier er så populære i XAI.

**Vektingen.** Prefaktoren kan deles i en skalering $1/|N|$, uavhengig av $S$, og en del som avhenger av koalisjonsstørrelsen: én over antall måter å velge $|S|$ spillere blant de $|N| - 1$ andre. Shapley-verdien er altså et gjennomsnitt over koalisjonsstørrelser, der hver størrelse teller like mye.

**Beregningskostnad.** For hver spiller summerer vi over alle $2^{|N|-1}$ koalisjoner uten spilleren, og hvert ledd krever to verdier av $v$. Totalt trenger vi $v$ for alle $2^{|N|}$ koalisjoner. Med 3 spillere er det 8, med 30 features over en milliard. Eksakt beregning går bare for små problemer (notatenes tommelfingerregel: høyst 20 features). Dette er en av to hovedbegrensninger ved Shapley-verdier i XAI. Den andre er spørsmålet om hva $v(S)$ betyr for en modell (8.4).

**Øvingsoppgave (notatene og F12).** Tre katter fanger mus alene og i koalisjoner:

| $S$ | $\{\}$ | $\{1\}$ | $\{2\}$ | $\{3\}$ | $\{1,2\}$ | $\{1,3\}$ | $\{2,3\}$ | $\{1,2,3\}$ |
|---|---|---|---|---|---|---|---|---|
| $v(S)$ | 0 | 2 | 4 | 5 | 3 | 3 | 2 | 3 |

Regn ut Shapley-verdien for hver katt og sjekk mot effektivitetsaksiomet. (Fasit: $\tfrac{1}{2}$, $1$ og $\tfrac{3}{2}$, som summerer til 3.)

<!-- figur: shapley -->

### Formler

Shapley-verdien til spiller $i$:

$$
\phi_i(v) = \sum_{S \subseteq N \setminus \{i\}} \frac{|S|!\,\bigl(|N| - |S| - 1\bigr)!}{|N|!}\Bigl(v\bigl(S \cup \{i\}\bigr) - v(S)\Bigr)
$$

Samme formel med vektingen delt i to:

$$
\phi_i(v) = \frac{1}{|N|}\sum_{S \subseteq N \setminus \{i\}} \binom{|N| - 1}{|S|}^{-1}\Bigl(v\bigl(S \cup \{i\}\bigr) - v(S)\Bigr)
$$

Effektivitet:

$$
\sum_{i \in N}\phi_i(v) = v(N)
$$

- Summen går over alle koalisjoner $S$ som *ikke* inneholder $i$.
- Parentesen er det marginale bidraget.
- Antall evalueringer av $v$ er $2^{|N|}$.

### Sammenhenger

- I SHAP er spillerne features, og spillet er modellen (8.4).
- Effektivitetsaksiomet er grunnen til at SHAP-verdiene summerer til prediksjonen minus gjennomsnittsprediksjonen.
- Eksponentiell kostnad i antall spillere er samme type problem som dimensjonsforbannelsen.

### Vanlige misforståelser

- «Summen går over koalisjoner som inneholder $i$.» Den går over koalisjoner *uten* $i$.
- «Alle koalisjoner har lik vekt.» Vekten avhenger av koalisjonsstørrelsen.
- «Shapley-verdiene kan summere til hva som helst.» De summerer til storkoalisjonens verdi.
- «Shapley-verdier kan alltid regnes eksakt.» Kostnaden er $2^{|N|}$.

### Eksamensoppsummering

- Kunne formelen og forklare marginalt bidrag og vekting.
- Regne Shapley-verdier for tre spillere og sjekke med effektivitet.
- Kunne de fire aksiomene og at Shapley er den eneste fordelingen som oppfyller dem.
- Vite at beregningen krever $2^{|N|}$ evalueringer av $v$.

---

## 8.4 SHAP: Shapley-verdier for maskinlæringsmodeller {#shap}

*Kilder: notater 5.2.2–5.2.4, F12, F13, eksamen 2024 oppg. 35, øving 4 XAI.*

### Introduksjon

SHAP (SHapley Additive exPlanations) bruker Shapley-dekomposisjonen til å fordele én prediksjon mellom input-featurene. Det er en av verdens mest brukte XAI-metoder. Etter denne delen skal du kunne oversettelsen fra spill til modell, hva $v(S)$ er og hvilken antakelse som ligger i det, formelen for SHAP, de ulike explainerne, og hvordan force plot og beeswarm leses.

### Begreper

- **SHAP-verdi $\phi_j^*$:** hvor mye feature $j$ trekker prediksjonen for punktet $\mathbf{x}^*$ bort fra gjennomsnittsprediksjonen.
- **Basisverdi $\phi_0 = \mathbb{E}[f(\mathbf{x})]$ (base value):** «tom» prediksjon uten informasjon fra features, estimert som modellens snittprediksjon over bakgrunnsdatasettet.
- **Bakgrunnsdatasett (background dataset):** data som fraværende features trekkes fra.
- **Force plot:** viser hvordan hver feature skyver én prediksjon fra $\phi_0$ til $f(\mathbf{x}^*)$.
- **Beeswarm plot:** SHAP-verdier for mange datapunkter og alle features i ett plott.
- **Superpiksler:** grupper av piksler som behandles som én feature i Image SHAP.

### Forklaring

**Fra spill til modell.**

| Spillteori | Maskinlæring |
|---|---|
| Spiller $i$ | Feature $i$ |
| Koalisjon $S$ | Delmengde av features |
| Alle spillere $N$ | Alle features |
| Spillet $v$ | Modellen, evaluert på en delmengde av features |
| $\phi_i$: spillerens andel av utfallet | Featurens bidrag til prediksjonen |

**Hovedutfordringen: hva er $v(S)$?** Nesten alle modeller forventer en fast input-form. Sender du tre av fem features inn i et nevralt nett, får du en shape-feil. Vi må bestemme hva det betyr at en feature er «fraværende». SHAP definerer $v(S)$ som den forventede prediksjonen for $\mathbf{x}^*$ når modellen bare kjenner verdiene til featurene i $S$. Kurset bruker den enkleste tilnærmingen: erstatt de fraværende featurene med verdier trukket fra et bakgrunnsdatasett, og ta snittet av prediksjonene. Vi later som vi fjerner features, men tar dem med på en måte som ikke gir modellen informasjon.

**Den skjulte antakelsen.** Verdiene fra bakgrunnsdatasettet kan komme fra punkter som ikke ligner $\mathbf{x}^*$ i det hele tatt. Det er en antakelse om *uavhengige* features. Er featurene korrelerte, kan modellen få kombinasjoner den aldri har sett, og forklaringer basert på prediksjoner utenfor modellens gyldighetsområde er ikke nødvendigvis til å stole på. Valget av bakgrunnsdatasett er et modelleringsvalg som påvirker resultatet.

**Additiv forklaring.** Takket være effektivitetsaksiomet fordeles prediksjonen nøyaktig mellom featurene: basisverdien pluss summen av SHAP-verdiene er lik prediksjonen. SHAP-verdiene utgjør en *lokal* forklaring av én prediksjon.

**Explainere i biblioteket `shap`.**

| Explainer | For | Hvordan |
|---|---|---|
| `KernelExplainer` | Alle modeller (helt modellagnostisk) | Trekker koalisjoner og tilpasser en lineær modell |
| `TreeExplainer` | Trær og skoger | Utnytter trestrukturen, eksakte SHAP-verdier i polynomisk tid (slipper $O(2^N)$) |
| `DeepExplainer` | Nevrale nett | Bruker backpropagation for å approksimere effektivt |
| `GradientExplainer` | Nevrale nett | Bruker nettets gradienter direkte |

Tree-, Deep- og GradientExplainer er laget for bestemte modelltyper og er strengt tatt ikke modellagnostiske. De er likevel bare ulike måter å regne ut eller tilnærme de samme bidragene definert via $v$, som er uavhengig av modellens indre. SHAP regnes derfor som en modellagnostisk metode.

**Lese et force plot (F12, California housing).** Basisverdien er litt over 200 000 dollar. Prediksjonen for huset er 135 000 dollar. Blå piler trekker prediksjonen ned (her primært `MedInc` og `AveOccup`, litt `HouseAge`), røde trekker den opp (her primært `Population`). Pilene summerer nøyaktig til forskjellen mellom basisverdi og prediksjon.

**Lese et beeswarm-plott.**

- Én rad per feature, sortert etter gjennomsnittlig $|\text{SHAP}|$, med den viktigste øverst.
- Hvert punkt er ett datapunkt.
- Den vannrette aksen er SHAP-verdien: til høyre øker prediksjonen, til venstre synker den.
- Fargen er featureverdien: rød er høy, blå er lav.
- Mønsteret sier retningen: røde punkter til høyre betyr at høye verdier øker prediksjonen. Blandede farger på begge sider tyder på en ikke-monoton sammenheng eller vekselvirkninger.

**Fra lokal til global.** Når vi plotter SHAP-verdier for mange punkter sammen, kombinerer vi lokale forklaringer til et globalt bilde. Bildet beskriver likevel bare modellen i de aktuelle punktene.

**Bilder og tekst (bare overordnet forståelse kreves).**

- *Bilder:* SHAP-verdien per piksel viser hvor mye pikselen driver prediksjonen bort fra basisverdien for hver klasse. Et fotografi har millioner av piksler (×3 farger), og $2^N$ gjør eksakt beregning umulig, og pikselnivå er heller ikke nødvendigvis meningsfullt. Image SHAP deler bildet i *superpiksler*. Grupperer du ni spillere i tre grupper, får du tre Shapley-verdier i stedet for ni.
- *Tekst:* en transformer trent på sentimentanalyse (sadness, joy, love, anger, fear, surprise) forklares med SHAP der features er ord eller tokens. Plottet viser hvilke ord som trekker mot en valgt klasse, for eksempel «anger».

**Kobling til øving 4 XAI.**

- *Problem 1, California housing:* lineær regresjon sammenlignes med snitt av $|\text{SHAP}|$. Koeffisientene og SHAP er uenige fordi koeffisienten er effekten per enhet, mens SHAP-verdien også avhenger av hvor mye featuren varierer (hintet er å se på histogrammene). For en lineær modell med uavhengige features er SHAP-verdien $w_j(x_j - \mathbb{E}[x_j])$ (standardresultat, ikke utledet i kurset). En `GradientBoostingRegressor` forklares med beeswarm, scatter-plott for monotonitet og waterfall-plott for to hus. Du skal kunne forklare basisverdien og hva bakgrunnsdataene brukes til.
- *Problem 2, MNIST:* en MLP 784 → 128 → 64 → 10 forklares med `DeepExplainer` og 1000 bakgrunnsbilder. Koden setter den øverste pikselraden til 1 og label til 5 for de første 1000 treningsbildene, og testbildet `encrypted_image` er et 2-tall med samme mønster. Modellen svarer trolig 5 med høy sikkerhet, og SHAP-bildet avslører at det er den øverste raden som driver prediksjonen. Vi kan altså ikke stole på svaret. `DeepExplainer` er ikke modellagnostisk fordi den bruker nettets gradienter (backprop).

### Formler

Karakteristisk funksjon i SHAP:

$$
v(S) = \mathbb{E}\bigl[f(\mathbf{x}) \mid \mathbf{x}_S = \mathbf{x}^*_S\bigr]
$$

Additiv dekomposisjon av én prediksjon med $M$ features:

$$
f(\mathbf{x}^*) = \phi_0 + \sum_{j=1}^{M}\phi_j^*, \qquad \phi_0 = \mathbb{E}[f(\mathbf{x})]
$$

Global viktighet av feature $j$ over $n$ datapunkter (rekkefølgen i beeswarm):

$$
I_j = \frac{1}{n}\sum_{i=1}^{n}\bigl|\phi_j^{(i)}\bigr|
$$

```python
explainer = shap.TreeExplainer(regressor, data=X_train)   # bakgrunnsdata
shap_values = explainer.shap_values(X_test)
shap.force_plot(explainer.expected_value, shap_values[i, :], X_test.iloc[i])
shap.plots.beeswarm(explainer(X_test))
```

### Sammenhenger

- Antakelsen om uavhengige features i bakgrunnsdatasettet er den samme typen antakelse som i naiv Bayes (kapittel 2.2).
- `TreeExplainer` utnytter strukturen til trær og skoger fra kapittel 2 og 4. `DeepExplainer` og `GradientExplainer` bruker gradientene fra kapittel 5.
- Det forgiftede MNIST-eksempelet viser hvorfor høy accuracy ikke er nok: en modell kan lære en snarvei. Det kobler til krav om robusthet og datastyring i AI Act (kapittel 9).

### Vanlige misforståelser

- «SHAP-verdien er hvor mye featuren påvirker prediksjonen i snitt over alle data.» En SHAP-verdi gjelder ett datapunkt. Snittet av absoluttverdiene gir global viktighet.
- «Basisverdien er 0.» Den er snittprediksjonen over bakgrunnsdatasettet.
- «Valget av bakgrunnsdata spiller ingen rolle.» Det endrer basisverdien og bidragene.
- «Rødt i et beeswarm-plott betyr positiv SHAP-verdi.» Rødt betyr høy *featureverdi*. Plasseringen på aksen viser SHAP-verdien.
- «Rødt i et force plot betyr høy featureverdi.» I force plot betyr rødt at featuren trekker prediksjonen *opp*.
- «SHAP regner alltid eksakte verdier.» De fleste explainere approksimerer, og alle bruker en definisjon av $v(S)$ med en antakelse.

### Eksamensoppsummering

- Kunne oversettelsen spiller → feature, spill → modell.
- Forklare $v(S)$, bakgrunnsdatasettet og antakelsen om uavhengige features.
- Kunne formelen $f(\mathbf{x}^*) = \phi_0 + \sum_j \phi_j^*$ og tolke $\phi_0$.
- Lese force plot og beeswarm-plott, inkludert fargene.
- Kjenne explainerne og hvorfor SHAP likevel regnes som modellagnostisk.
- Forklare superpiksler.

---

## 8.5 LIME: lokale surrogatmodeller {#lime}

*Kilder: notater 5.3, F13, eksamen 2024 oppg. 34.*

### Introduksjon

LIME (Local Interpretable Model-agnostic Explanations, 2016) er en klassiker i XAI. Idéen er at en komplisert modell kan oppføre seg enkelt, kanskje lineært, i et lite nok nabolag. Da kan vi tilpasse en tolkbar modell der og tolke den. Etter denne delen skal du kunne stegene i LIME, optimeringsproblemet og forbeholdene.

### Begreper

- **Surrogatmodell $g$:** en tolkbar modell som etterligner den fulle modellen $f$.
- **Nabolag $\pi_{\mathbf{x}}$:** en vektfunksjon som gir punkter nær $\mathbf{x}$ høy vekt.
- **Klasse $G$ av tolkbare modeller:** for eksempel lineære modeller eller små beslutningstrær.
- **Kompleksitet $\Omega(g)$:** et mål på hvor kompleks $g$ er, som motsatsen til tolkbarhet. For en lineær modell kan det være antall features med koeffisient ulik null, for et tre dybden.

### Forklaring

**Intuisjon.** Jorden er rund (den fulle modellen $f$ er kurvet), men bakken rundt deg er så flat at du kan bruke plangeometri ($g$) lokalt.

**Stegene.**

1. Velg punktet $\mathbf{x}$ som skal forklares, og definer et nabolag $\pi_{\mathbf{x}}$.
2. Generer $n$ tilfeldige punkter $\mathbf{x}_i$ rundt $\mathbf{x}$ (for tabelldata typisk fra en normalfordeling basert på treningsdataenes statistikk), vektet etter avstand til $\mathbf{x}$.
3. Lag labels ved å predikere med $f$, altså $f(\mathbf{x}_i)$. Ikke targets fra dataene, for poenget er at $g$ skal etterligne $f$.
4. Tilpass en $g$ fra klassen $G$ til de vektede punktene.
5. Bruk $g$ som forklaring, for eksempel ved å tolke koeffisientene.

**Avveiningen.** Optimeringen balanserer to ledd: hvor dårlig $g$ etterligner $f$ i nabolaget (lavt tap betyr at de oppfører seg likt rundt $\mathbf{x}$), og hvor kompleks $g$ er (lav kompleksitet sikrer at $g$ er tolkbar).

**Eksempel (F13, Titanic).** En klassifikator og en regressor (XGBoost) på features Pclass, Sex og Age. Hvorfor dør Jack? Begge modellene er enige: kjønn, passasjerklasse og alder trekker alle mot død. Rose overlever av samme tre grunner, i motsatt retning. For et mindre opplagt punkt (en ung kvinne på tredje klasse) trekker kjønn og lav alder mot overlevelse, mens tredje klasse trekker mot død. I LIME-utskriften er feature-bidragene avvik fra skjæringspunktet (intercept). F13 viser for eksempel $0{,}91 - (0{,}42 + 0{,}37 + 0{,}03) = 0{,}09$, som er surrogatmodellens prediksjon (`prediction_local`). Blått er negative bidrag og oransje positive.

**Forbehold (notatene).**

- Forklaringen avhenger av hvordan nabolaget $\pi_{\mathbf{x}}$ defineres.
- LIME gir ingen formell garanti for at $g$ er en god surrogat for $f$, så kvaliteten må sjekkes empirisk.
- Fordi punktene trekkes tilfeldig, kan to kjøringer på samme punkt gi ulike forklaringer.

### Formler

$$
\xi(\mathbf{x}) = \underset{g \in G}{\arg\min}\; \mathcal{L}(f, g, \pi_{\mathbf{x}}) + \Omega(g)
$$

- $\mathcal{L}(f, g, \pi_{\mathbf{x}})$: hvor dårlig $g$ etterligner $f$ i nabolaget, vektet med $\pi_{\mathbf{x}}$.
- $\Omega(g)$: kompleksiteten til $g$.

Med en lineær surrogat $g(\mathbf{x}) = \beta_0 + \sum_j \beta_j x_j$ er forklaringen koeffisientene $\beta_j$.

```python
explainer = LimeTabularExplainer(X_train, feature_names=features, mode="classification")
exp = explainer.explain_instance(x, classifier.predict_proba, num_features=3)
```

### Sammenhenger

- LIME bruker en lineær modell eller et lite tre (kapittel 1–3) som forklaring, fordi de er tolkbare.
- LIME og SHAP er begge feature-attribusjoner og lokale. SHAP har et teoretisk fundament i aksiomene. LIME har ingen slik garanti, men er enkel og fleksibel.
- Avveiningen mellom treffsikkerhet og tolkbarhet er de to kravene til en forklaring fra 8.1.

### Vanlige misforståelser

- «LIME er global.» LIME er lokal.
- «$g$ trenes på de ekte targetene.» $g$ trenes på $f$ sine prediksjoner.
- «En kompleks $g$ gir bedre forklaring.» Den blir mindre tolkbar. $\Omega(g)$ holder den enkel.
- «LIME gir samme forklaring hver gang.» Den tilfeldige trekkingen kan gi ulike svar.

### Eksamensoppsummering

- Kunne de fem stegene og hvorfor labels kommer fra $f$.
- Forklare de to leddene i $\arg\min_g \mathcal{L}(f, g, \pi_{\mathbf{x}}) + \Omega(g)$ og avveiningen mellom dem.
- Kunne forbeholdene ved LIME, og at LIME er lokal og modellagnostisk.

---

## 8.6 Konseptbaserte forklaringer: CAV og TCAV {#tcav}

*Kilder: notater 5.4, F13.*

### Introduksjon

SHAP og LIME forklarer med input-features: kolonner, ord eller piksler. Men mennesker tenker i *konsepter*: «stripete», «prikkete», «skygge». Konseptdeteksjon spør om et nevralt nett har lært å representere et konsept internt, og hvor mye konseptet påvirker prediksjonene. Etter denne delen skal du kunne forklare data processing inequality, hva en CAV er, hvordan den lages, og hvordan TCAV-skåren tolkes.

### Begreper

- **Gjensidig informasjon $I(X; Z)$:** hvor mye én variabel forteller om en annen.
- **Data processing inequality:** et lag kan aldri inneholde mer informasjon om input enn tidligere lag.
- **Minimum Description Length (MDL):** den beste modellen for et datasett gir den korteste samlede beskrivelsen. «Comprehension is compression.»
- **Konsept:** et høynivå, abstrakt begrep som ofte er satt sammen av features på en ikke-triviell måte. Alt som kan representeres med data, kan være et konsept. Et konsept er *ikke* en feature: features er eksplisitte i dataene, konsepter er implisitte.
- **Probe:** en (lineær) klassifikator som skiller aktiveringene for konseptdata fra aktiveringene for tilfeldige data i ett lag.
- **CAV $\mathbf{v}_C^l$ (concept activation vector):** vektoren som står vinkelrett på probens beslutningsflate og peker mot konseptet i aktiveringsrommet til lag $l$.
- **TCAV (Testing with CAVs):** metode som gir en skår for hvor mye et konsept påvirker prediksjonene for en klasse.

### Forklaring

**Hva kan vi forvente at modellen vet? Ingenting som ikke finnes i dataene.** Et nett behandler input lag for lag, så input $X$ og aktiveringene $Z_1$ og $Z_2$ i to påfølgende lag danner en Markov-kjede $X \to Z_1 \to Z_2$. Data processing inequality sier da at ingen etterbehandling kan øke informasjonen om input. To presiseringer:

- Teoremet garanterer bare at informasjonen ikke *øker*, ikke at den avtar. Empirisk komprimerer nett ofte informasjon lag for lag, men med unntak (avhenger av tap, arkitektur og aktiveringsfunksjon).
- Teoremet gjelder informasjonen fra ett input. Det modellen har lært i vektene, kommer fra treningsdataene og arkitekturens antakelser.

MDL-synet gjør spørsmålet mer presist: i stedet for «hva vet modellen?» spør vi «hvilken del av informasjonen i dataene bruker modellen?».

**Våre ord er ikke pikselverdier (F13).** Hvorfor ble ikke bildet en pelikan? «Fordi det mangler noe midt på hodet.» Slike forklaringer bruker konsepter som ikke kan representeres som enkeltpiksler og ikke finnes eksplisitt i dataene. Kanskje piksler er feil vokabular for å forklare modellen.

**Lage en CAV for konsept $C$ i lag $l$.**

1. Samle *probing-data*: et datasett med konseptet (for eksempel bilder med prikker) og et uten (tilfeldige bilder). Det er et binært klassifiseringsdatasett.
2. Send dataene gjennom nettet og hent ut aktiveringene $f_l(\mathbf{x})$ i lag $l$.
3. Tren en lineær klassifikator (F13 bruker logistisk regresjon) som skiller konseptaktiveringene fra de tilfeldige. Én probe per lag.
4. Vektoren vinkelrett på beslutningsflaten, som peker mot konseptdataene, er CAV-en $\mathbf{v}_C^l$.

Har proben høy treffsikkerhet, er konseptet (lineært) representert i laget. CAV-er brukes til å forstå nett, for eksempel i studien av hvordan AlphaZero tilegnet seg sjakkunnskap, men sjelden som forklaringer alene.

**TCAV.** La $h_{l,k}$ være funksjonen fra aktiveringene i lag $l$ til prediksjonen for klasse $k$. Konseptsensitiviteten er den retningsderiverte av prediksjonen langs CAV-en: øker eller synker prediksjonen for klasse $k$ hvis vi flytter aktiveringene i lag $l$ litt i retning av konseptet? TCAV-skåren er andelen av bildene i klasse $k$ der sensitiviteten er positiv.

**Tolkning.** En TCAV-skår på 0,9 for konseptet «stripete» og klassen «sebra» betyr at mer striper øker klassifiseringen til sebra for 90 % av de testede sebrabildene. TCAV er en *global* metode, fordi skåren oppsummerer en hel klasse, i motsetning til LIME og SHAP.

### Formler

Data processing inequality for kjeden $X \to Z_1 \to Z_2$:

$$
I(X; Z_2) \leq I(X; Z_1)
$$

Delen av nettet opp til lag $l$:

$$
f_l : \mathbb{R}^n \to \mathbb{R}^m
$$

Konseptsensitivitet for konsept $C$, klasse $k$ og lag $l$:

$$
S_{C,k,l}(\mathbf{x}) = \nabla h_{l,k}\bigl(f_l(\mathbf{x})\bigr) \cdot \mathbf{v}_C^l
$$

TCAV-skåren, der $X_k$ er datapunktene med klasse $k$:

$$
\text{TCAV}_{Q_{C,k,l}} = \frac{\bigl|\{\mathbf{x} \in X_k : S_{C,k,l}(\mathbf{x}) > 0\}\bigr|}{|X_k|}
$$

- $n$ er input-dimensjonen og $m$ antall aktiveringer i lag $l$.
- Prikkproduktet projiserer gradienten på CAV-en.

### Sammenhenger

- Proben er logistisk regresjon (kapittel 1), og CAV-en er normalvektoren til beslutningsgrensen $\mathbf{w}\mathbf{x} + b = 0$.
- Sensitiviteten bruker gradientene fra backprop (kapittel 5.4). Derfor er metoden modellspesifikk.
- Data processing inequality bruker gjensidig informasjon, en slektning av entropi og KL-divergens (kapittel 1.7 og 6.6), og Markov-kjeder, som i RL (kapittel 7.1).

### Vanlige misforståelser

- «Et konsept er en feature.» Konsepter er implisitte, features eksplisitte.
- «TCAV er lokal.» Den er global.
- «TCAV-skår 0,9 betyr at konseptet forklarer 90 % av prediksjonen.» Den betyr at sensitiviteten er positiv for 90 % av bildene i klassen.
- «Data processing inequality sier at informasjonen alltid avtar.» Den sier at den ikke kan øke.
- «En CAV finnes for hele nettet.» Den lages per lag.

### Eksamensoppsummering

- Kunne data processing inequality og hva den betyr for nevrale nett.
- Forklare forskjellen på konsept og feature.
- Kunne de fire stegene for å lage en CAV, og hva en probe er.
- Kunne formelen for konseptsensitivitet og TCAV-skåren, tolke en skår, og vite at TCAV er global og modellspesifikk.

---

## 8.7 Begrepene oppsummert {#xai-oppsummert}

*Kilder: notater 5.5, F13.*

### Introduksjon

XAI-delen er begrepstung. Denne delen samler begrepene og metodene, slik at du raskt kan klassifisere en metode på eksamen.

### Begreper

| Begrep | Betydning | Eksempel |
|---|---|---|
| Surrogatmodell | Modellen erstattes av en tolkbar modell som etterligner den, ofte bare lokalt | LIME |
| Modellagnostisk | Trenger bare input og output, kan brukes på enhver modell | SHAP (KernelExplainer), LIME |
| Modellspesifikk | Bruker parametre, arkitektur eller gradienter | TCAV, `DeepExplainer`, `TreeExplainer` |
| Post-hoc | Lages etter at modellen er trent | Alle metodene i kurset |
| Lokal | Gjelder én prediksjon eller et lite område | SHAP for ett punkt, LIME |
| Global | Gjelder hele modellen | TCAV, beeswarm (aggregert SHAP) |

### Forklaring

**SHAP, LIME og TCAV side om side.**

| | SHAP | LIME | TCAV |
|---|---|---|---|
| Idé | Rettferdig fordeling av prediksjonen mellom features (spillteori) | Tolkbar modell som etterligner $f$ lokalt | Hvor mye et konsept påvirker en klasse |
| Forklarer med | Features | Features | Konsepter |
| Omfang | Lokal (kan aggregeres) | Lokal | Global |
| Krav til modellen | Ingen (modellagnostisk) | Ingen (modellagnostisk) | Gradienter og indre aktiveringer |
| Styrke | Aksiomer: effektivitet, symmetri, nullspiller, additivitet | Enkel og fleksibel | Menneskelige begreper |
| Svakhet | $2^N$, valg av bakgrunnsdata, antar uavhengige features | Ingen garanti, avhenger av nabolaget, tilfeldig | Krever probing-data per konsept |

### Formler

$$
\text{SHAP: } f(\mathbf{x}^*) = \phi_0 + \sum_j \phi_j^*, \qquad \text{LIME: } \arg\min_{g \in G}\mathcal{L}(f, g, \pi_{\mathbf{x}}) + \Omega(g), \qquad \text{TCAV: andel med } S_{C,k,l} > 0
$$

### Sammenhenger

- Valget av metode avhenger av spørsmålet: «hvorfor fikk dette huset denne prisen?» (SHAP eller LIME, lokalt), «hvilke features er viktigst generelt?» (aggregert SHAP), «bruker modellen konseptet striper?» (TCAV).
- Forklaringer er et verktøy for etterlevelse av AI Act og prinsippet om explicability (kapittel 9).

### Vanlige misforståelser

- «Modellagnostisk betyr global.» De er uavhengige egenskaper.
- «Alle SHAP-explainere er modellagnostiske.» Tree- og DeepExplainer bruker modellens indre, men metoden SHAP regnes som modellagnostisk.

### Eksamensoppsummering

- Gi minst ett eksempel på hvert begrep.
- Klassifisere SHAP, LIME og TCAV etter omfang, modellkrav og hva de forklarer med.
