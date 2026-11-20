---
kapittel: 2
tittel: Bayes, ubalanserte data og beslutningstrær
kilder: Forelesningsnotater 1.2.7–1.3.4, F3 (Klassifisering, Bayes’ teorem, ubalanserte data og beslutningstrær), eksamen 2024 og 2025, øving 2
---

# Kapittel 2 – Bayes, ubalanserte data og beslutningstrær

Kapittel 1 ga oss en modell som estimerer $p(y \mid \mathbf{x})$. Dette kapittelet spør hva den sannsynligheten egentlig er (Bayes’ teorem), hvorfor vi ikke bare regner den ut (dimensjonsforbannelsen), hva som skjer når klassene er skjevt fordelt, og hvordan en helt annen modelltype, beslutningstreet, løser klassifisering.

> **Det emneansvarlig forventer mest av alt (F3):** «Er det én ting jeg forventer av dere når dette semesteret er over, så er det at dere vet hvilke antakelser metodene deres gjør.»

---

## 2.1 Bayes’ teorem i klassifisering {#bayes}

*Kilder: notater 1.2.7, F3, eksamen 2025 del 2, øving 2.*

### Introduksjon

Alle klassifiseringsmodeller prøver å estimere $p(C_k \mid \mathbf{x})$, sannsynligheten for klasse $k$ gitt et datapunkt. Bayes’ teorem gir et eksakt uttrykk for denne sannsynligheten. Etter denne delen skal du kunne navnene på alle leddene, vite hvilke som kan estimeres fra data og hvilke som er vanskelige, og forstå hvorfor vi likevel trenger maskinlæring.

### Begreper

- **Betinget sannsynlighet $P(A \mid B)$:** sannsynligheten for $A$ gitt at $B$ har skjedd.
- **Posterior $p(C_k \mid \mathbf{x})$:** sannsynligheten for klassen (hypotesen) i lys av dataene. En oppdatert prior. Det er dette vi vil ha.
- **Prior $p(C_k)$:** sannsynligheten for klassen uten informasjon om datapunktet, altså klassefordelingen i treningsdataene. Merk at $\mathbf{x}$ ikke er med.
- **Likelihood $p(\mathbf{x} \mid C_k)$:** sannsynligheten for å observere dataene gitt klassen. Én fordeling per klasse, med like mange dimensjoner som det er features.
- **Evidens $p(\mathbf{x})$:** fordelingen av selve dataene, uavhengig av klasse. Merk at $C_k$ ikke er med.
- **Simultanfordeling:** den felles fordelingen av alle features, for eksempel $p(\text{Age}, \text{Sex}, \text{Pclass})$.

### Forklaring

**Utledning.** For to overlappende mengder $A$ og $B$ kan sannsynligheten for snittet skrives på to måter, og ved å sette dem lik hverandre får vi Bayes’ teorem. Teoremet holder uansett sannsynlighetstolkning (frekventistisk eller bayesiansk).

**I klassifisering.** Vi har gjort en observasjon $\mathbf{x}$ og spør hvor sannsynlig det er at den tilhører klasse $k$. Svaret er prior ganger likelihood, delt på evidensen.

**Kan vi regne ut leddene for Titanic?**

| Ledd | Kan det beregnes? |
|---|---|
| Prior $p(C_k)$ | Ja. Andelen `Survived = 1` og `Survived = 0` i dataene. |
| Evidens $p(\mathbf{x})$ | Svært vanskelig, for vi trenger fordelingen av alle mulige verdier av alle features. Men den er lik for alle klasser, så den kan droppes når vi bare sammenligner klasser. |
| Likelihood $p(\mathbf{x} \mid C_k)$ | Vanskelig når features avhenger av hverandre, fordi vi da trenger en flerdimensjonal simultanfordeling per klasse. |

Evidensen er altså bare en normaliseringskonstant: den sørger for at posteriorene for alle klasser summerer til 1 og blir en gyldig sannsynlighetsfordeling. For å finne den mest sannsynlige klassen holder proporsjonaliteten.

**Hvorfor maskinlæring?** Hvis vi kunne regne ut alle leddene, ville vi aldri trengt maskinlæring, for da hadde vi den eksakte posterioren. I nesten alle nyttige tilfeller går det ikke, fordi likelihood og evidens krever simultanfordelinger vi ikke har data nok til å estimere (2.3). Vi driver med maskinlæring fordi vi ikke har noe valg. Outputen fra en maskinlæringsmodell er derfor aldri posterioren selv, men en *estimert* posterior under antakelser som gjør estimeringen mulig. Naiv Bayes antar uavhengige features. Andre modeller antar andre ting.

### Formler

$$
P(A \cap B) = P(A \mid B)P(B) = P(B \mid A)P(A) \quad\Longrightarrow\quad P(A \mid B) = \frac{P(B \mid A)P(A)}{P(B)}
$$

$$
\underbrace{p(C_k \mid \mathbf{x})}_{\text{posterior}} = \frac{\overbrace{p(\mathbf{x} \mid C_k)}^{\text{likelihood}}\;\overbrace{p(C_k)}^{\text{prior}}}{\underbrace{p(\mathbf{x})}_{\text{evidens}}}
$$

Uten evidensen:

$$
p(C_k \mid \mathbf{x}) \propto p(\mathbf{x} \mid C_k)\,p(C_k)
$$

For to klasser er det nok å se på forholdet. Er det større enn 1, er klasse 0 mest sannsynlig:

$$
\frac{p(\mathbf{x} \mid C_0)\,p(C_0)}{p(\mathbf{x} \mid C_1)\,p(C_1)}
$$

### Sammenhenger

- Logistisk regresjon estimerer posterioren direkte. Naiv Bayes estimerer prior og likelihood og setter dem sammen.
- Priorens rolle forklarer problemet med ubalanserte data: når én klasse dominerer, kan prioren dominere prediksjonen (2.4).
- At likelihood krever simultanfordelinger, er inngangen til dimensjonsforbannelsen (2.3).

### Vanlige misforståelser

- «Evidensen avhenger av klassen og må regnes ut per klasse.» Den er uavhengig av klassen.
- «Evidensen avgjør hvilken klasse som vinner.» Den skalerer alle klasser likt og påvirker ikke rangeringen.
- «Prior er sannsynligheten for dataene.» Prior er sannsynligheten for klassen før vi ser datapunktet.
- «Modellens output er den sanne posterioren.» Den er et estimat under antakelser.

### Eksamensoppsummering

- Kunne Bayes’ teorem og navnet og betydningen til hvert ledd.
- Vite at prior kan regnes fra klassefordelingen, at evidensen kan droppes fordi den er lik for alle klasser, og at likelihood er vanskelig når features er avhengige.
- Forklare hvorfor vi trenger maskinlæring: vi kan ikke regne ut posterioren eksakt.

---

## 2.2 Naiv Bayes og avhengige features {#naiv-bayes}

*Kilder: notater 1.2.7–1.2.8, F3, eksamen 2025 2.2, øving 2 Problem 2.*

### Introduksjon

Naiv Bayes gjør likelihooden håndterbar med én antakelse: at featurene er uavhengige gitt klassen. Det er en enkel og ofte overraskende god klassifikator, og den er et skoleeksempel på at en metode bare er så god som antakelsene den gjør. Etter denne delen skal du kunne regne naiv Bayes for hånd, forklare antakelsen og vurdere når den holder.

### Begreper

- **Betinget uavhengighet:** featurene er uavhengige av hverandre gitt klassen, slik at likelihooden kan skrives som et produkt.
- **Naiv Bayes:** klassifikator som bruker Bayes’ teorem med denne antakelsen. Den er «naiv» fordi antakelsen sjelden holder helt.
- **Gaussisk naiv Bayes:** for kontinuerlige features bruker vi en fordeling, for eksempel en gauss, i stedet for å gruppere verdiene i kategorier.
- **Kalibrert sannsynlighet:** en sannsynlighet som stemmer med de faktiske frekvensene. Naiv Bayes-tallene er ikke kalibrerte.

### Forklaring

**Antakelsen.** Er en passasjers kjønn uavhengig av alder? Trolig ja. Er kjønn uavhengig av passasjerklasse? F3 viser med et krysstabell-plott at det ikke er det: kjønnsfordelingen varierer mellom klassene. Naiv Bayes antar likevel at *alle* features er uavhengige gitt klassen. Da blir simultanfordelingen et produkt av én-dimensjonale fordelinger, som er lette å estimere ved å telle.

**Prediksjonen.** Velg klassen som maksimerer prior ganger produktet av likelihoodene for hver feature.

**Tallene er ikke posteriorer.** Siden vi har droppet evidensen og gjort en antakelse som ikke holder helt, er tallene verken normaliserte eller kalibrerte. Men så lenge vi bare vil sammenligne to klasser og regner begge på samme måte (og antakelsene holder), er det greit. F3s Titanic-eksempel (første klasse, kvinne, 24 år) gir 0,047 for overlevelse mot 0,005 for å dø, altså overlevelse.

**Regneeksempel.** Dataene fra F3 om når det passer å gå tur (14 dager, 9 ja og 5 nei). Skal vi gå en dag med *Himmel = Overskyet, Temp = Mildt, Vind = Svak*? Vi teller i tabellen:

| | Ja (9 dager) | Nei (5 dager) |
|---|---|---|
| Prior | $9/14$ | $5/14$ |
| Himmel = Overskyet | $2/9$ | $2/5$ |
| Temp = Mildt | $5/9$ | $1/5$ |
| Vind = Svak | $6/9$ | $2/5$ |
| Produkt | $\approx 0{,}0529$ | $\approx 0{,}0114$ |

Ja vinner. Normaliserer vi de to tallene, får vi omtrent 0,82 for ja, men husk at det ikke er en kalibrert sannsynlighet.

En konsekvens av å telle: ingen nei-dager hadde sol, så $p(\text{Sol} \mid \text{Nei}) = 0$, og *enhver* soldag får produkt 0 for nei. Én manglende kombinasjon i treningsdataene kan altså avgjøre alt. (Teknikker for å glatte ut dette er ikke pensum.)

**Kontinuerlige features.** I stedet for å gruppere alder i kategorier kan vi anta at alder er normalfordelt innen hver klasse. Vi estimerer snitt $\mu$ og standardavvik $\sigma$ per klasse fra treningsdataene og bruker tettheten som likelihood. I F3 gir dette mer presise tall, men samme konklusjon.

**Hva om features er avhengige?** Da må vi estimere simultanfordelingen per klasse, for eksempel $p(\text{Sex}, \text{Age}, \text{Pclass} \mid \text{Survived})$. For Titanic kan det gjøres med en tabell der hver verdi av hver feature kombineres med alle verdier av de andre (alder delt inn i for eksempel ti grupper). Det gir et litt bedre estimat enn naiv Bayes, men mange celler i tabellen får svært få datapunkter. Det er en miniversjon av dimensjonsforbannelsen.

**Kobling til øving 2.** Problem 2 spør hvilke ledd i Bayes’ teorem som kan estimeres fra vikingdataene og hvilke som er vanskelige, og ber deg regne naiv Bayes for hånd uten biblioteker. Prioren er en telling. Likelihooden blir håndterbar med uavhengighetsantakelsen. Evidensen og den fulle simultanfordelingen er de vanskelige leddene.

### Formler

$$
p(C_k \mid \mathbf{x}) \propto p(C_k)\prod_{i=1}^{n} p(x_i \mid C_k)
$$

$$
\hat{y} = \arg\max_{k}\; p(C_k)\prod_{i=1}^{n} p(x_i \mid C_k)
$$

Gaussisk likelihood for en kontinuerlig feature, med $\mu$ og $\sigma$ estimert per klasse:

$$
F(x) = \frac{1}{\sigma\sqrt{2\pi}}\exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)
$$

- $n$ er antall features.
- $\mu$ er forventningsverdien (midten av gaussen), $\sigma$ standardavviket og $\sigma^2$ variansen.

### Sammenhenger

- Naiv Bayes antar uavhengige features. Logistisk regresjon antar en lineær beslutningsgrense. Beslutningstrær antar at klassene kan skilles med akseparallelle splitter. Alle er antakelser som gjør estimeringen mulig.
- Uavhengighetsantakelsen er det som redder oss fra dimensjonsforbannelsen: én-dimensjonale fordelinger trenger få datapunkter.
- Gaussen her er den samme fordelingen som ligger bak MSE i regresjon (kapittel 3) og bak SNE (kapittel 6).

### Vanlige misforståelser

- «Featurene må være uavhengige i datasettet for at naiv Bayes skal kunne brukes.» Modellen *antar* betinget uavhengighet og kan brukes uansett. Prediksjonene blir bare dårligere jo mer antakelsen brytes.
- «Hvis features er avhengige, kan naiv Bayes ikke regne ut noe.» Den regner ut et tall uansett, men tallet bygger på en feil antakelse.
- «Uavhengighetsantakelsen gjelder bare numeriske features.» Den gjelder alle.
- «Naiv Bayes gir sanne sannsynligheter.» Tallene er ikke kalibrerte.

### Eksamensoppsummering

- Kunne naiv Bayes-formelen og regne et eksempel for hånd med en tabell.
- Forklare antakelsen om (betinget) uavhengige features, og gi eksempler på features som er og ikke er uavhengige (Sex og Age vs Sex og Pclass).
- Vite at kontinuerlige features kan håndteres med en fordeling, for eksempel en gauss.
- Forklare hva som må til uten uavhengighetsantakelsen (simultanfordeling per klasse) og hvorfor det er vanskelig.

---

## 2.3 Dimensjonsforbannelsen {#dimensjonsforbannelsen}

*Kilder: notater 1.2.8–1.2.9, F3. Kommer igjen i notater 3.1.4 og F8 (kapittel 6).*

### Introduksjon

Hvorfor kan vi ikke bare estimere simultanfordelingen fra data? Fordi datamengden vi trenger, vokser eksponentielt med antall dimensjoner. Dette er dimensjonsforbannelsen, og den er en av de viktigste grunnene til at maskinlæring trenger forenklende antakelser. Etter denne delen skal du kunne regne ut hvor mye data som trengs, og forklare hva det betyr i praksis.

### Begreper

- **Dimensjon $d$:** antall features.
- **Bin:** ett intervall i et histogram. Med 10 bins per akse har et $d$-dimensjonalt histogram $10^d$ bins.
- **Dimensjonsforbannelsen (curse of dimensionality):** at datamengden som trengs for å dekke rommet, vokser eksponentielt med $d$.

### Forklaring

**Tankeeksperiment.** Vi estimerer en fordeling med et histogram, og vi er fornøyde med 10 bins per akse og 10 datapunkter per bin.

| Dimensjoner $d$ | Bins | Datapunkter |
|---|---|---|
| 1 | $10$ | $10^2$ |
| 3 | $10^3$ | $10^4$ |
| 10 | $10^{10}$ | $10^{11}$ |
| 784 | $10^{784}$ | $10^{785}$ |

Tre features krever 10 000 punkter, som er overkommelig. Ti features krever $10^{11}$. MNIST, med $28 \times 28 = 784$ piksler, ville krevd $10^{785}$ punkter. Til sammenligning er det rundt $10^{82}$ atomer i universet.

**Høydimensjonal geometri (frivillig oppgave i F3).** Hvor stor andel av en $d$-dimensjonal kule ligger i det ytterste skallet med tykkelse $\epsilon$? Volumet går som $r^d$, så med $r = 1$ er andelen innenfor skallet $(1-\epsilon)^d$, og andelen i skallet er resten. Med $\epsilon = 0{,}01$:

- $d = 3$: omtrent 3 % av volumet ligger i skallet.
- $d = 100$: omtrent 63 %.
- $d = 784$: omtrent 99,96 %.

I høye dimensjoner ligger nesten alt volum ved overflaten. Data blir glissent spredt, og intuisjonen fra to og tre dimensjoner svikter.

### Formler

Antall datapunkter med $b$ bins per akse og $m$ punkter per bin:

$$
N = m \cdot b^{d}, \qquad \text{med } b = m = 10:\quad N = 10^{d+1}
$$

Andel av volumet i et skall med tykkelse $\epsilon$ i en enhetskule:

$$
\frac{V(1) - V(1-\epsilon)}{V(1)} = 1 - (1-\epsilon)^{d} \;\xrightarrow{d \to \infty}\; 1
$$

### Sammenhenger

- Dimensjonsforbannelsen er grunnen til at vi ikke kan regne ut posterioren eksakt (2.1), og til at naiv Bayes trenger uavhengighetsantakelsen (2.2).
- I uveiledet læring dukker den opp igjen som *concentration of distances*: i høye dimensjoner blir alle avstander store og nesten like, og klyngealgoritmer feiler. Flere data hjelper ikke, så vi reduserer dimensjonen (kapittel 6).

### Vanlige misforståelser

- «Datamengden vokser lineært med antall features.» Den vokser eksponentielt.
- «Med nok data forsvinner problemet.» For realistiske $d$ finnes ikke nok data i universet.

### Eksamensoppsummering

- Kunne regne ut antall bins og datapunkter for gitt $d$, og vite at veksten er eksponentiell.
- Kjenne MNIST-eksempelet ($d = 784$).
- Koble dimensjonsforbannelsen til naiv Bayes og til klynging i høye dimensjoner.

---

## 2.4 Ubalanserte data {#ubalanse}

*Kilder: notater 1.2.10, F3, eksamen 2024 og 2025, øving 2 Problem 1.*

### Introduksjon

I mange viktige problemer er den interessante klassen sjelden: syke pasienter, svindel, defekte produkter. En modell kan da få svært høy accuracy uten å være nyttig. Etter denne delen skal du kunne gjenkjenne problemet, forklare hvorfor det oppstår, og kjenne de tre løsningene i kurset: endre terskelen, endre dataene (resampling) og endre tapsfunksjonen.

### Begreper

- **Ubalanserte (skjevfordelte) data:** én klasse har mange færre datapunkter enn den andre.
- **Underrepresentert og overrepresentert klasse:** klassen med færrest og flest datapunkter.
- **Accuracy-paradokset:** høy accuracy, men modellen finner nesten ingen i den sjeldne klassen.
- **Prior probability shift:** notatene bruker begrepet om at prediksjonen domineres av prioren $p(C_k)$ i stedet for av leddene som inneholder informasjon om featureverdiene.
- **Resampling:** å endre klassefordelingen i treningsdataene.
- **Undersampling:** trekke like mange punkter fra den store klassen som det finnes i den lille.
- **Oversampling:** kopiere punkter fra den lille klassen til den er like stor som den store.
- **Vektet tapsfunksjon:** gir feilprediksjoner på én klasse høyere tap.

### Forklaring

**Intervjuspørsmålet (F3 og notatene).** Et helsedatasett, en modell med 99 % accuracy, men den finner nesten ingen syke. Hva har skjedd? Svaret er at de syke er svært få. Den letteste måten for modellen å få høy accuracy på er å predikere «frisk» for alle. Modellen får høy accuracy og kan også få høy ROC AUC, men den er ikke det minste nyttig: de fleste positive klassifiseres som negative, så det er mange falske negative og recall er oppsiktsvekkende lav. Moralen er at vi må se på flere metrikker for å forstå svakhetene.

**Løsning 0: endre terskelen («fattigmannsløsningen»).** Senker vi terskelen fra 0,5, blir flere predikert positive, og recall øker, gjerne på bekostning av precision og accuracy. Terskelen kan velges fra precision–recall-plottet. Men å endre terskelen gjør ikke *modellen* bedre. Det endrer bare hvordan vi bruker prediksjonene.

**Løsning 1: endre dataene (resampling).**

- *Undersampling* gir like mange punkter i hver klasse, men potensielt svært få totalt. Informasjon fra den store klassen går tapt, så modellen kan **undertilpasse** og bomme på punkter fra den store klassen. Det er høy bias.
- *Oversampling* gir også like mange i hver klasse, men mange duplikater. Modellen kan memorere de kopierte punktene og **overtilpasse**. Det er høy varians. I F3 endte modellen med å prioritere de kopierte punktene.
- De to kan kombineres.

Regneeksempel (notatene): 100 punkter i den ene klassen og 1000 i den andre.

- Undersampling: 100 fra hver klasse, 200 totalt.
- Oversampling: 1000 i hver klasse, 2000 totalt, hvorav 900 er duplikater.

Etter resampling må modellen evalueres på nytt. Har den blitt bedre på metrikkene vi bryr oss om? Har den fått nye svakheter? F3 måtte senke læringsraten kraftig for at tapet skulle stabilisere seg etter undersampling.

**Løsning 2: endre tapsfunksjonen.** I stedet for å endre hvilke data modellen ser, sier vi at én klasse er ekstra viktig. I binær cross-entropy er bare ett ledd ulikt null per datapunkt. For $y = 1$ er det andre leddet null, så en vekt $w_1 > 1$ på det første leddet gir høyere tap for klasse 1. For $y = 0$ er det første leddet null, så en vekt $w_0$ på det andre leddet virker bare på klasse 0. Er $w_1$ mye større enn $w_0$, prioriterer modellen å få klasse 1 riktig. En vanlig tommelfingerregel er vekter omvendt proporsjonale med klassefrekvensen: med 10 % positive blir $w_1 / w_0 = 9$.

For tapsfunksjoner som ikke har så ryddige ledd (for eksempel med flere klasser), lager vi en vekt per datapunkt ut fra labelen og tar et vektet snitt:

```python
def weighted_loss(y_true, y_pred, class_weights):
    weights = np.array([class_weights[int(i)] for i in y_true])
    unweighted_loss = ...                 # tap per datapunkt
    return (unweighted_loss * weights).mean()
```

### Formler

Vektet binær cross-entropy:

$$
\mathcal{L}(y_{\text{pred}}, y) = -w_1\, y \ln y_{\text{pred}} - w_0 (1 - y)\ln(1 - y_{\text{pred}})
$$

- $w_1$ vekter tapet for punkter med $y = 1$, og $w_0$ for punkter med $y = 0$.
- Med $w_0 = w_1 = 1$ får vi vanlig cross-entropy.

### Sammenhenger

- Ubalanse er et problem med prioren i Bayes’ teorem: den store klassen får høy prior og dominerer.
- Resampling gir over- og undertilpasning, altså bias–varians-problemer (kapittel 3).
- Valg av metrikk (kapittel 1) avgjør om vi i det hele tatt oppdager problemet. Accuracy og til dels ROC AUC kan villede. Recall, precision og confusion matrix avslører det.
- Øving 2 Problem 1 er ubalansert, med 17 % positive.

### Vanlige misforståelser

- «Oversampling legger til ny informasjon.» Den kopierer bare eksisterende punkter.
- «Oversampling gjør modellen mindre tilbøyelig til å overtilpasse fordi klassene blir balanserte.» Duplikatene gjør overtilpasning *mer* sannsynlig.
- «Oversampling endrer den underliggende fordelingen til den lille klassen.» Den gjentar de samme punktene. Fordelingen av unike punkter er den samme.
- «Undersampling reduserer den lille klassen.» Den reduserer den store.
- «Lavere terskel gjør modellen bedre.» Den flytter bare balansen mellom feiltypene.

### Eksamensoppsummering

- Forklare accuracy-paradokset og hvorfor recall blir lav.
- Kunne regne ut antall punkter etter under- og oversampling og antall duplikater.
- Vite at undersampling kan gi undertilpasning (høy bias) og oversampling overtilpasning (høy varians).
- Kunne skrive vektet cross-entropy og forklare hvilket ledd som vektes for hvilken klasse.
- Vite at terskelendring ikke forbedrer modellen.

---

## 2.5 Beslutningstrær: oppbygning og urenhetsmål {#beslutningstraer}

*Kilder: notater 1.3.1–1.3.3, F3, eksamen 2024 og 2025, øving 2.*

### Introduksjon

Etter logistisk regresjon er beslutningstreet den nest enkleste modellen. Det klassifiserer ved å stille en rekke ja/nei-spørsmål om featurene. Trær er lette å tolke, krever ikke skalering, og er byggesteinen i random forest og boosting (kapittel 4). Etter denne delen skal du kunne begrepene, regne Gini og entropi, og velge den beste splitten.

### Begreper

- **Rotnode:** starten på treet, der data med alle features kommer inn.
- **Beslutningsnode:** node under rotnoden med ett eller flere splitt-kriterier.
- **Splitt-kriterium:** regelen som deler dataene i en node, alltid på én feature (for eksempel «antall bananer > 2?»).
- **Løvnode:** node som ikke splitter, men gir prediksjonen.
- **Trestump:** én rotnode med $n$ løvnoder. Kurset bruker $n = 2$, altså binære splitter.
- **Urenhet (impurity):** hvor blandet klassene er i en node.
- **Gini-urenhet:** sannsynligheten for å feilklassifisere et tilfeldig punkt hvis det får et tilfeldig label trukket etter klassefordelingen i noden.
- **Entropi:** usikkerheten i klassefordelingen (som i kapittel 1, med $\log_2$).
- **Informasjonsgevinst $\Delta I$:** reduksjonen i entropi fra før til etter en splitt.
- **Log loss:** cross-entropy, som også kan brukes som splitt-kriterium.

### Forklaring

**Hvordan treet bygges.** Treningsdataene brukes til å finne hvilke stumper (feature og terskel) som skal settes sammen. Det samme datasettet kan gi mange ulike trær. Vi vil alltid velge splitten som lar oss ta beslutningen tidligst mulig, altså den som reduserer usikkerheten mest:

$$
\text{redusert usikkerhet} = \text{usikkerhet før splitt} - \text{usikkerhet etter splitt}
$$

Usikkerheten kan måles med Gini-urenhet, entropi eller log loss.

**Gini-intuisjon.** Du har en pose med kuler i ulike farger (klasser). Du trekker en kule og gjetter farge etter fordelingen i posen. Er nesten alle kulene like, gjetter du sjelden feil: lav urenhet. Er fargene jevnt fordelt, gjetter du ofte feil: høy urenhet.

| Fordeling i noden | Gini |
|---|---|
| 0 og 10 (ren) | $1 - 0^2 - 1^2 = 0$ |
| 3 og 7 | $1 - 0{,}3^2 - 0{,}7^2 = 0{,}42$ |
| 5 og 5 | $1 - 0{,}5^2 - 0{,}5^2 = 0{,}5$ |

Vi velger splitten som gir lavest vektet Gini etter splitt.

**Entropi.** Entropien er 1 for en jevn binær fordeling og 0 når alle punkter er i samme klasse. For eksempel er $I(0{,}5;\ 0{,}5) = 1$ og $I(0{,}01;\ 0{,}99) \approx 0{,}08$. Vi velger splitten med størst informasjonsgevinst.

**Regneeksempel (F3 og notatene).** Tur-dataene har $p = 9$ ja og $n = 5$ nei. Vi splitter på *Himmel = Sol?*. Nei-grenen får $(4, 5)$ og ja-grenen $(5, 0)$.

$$
I_{\text{før}} = I\!\left(\tfrac{9}{14}, \tfrac{5}{14}\right) \approx 0{,}94
$$

$$
\mathbb{E}[I_{\text{etter}}] = \tfrac{9}{14}\, I\!\left(\tfrac{4}{9}, \tfrac{5}{9}\right) + \tfrac{5}{14}\, I(1, 0) \approx \tfrac{9}{14}\cdot 0{,}99 + 0 \approx 0{,}64
$$

$$
\Delta I \approx 0{,}94 - 0{,}64 = 0{,}30
$$

Tallet sier lite alene, men vi kan bruke det til å rangere alle mulige splitter og velge den beste. Med Gini blir det samme: før splitt $1 - (9/14)^2 - (5/14)^2 \approx 0{,}46$, etter splitt $\tfrac{9}{14}\cdot 0{,}49 + \tfrac{5}{14}\cdot 0 \approx 0{,}32$.

**Gini vs entropi.** Plottet over $[0, 1]$ oppfører de seg nesten likt og gir i hovedsak de samme splittene. Entropi krever en logaritme og er dyrere å regne ut. Gini er derfor raskere og er standardvalget i `sklearn.tree.DecisionTreeClassifier`. Log loss og entropi har samme form ($-\sum p \log p$ mot $-\sum y \log \hat{y}$) og er nært beslektet.

### Formler

Gini-urenhet for et datasett $D$ med $k$ klasser, der $p_i$ er andelen i klasse $i$:

$$
\text{Gini}(D) = 1 - \sum_{i=1}^{k} p_i^2
$$

Vektet Gini etter splitt på feature $f$ i $D_1$ og $D_2$ med $n_1$ og $n_2$ punkter ($n = n_1 + n_2$):

$$
\text{Gini}_f(D) = \frac{n_1}{n}\,\text{Gini}(D_1) + \frac{n_2}{n}\,\text{Gini}(D_2)
$$

Entropi:

$$
I(p_1, \dots, p_k) = -\sum_{i=1}^{k} p_i \log_2 p_i
$$

Entropi før splitt, forventet entropi etter og informasjonsgevinst, med $p$ positive og $n$ negative før splitt og $p_i, n_i$ i gren $i$ av $s$ grener (her $s = 2$):

$$
I_{\text{før}} = I\!\left(\frac{p}{p+n}, \frac{n}{p+n}\right)
$$

$$
\mathbb{E}[I_{\text{etter}}] = \sum_{i=1}^{s} \frac{p_i + n_i}{p + n}\, I\!\left(\frac{p_i}{p_i + n_i}, \frac{n_i}{p_i + n_i}\right)
$$

$$
\Delta I = I_{\text{før}} - \mathbb{E}[I_{\text{etter}}]
$$

- Gini ligger i $[0;\ 0{,}5]$ for to klasser. Med $k$ klasser er maksimum $1 - 1/k$.
- Entropi ligger i $[0, 1]$ for to klasser (med $\log_2$).
- Vektene $\frac{p_i + n_i}{p + n}$ er andelen av punktene som havner i hver gren.

### Sammenhenger

- Entropien her er den samme som i kapittel 1. Log loss som splitt-kriterium er cross-entropy.
- Trær trenger ikke skalering, fordi de bare sammenligner én feature med en terskel.
- Splittene er akseparallelle. Beslutningsflaten blir derfor trappeformet, og diagonale grenser krever mange splitter. Det er treets induktive bias.
- Regresjonstrær (kapittel 3) bruker samme idé, men måler urenhet med varians i stedet for Gini eller entropi.

### Vanlige misforståelser

- «Vi velger featuren med høyest Gini.» Vi velger den med *lavest* Gini etter splitt (eller størst reduksjon).
- «Gini og entropi gir helt ulike trær.» De gir i hovedsak de samme splittene.
- «Gini-urenheten etter splitt er snittet av de to grenene.» Den er et *vektet* snitt etter antall punkter.
- «Alle splitter er like gode så lenge de er gyldige.» Splittene rangeres etter hvor mye de reduserer urenheten.

### Eksamensoppsummering

- Kunne begrepene rotnode, beslutningsnode, løvnode, stump og splitt-kriterium.
- Regne Gini og entropi for en node, vektet Gini etter splitt og informasjonsgevinst.
- Velge splitten med lavest urenhet etter splitt eller størst informasjonsgevinst.
- Vite at Gini er raskest og standard i sklearn, og at Gini og entropi oppfører seg nesten likt.

---

## 2.6 Bygge beslutningstrær {#bygge-traer}

*Kilder: notater 1.3.4, F3, øving 2.*

### Introduksjon

Du trenger ikke bygge trær selv i kurset, men du skal kunne skrive pseudokoden og forklare stoppkriteriene. Etter denne delen skal du kunne forklare når treet slutter å splitte, hva løvnoder med blandede klasser predikerer, og hvordan dybden påvirker modellen.

### Begreper

- **Rekursiv algoritme:** en funksjon som kaller seg selv. Treet bygges rekursivt fordi hvert deltre også er et tre.
- **`max_depth`:** maksimal dybde, en hyperparameter som velges før treet bygges.
- **Dominant klasse:** klassen med flest treningspunkter i en node.
- **Beslutningsflate (decision boundary):** overgangen mellom områdene i feature-rommet som får ulik klasse.

### Forklaring

**Tre stoppkriterier** (i tillegg til det opplagte, at alle punkter i noden er i samme klasse):

1. **Ingen features igjen å splitte på.** Dataene lar seg kanskje ikke splitte perfekt. To dager med *Regn, Varmt, Sterk* kan ha ulikt svar. Da må noden bli en løvnode selv om den er blandet.
2. **Ingen datapunkter igjen å teste.** Alle kombinasjoner av features som *finnes i dataene*, er testet, selv om ikke alle *tenkelige* kombinasjoner er det.
3. **Maksimal dybde er nådd.**

**Løvnoder med blandede klasser.** Det vanligste, og det sklearn gjør, er å returnere den dominante klassen. Et alternativ er å trekke et tilfeldig label fra treningsdataene, altså å predikere prioren.

**Pseudokode (notatene og F3):**

```python
def build_decision_tree(data, features, depth):
    if (all data in same class):
        return class label
    elif (no features left to test) or (depth >= max_depth):
        return 1 if p/(p+n) > n/(p+n) else 0      # dominant klasse
    elif (no data left to test):
        return (dominant class in parent node)
    else:
        choose best_feature f for split             # lavest urenhet etter splitt
        partition data based on f
        for each data partition:
            build_decision_tree(data partition, features - best_feature, depth+1)
```

**I sklearn:**

```python
clf = tree.DecisionTreeClassifier(max_depth=4, criterion="gini")  # eller "entropy", "log_loss"
clf.fit(X_train, y_train)
tree.plot_tree(clf)
```

**Pingvineksempelet (F3).** Kjønn skal predikeres fra vekt og vingelengde. Klassene er ikke lineært separerbare, så logistisk regresjon gir en dårlig lineær beslutningsflate. Et tre klarer seg bedre. Med `max_depth = 7` blir flaten mer oppdelt enn med 4. Bør vi øke dybden videre? Et dypere tre tilpasser seg treningsdataene stadig bedre, men på et tidspunkt lærer det støy. Optimal dybde finnes med valideringsdata (kapittel 3).

**Kobling til øving 2.** Problem 1 ber om et tre med minst 0,90 test-accuracy på ubalanserte data, og spør om features må skaleres og hva som skjer med beslutningsflaten når dybden endres. Svarene: trær trenger ikke skalering, dybden styrer kompleksiteten, og fordi splittene er akseparallelle, sliter treet med den diagonale grensen i dataene. En feature som $x_0 + x_1$ kan hjelpe. Problem 2 sammenligner `gini`, `entropy` og `log_loss`, plotter treet og bruker kryssvalidering.

### Formler

Prediksjon i en løvnode med $p$ positive og $n$ negative treningspunkter:

$$
\hat{y} =
\begin{cases}
1 & \text{hvis } \dfrac{p}{p+n} > \dfrac{n}{p+n} \\[4pt]
0 & \text{ellers}
\end{cases}
$$

### Sammenhenger

- Dybden er en hyperparameter, som læringsraten. Den velges på valideringsdata.
- Et dypt tre har lav bias og høy varians. Det er utgangspunktet for random forest, som reduserer variansen ved å kombinere mange trær (kapittel 4).
- En stump (dybde 1) er den typiske svake lærende modellen i AdaBoost (kapittel 4).

**Oppsummering av klassifikatorene i kurset (F3):**

| Modell | Antakelse | Beslutningsflate |
|---|---|---|
| Logistisk regresjon | Lineær sammenheng i $z$, ingen vekselvirkninger | Lineær (hyperplan) |
| Naiv Bayes | Betinget uavhengige features | Avhenger av fordelingene |
| Beslutningstre | Klassene kan skilles med akseparallelle splitter | Trappeformet |

k-nearest neighbors og støttevektormaskiner (SVM) er andre populære metoder, men er bare nevnt i kurset. Kurset ser på binær klassifisering, som generaliserer til flere klasser, men det studeres ikke.

### Vanlige misforståelser

- «Et tre som klassifiserer alle treningspunkter riktig, er best.» Det har trolig overtilpasset.
- «Løvnoder er alltid rene.» Stoppkriteriene kan gi blandede løvnoder.
- «Trær må skaleres som logistisk regresjon.» Ikke nødvendig.

### Eksamensoppsummering

- Kunne pseudokoden for å bygge et tre og forklare at algoritmen er rekursiv.
- Kunne de tre stoppkriteriene og hva en blandet løvnode predikerer.
- Vite at `max_depth` er en hyperparameter som styrer over- og undertilpasning.
- Forklare hvorfor trær håndterer ikke-lineære problemer bedre enn logistisk regresjon, og hvorfor de sliter med diagonale grenser.
