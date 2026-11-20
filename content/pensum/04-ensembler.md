---
kapittel: 4
tittel: Ensemble-læring – bagging, boosting og stacking
kilder: Forelesningsnotater 1.5, F5 første del (Ensemble-learning, bagging og boosting), eksamen 2024 oppg. 16–18 og 2025 del 3, øving 2 (AdaBoost) og øving 4 (gradient boosting)
---

# Kapittel 4 – Ensemble-læring

Ingen modell er best på alt. Ensemble-læring kombinerer flere modeller slik at de kompenserer for hverandres svakheter. Kapittelet dekker de tre hovedstrategiene, parallell (bagging og random forest), sekvensiell (AdaBoost og gradient boosting) og hierarkisk (stacking), og knytter dem til bias–varians fra kapittel 3.

---

## 4.1 Idéen bak ensembler {#ensembler}

*Kilder: notater 1.5, F5.*

### Introduksjon

Alle modeller gjør antakelser. Lineær regresjon antar en lineær sammenheng, og beslutningstrær antar at rommet kan deles med akseparallelle splitter. Tanken bak ensembler er at mange modeller sammen kan bli bedre enn hver av dem alene. Etter denne delen skal du kunne forklare hvorfor det virker, beskrive de tre måtene å kombinere modeller på, og vite hvordan prediksjoner aggregeres.

### Begreper

- **Ensemble:** en samling modeller hvis prediksjoner kombineres til én.
- **No Free Lunch-teoremet:** ingen modell er alltid best. For å lykkes må du kjenne styrkene og svakhetene til modellene og matche dem mot egenskapene til dataene.
- **Committee of experts:** enkeltindivider kan ta feil, men flertallet i en gruppe er mer robust.
- **Parallelt ensemble:** modellene trenes uavhengig av hverandre, og prediksjonene aggregeres.
- **Sekvensielt ensemble (boosting):** modellene trenes etter hverandre, og hver modell retter opp feilene til de foregående.
- **Hierarkisk ensemble (stacking):** en metamodell lærer å kombinere prediksjonene fra et parallelt ensemble.
- **Inferens:** å bruke en trent modell til å gjøre prediksjoner. Skillet mellom trening og inferens er særlig tydelig i ensembler.

### Forklaring

**Hvorfor det virker.** Tenk deg at en tilfeldig gruppe på $N$ personer skal gjette om det eldste av de danske kongebarna er gutt eller jente. Alle må svare, ingen får snakke sammen (uavhengig gjetting), og flertallet avgjør. Er alle minst like gode som tilfeldig gjetning og noen litt bedre, er sjansen for riktig svar mye høyere med mange personer enn med én. Det samme gjelder modeller: mange uavhengige modeller som hver er litt bedre enn tilfeldig, gir sammen en sterk prediksjon. Nøkkelordet er *uavhengige*. Gjør alle samme feil, hjelper ikke flertallet.

**En samling er ikke et ensemble.** Mange like modeller gir ingenting nytt. Modellene må være *ulike*, og kombinasjonen må gjøres smart. Måter å få diversitet på i et parallelt ensemble:

- ulike algoritmer (et tre, en lineær modell og et nevralt nett)
- samme algoritme med ulike hyperparametre
- samme algoritme med ulike random seeds
- samme algoritme på ulike tilfeldige delmengder av dataene (bagging)
- ulik feature engineering, eller kombinasjoner av dette

**Aggregering (F5).**

| Regresjon | Klassifisering |
|---|---|
| Gjennomsnitt | Majoritetsavstemning |
| Vektet gjennomsnitt | Vektet majoritet |
| Minimum, maksimum, median | Avstemning på den predikerte klassefordelingen (sannsynlighetene) |

**Praktisk råd (notatene).** Når du jobber med tabulære data, slik som i dette kurset, er det lurt alltid å bruke en ensemblemodell som referanse for hvor godt det er mulig å gjøre det. Trebaserte ensembler du bør ha hørt om og helst prøvd: CatBoost, LightGBM, AdaBoost og XGBoost.

### Formler

Parallelt ensemble med $T$ modeller $f_t$, for regresjon og klassifisering:

$$
\hat{y}_{\text{reg}} = \frac{1}{T}\sum_{t=1}^{T} f_t(\mathbf{x}), \qquad \hat{y}_{\text{klass}} = \text{flertallet av } \{f_1(\mathbf{x}), \dots, f_T(\mathbf{x})\}
$$

### Sammenhenger

- Ensembler kan redusere feilen (MSE) og samtidig beholde kompleksiteten og fordelene til modellene (F5). I bias–varians-språk reduserer snitt over mange uavhengige modeller *variansen*, mens boosting, der hver modell retter feilene til de forrige, først og fremst reduserer *bias* (3.5).
- No Free Lunch er grunnen til at kurset vektlegger antakelsene bak hver metode.

### Vanlige misforståelser

- «Flere modeller er alltid bedre.» Bare hvis modellene er ulike og feilene deres er (noenlunde) uavhengige.
- «Ensembler er bare for trær.» Alle modelltyper kan kombineres, også ulike typer i samme ensemble.

### Eksamensoppsummering

- Forklare hvorfor ensembler virker (uavhengige feil, majoritet) og No Free Lunch.
- Kunne de tre strategiene: parallell, sekvensiell og hierarkisk.
- Kunne aggregeringsmåtene for regresjon og klassifisering.

---

## 4.2 Bootstrapping og bagging {#bagging}

*Kilder: notater 1.5.1, F5, eksamen 2024 og 2025 3.1.*

### Introduksjon

Bagging er den mest brukte måten å lage et parallelt ensemble av én modelltype på: tren mange kopier av samme modell på ulike bootstrap-utvalg av treningsdataene og aggreger. Etter denne delen skal du kunne forklare bootstrapping, bagging, og forskjellen mellom bagging og kryssvalidering.

### Begreper

- **Bootstrapping:** å trekke datapunkter fra det samme datasettet *med tilbakelegging*, slik at vi får mange ulike datasett fra det ene vi har.
- **Med tilbakelegging:** samme datapunkt kan trekkes flere ganger, og noen punkter trekkes ikke i det hele tatt.
- **Bagging:** **b**ootstrap **agg**regat**ing**. Tren én modell per bootstrap-utvalg og aggreger prediksjonene.

### Forklaring

**Bootstrapping som statistisk idé.** Vi vil vite huspris-snittet i et område, men kan ikke sjekke alle husene. Vi tar et forhåpentligvis representativt utvalg og regner snittet. Men hvor mye kan vi stole på estimatet? Ved å trekke mange nye datasett med tilbakelegging fra utvalget og regne snittet på hvert, får vi en *fordeling* av estimater. Den gir et mål på usikkerheten, for eksempel noe à la et konfidensintervall. Vi har fått mer ut uten å samle mer data: «pulled ourselves up by our own bootstraps».

**Når bootstrapping svikter (F5).**

- Utvalgene er ikke representative (for små, eller samplingen har en merkelig artefakt).
- Outliers kan få stor påvirkning.
- Dataene har struktur som gjør at tilfeldig subsampling ikke passer, for eksempel tidsrekker.
- Modellene er for stabile, slik at vi underestimerer usikkerheten og får for smale konfidensintervaller.

**Bagging i tre steg.**

1. **Bootstrapping:** lag $T$ datasett ved å trekke med tilbakelegging, typisk like store som originalen.
2. **Trening:** tren én modell på hvert datasett, uavhengig av hverandre.
3. **Aggregering:** snitt (regresjon) eller majoritet (klassifisering).

Fordi hvert utvalg er litt ulikt, blir modellene litt ulike, og variasjonen mellom dem jevnes ut i snittet. Den primære effekten av bootstrap-utvalgene er altså å *øke variasjonen mellom modellene* ved at de trenes på ulike datasett.

En nyttig tommelfingerregel (standard sannsynlighetsregning, ikke fra slidene): et bootstrap-utvalg av størrelse $n$ inneholder i snitt omtrent 63 % av de unike punktene, fordi sannsynligheten for at et bestemt punkt aldri trekkes, er $(1 - 1/n)^n \approx e^{-1} \approx 0{,}37$.

**Eksempel (F5).** Logistisk regresjon på pingvindata. Én modell trent på ett bootstrap-utvalg får 0,66 test-accuracy. Et ensemble av 100 slike modeller får 0,69.

**Kryssvalidering vs bagging (F5).** Begge deler datasettet i flere deler, men de er ikke det samme:

| | Kryssvalidering | Bagging |
|---|---|---|
| Mål | Evaluere hvor godt modellen gjør det på nye data | Øke ytelsen ved å kombinere flere modeller |
| Delene | Overlapper ikke | Kan overlappe (trekking med tilbakelegging) |
| Modellene | Kastes etter evaluering | Alle brukes i den endelige modellen |

### Formler

Sannsynligheten for at et bestemt punkt *ikke* er med i et bootstrap-utvalg av størrelse $n$:

$$
\left(1 - \frac{1}{n}\right)^{n} \;\xrightarrow{n \to \infty}\; e^{-1} \approx 0{,}37
$$

Bagging-prediksjonen for regresjon, med $f_t$ trent på bootstrap-utvalg $D_t$:

$$
\hat{y} = \frac{1}{T}\sum_{t=1}^{T} f(\mathbf{x}; D_t)
$$

### Sammenhenger

- Bagging angriper variansleddet i bias–varians: modeller med høy varians (dype trær, nevrale nett) har mest å tjene.
- Random forest er bagging av trær med ekstra tilfeldighet (4.3).
- Kryssvalidering (kapittel 3.4) evaluerer. Bagging forbedrer.

### Vanlige misforståelser

- «Bootstrapping trekker uten tilbakelegging.» Det er *med* tilbakelegging.
- «Bagging tvinger hver modell til å bruke alle treningsdataene.» Hver modell ser bare et bootstrap-utvalg.
- «Bagging endrer modellarkitekturen.» Arkitekturen er den samme. Det er dataene som varierer.
- «Bagging gjør modellene identiske fordi de får like data.» Utvalgene er ulike, og det er hele poenget.
- «Bagging og kryssvalidering er det samme.» Ulikt mål, ulik splitting, ulik bruk av modellene.

### Eksamensoppsummering

- Forklare bootstrapping (trekking med tilbakelegging) og hvorfor det gir et mål på usikkerhet.
- Kunne de tre stegene i bagging og hvorfor bootstrap-utvalgene gir diversitet.
- Kunne forskjellen mellom bagging og kryssvalidering.

---

## 4.3 Random forest {#random-forest}

*Kilder: notater 1.5.1, F5, eksamen 2025 3.2.*

### Introduksjon

Random forest er et ensemble av beslutningstrær som bruker bagging pluss én ekstra kilde til tilfeldighet. Den er enkel, men overraskende god til tabulære data. Etter denne delen skal du kunne forklare de to tilfeldighetskildene og hvorfor begge trengs.

### Begreper

- **Random forest:** bagging av beslutningstrær der hver beslutningsnode bare får se et tilfeldig utvalg av features.
- **Random features (feature subsampling):** ved hver splitt velges featuren blant et tilfeldig utvalg, ikke blant alle.
- **Korrelasjon mellom trær:** hvor like trærne er i feilene sine.

### Forklaring

**Hvordan ett tre bygges.**

1. **Tilfeldige observasjoner:** lag et datasett like stort som originalen ved å trekke rader med tilbakelegging. Noen rader blir med flere ganger, andre ikke.
2. **Tilfeldige features i hver node:** treet får data med alle features, men ved hver beslutningsnode får det bare velge blant et tilfeldig utvalg av dem. Ved neste splitt trekkes et nytt utvalg.

Det $n$-te treet bygges på nøyaktig samme måte, men på grunn av den tilfeldige trekningen blir trærne ganske forskjellige.

**Prediksjon.** Kjør testdata gjennom hvert tre og aggreger: snitt for regresjon, majoritet for klassifisering.

**Hvorfor to kilder til tilfeldighet?** Trærne må være ulike og uavhengige. Strengt tatt er det *feilene* de gjør, som må være uavhengige. Bagging alene gir ofte ganske like trær: finnes det én svært sterk feature, splitter nesten alle trærne på den først. Ved å begrense hvilke features hver node kan velge, tvinges trærne til å bruke ulike features og modellere ulike sammenhenger. Hensikten med begge idéene er å *redusere korrelasjonen mellom trærne*, slik at ensemblet blir mer robust.

**Eksempel (F5).** På samme data fikk ett beslutningstre 0,78 i accuracy, random forest 0,83. Beslutningsflaten til skogen er mer finmasket og mindre preget av enkeltsplitter.

### Formler

Random forest-prediksjonen er bagging-prediksjonen med trær $h_t$, der hvert tre er trent på et bootstrap-utvalg med tilfeldige features per node:

$$
\hat{y}_{\text{reg}} = \frac{1}{T}\sum_{t=1}^{T} h_t(\mathbf{x}), \qquad \hat{y}_{\text{klass}} = \text{flertallet av } \{h_1(\mathbf{x}), \dots, h_T(\mathbf{x})\}
$$

### Sammenhenger

- Enkeltrær har lav bias og høy varians (kapittel 3). Random forest beholder den lave biasen og reduserer variansen.
- Feature-subsampling er det som skiller random forest fra ren bagging av trær.

### Vanlige misforståelser

- «Hvert tre i random forest ser bare noen av featurene.» Treet ser alle, men hver *node* får bare velge blant et tilfeldig utvalg.
- «Tilfeldigheten skal sikre at hvert tre bruker alle features like ofte.» Den skal gjøre trærne mindre korrelerte.
- «Alle trærne vokser til samme dybde, så de er like.» Tilfeldigheten gjør dem ulike uansett dybde.

### Eksamensoppsummering

- Kunne de to tilfeldighetskildene: bootstrap-utvalg av rader og tilfeldig utvalg av features per node.
- Forklare at målet er mindre korrelerte trær og dermed lavere varians.
- Vite at random forest er en sterk standardmodell for tabulære data.

---

## 4.4 Boosting og AdaBoost {#adaboost}

*Kilder: notater 1.5.2, F5, eksamen 2025 3.3, øving 2 Problem 2.*

### Introduksjon

Boosting kombinerer svake modeller sekvensielt til en sterk modell. Hver ny modell konsentrerer seg om det de forrige gjorde feil. AdaBoost gjør dette ved å vekte om datapunktene. Etter denne delen skal du kunne forklare idéen bak boosting, hvordan vektene i AdaBoost endres, og hvordan modellene kombineres.

### Begreper

- **Svak modell (weak learner):** en modell som bare er svakt korrelert med target, litt bedre enn tilfeldig. Typisk en trestump.
- **Sterk modell:** en modell som kan bli vilkårlig sterkt korrelert med target.
- **Boosting:** algoritmer som iterativt trener svake modeller og kombinerer dem til en sterk. Feilene til de forrige modellene gjør den neste bedre, den «booster» den. Idéen stammer fra Kearns og Valiant (1988, 1989) og Schapire (1990).
- **AdaBoost (adaptive boosting):** boosting ved å vekte om datapunktene etter hver runde.
- **Modellvekt $\alpha_t$:** hvor mye modell $t$ teller i den endelige avstemningen. Bestemmes av hvor god modellen er på sitt eget (vektede) datasett.

### Forklaring

**Trening.**

1. Start med samme vekt på alle datapunktene. Tren modell 1.
2. Gi hvert datapunkt en ny vekt ut fra feilen til modell 1. Punkter med stort tap (feilklassifiserte) får høyere vekt, riktig klassifiserte får lavere.
3. Tren modell 2 på det vektede datasettet. Læringsalgoritmen må altså kunne håndtere vektede data.
4. Vekt om igjen ut fra hva modell 2 gjør riktig og galt. Fortsett.

**Inferens.** Spør alle modellene. Svarene kombineres i en vektet avstemning, der vektene $\alpha_t$ gis av hvor gode modellene var på sitt eget vektede datasett. Gode modeller teller mer.

**Hvordan vektene utvikler seg (F5).** I et pingvineksempel følges vektene til tre punkter over 1000 iterasjoner. To punkter som stort sett klassifiseres riktig, får vekter som synker mot null. Ett punkt som fortsatt er feil til slutt, får en vekt som vokser jevnt. Algoritmen bruker stadig mer oppmerksomhet på de vanskelige punktene.

**Eksempel (F5).** På samme data som 4.3 fikk AdaBoost 0,81, mot 0,78 for ett tre.

**Kobling til øving 2.** Problem 2 bruker AdaBoost på vikingdataene for å nå 0,80 i test-accuracy. Med stumper som svake modeller blir hver modell enkel, men ensemblet kan modellere en sammensatt beslutningsflate.

### Formler

Den sterke modellen etter $T$ runder er en vektet sum av de svake modellene $h_t$:

$$
F_T(\mathbf{x}) = \sum_{t=1}^{T} f_t(\mathbf{x}) = \sum_{t=1}^{T}\alpha_t h_t(\mathbf{x})
$$

I runde $t$ velges $h_t$ og $\alpha_t$ for å minimere tapet til ensemblet så langt pluss den nye modellen:

$$
L_t = \sum_{i=1}^{N} L\bigl[F_{t-1}(\mathbf{x}_i) + \alpha_t h_t(\mathbf{x}_i)\bigr]
$$

Vekten til datapunkt $i$ i neste runde er tapet på punktet, normalisert slik at vektene summerer til 1:

$$
w_{i,t+1} = \frac{L[F_t(\mathbf{x}_i)]}{\sum_{j=1}^{N} L[F_t(\mathbf{x}_j)]}
$$

- $L[\cdot]$ er tapet for ett datapunkt.
- Punkter med stort tap får stor vekt i neste runde.
- Klassisk AdaBoost bruker eksponentielt tap. Den konkrete formelen for $\alpha_t$ står ikke i kursmaterialet. Det viktige er at bedre modeller får større $\alpha_t$.

### Sammenhenger

- Boosting reduserer bias: hver ny modell retter opp systematiske feil.
- AdaBoost endrer *vektene på dataene*. Gradient boosting endrer *targetene* (4.5).
- Notatene: AdaBoost tar hensyn til alle tidligere modeller gjennom vektene, mens gradient boosting ser på prediksjonsfeilen som er igjen etter forrige runde.
- Fordi modellene bygger på hverandre, kan boosting ikke trenes parallelt slik bagging kan.

### Vanlige misforståelser

- «AdaBoost øker vekten på punkter som ble klassifisert riktig.» Den øker vekten på punkter som ble klassifisert *feil*.
- «Vektene velges tilfeldig før hver iterasjon.» De bestemmes av feilene til forrige modell.
- «Alle modellene teller like mye.» De vektes med $\alpha_t$ etter ytelse.
- «Boosting trener modellene uavhengig.» Den trener dem sekvensielt.

### Eksamensoppsummering

- Forklare boosting: svake modeller trent sekvensielt, kombinert til en sterk.
- Kunne AdaBoost-stegene: like vekter først, økt vekt på feilklassifiserte punkter, vektet avstemning til slutt.
- Kjenne igjen formelen $F_T(\mathbf{x}) = \sum_t \alpha_t h_t(\mathbf{x})$ og at vektene er normalisert tap.

---

## 4.5 Gradient boosting {#gradient-boosting}

*Kilder: notater 1.5.2, F5, eksamen 2025 3.4, øving 4 XAI.*

### Introduksjon

Gradient boosting er en annen sekvensiell metode. I stedet for å vekte om datapunktene trener hver ny modell på *feilen* ensemblet fortsatt gjør. Navnet kommer fra at prosedyren er gradient descent, bare i rommet av mulige trær i stedet for i parameterrommet. Etter denne delen skal du forstå pseudo-residualer, oppdateringsregelen og koblingen til gradient descent.

### Begreper

- **Residual:** forskjellen mellom target og prediksjon, $y - \hat{y}$.
- **Pseudo-residual:** det hver ny modell trenes til å predikere. For MSE er det residualen, altså minus gradienten av tapet med hensyn på prediksjonen.
- **Læringsrate $\eta$ (shrinkage):** hvor stor del av hver nye modells prediksjon som legges til ensemblet.
- **Regresjonstre som svak modell:** F5 bruker trær med maksimal dybde 2.

### Forklaring

**Idéen.** Tenk deg at ensemblet predikerer 4 der svaret er 5. Neste modell skal ikke lære 5. Den skal lære feilen, 1. Legger vi til (en del av) den nye modellens prediksjon, kommer ensemblet nærmere.

**Prosedyren (F5, regresjon).** I hver iterasjon:

1. Tilpass et regresjonstre (maks dybde 2) til det nåværende målet.
2. Prediker med ensemblet ved å legge sammen bidragene fra alle trærne, skalert med $\eta$.
3. Oppdater målet for neste runde: «det vi hadde, minus $\eta$ ganger siste rundes prediksjon».

Det første målet er targetene selv. Deretter er målet alltid det som gjenstår å forklare.

**Regneeksempel.** Targets $y = (3, 5, 10)$ og $\eta = 0{,}5$. Hvert tre er en stump som skiller det tredje punktet fra de to første og predikerer snittet i hver gruppe.

| Runde | Mål (pseudo-residualer) | Treets prediksjon | Ensemblet etterpå |
|---|---|---|---|
| 1 | $(3, 5, 10)$ | $(4, 4, 10)$ | $0{,}5\cdot(4, 4, 10) = (2, 2, 5)$ |
| 2 | $(3, 5, 10) - (2, 2, 5) = (1, 3, 5)$ | $(2, 2, 5)$ | $(2, 2, 5) + 0{,}5\cdot(2, 2, 5) = (3, 3, 7{,}5)$ |
| 3 | $(0, 2, 2{,}5)$ | … | … |

Residualene krymper for hver runde. Den lille læringsraten gjør at hvert tre bare tar et lite steg, noe som gir et mer robust ensemble.

**Hvorfor «gradient»?** Med MSE-tap $\tfrac{1}{2}(y - F)^2$ er gradienten med hensyn på prediksjonen $F$ lik $F - y = -(y - F)$. Residualen er altså minus gradienten. Å legge til et tre som predikerer residualen, er å ta et steg mot gradienten, akkurat som i gradient descent. Forskjellen er at vi ikke beveger oss i rommet av parameterverdier, men i rommet av alle trær ensemblet kan bestå av.

**Kobling til øving 4.** XAI-øvingen bruker `GradientBoostingRegressor` (`max_depth = 5`) på boligprisdata og forklarer den med SHAP (kapittel 8). Modellen fanger ikke-lineære sammenhenger som en lineær modell ikke ser.

### Formler

Pseudo-residualene i runde $t$, for MSE:

$$
r_i^{(t)} = y_i - F_{t-1}(\mathbf{x}_i) = -\frac{\partial}{\partial F}\,\tfrac{1}{2}\bigl(y_i - F\bigr)^2\Big|_{F = F_{t-1}(\mathbf{x}_i)}
$$

Tren tre $h_t$ på $\{(\mathbf{x}_i, r_i^{(t)})\}$ og oppdater ensemblet:

$$
F_t(\mathbf{x}) = F_{t-1}(\mathbf{x}) + \eta\, h_t(\mathbf{x})
$$

Notatene skriver det samme med et tre som er trent på gradienten (prediksjon minus label), og da blir fortegnet minus:

$$
\texttt{new\_ensemble} = \texttt{previous\_ensemble} - \texttt{learning\_rate}\cdot\texttt{new\_tree}
$$

Sammenlign med gradient descent, $\theta_{t+1} = \theta_t - \eta\,\nabla\mathcal{L}$.

### Sammenhenger

- Samme oppdateringsform som gradient descent (kapittel 1.4). Læringsraten har samme rolle.
- Regresjonstrær (kapittel 3.6) er de svake modellene.
- XGBoost, LightGBM og CatBoost er effektive varianter av gradient boosting.

### Vanlige misforståelser

- «Gradient boosting vekter om datapunktene.» Det er AdaBoost. Gradient boosting endrer targetene.
- «Hvert nytt tre lærer de opprinnelige targetene.» Det lærer det som gjenstår, pseudo-residualene.
- «Pseudo-residualene brukes til majoritetsavstemning eller til å velge hyperparametre.» De er targetene for neste modell.
- «Gradient boosting gjør gradient descent på trærnes parametre.» Den gjør gradient descent i funksjonsrommet, ett tre om gangen.

### Eksamensoppsummering

- Forklare at hver ny modell tilpasses pseudo-residualene, altså feilen de forrige modellene ikke klarte å predikere.
- Kunne oppdateringsregelen og koblingen til gradient descent: residualen er minus gradienten av MSE.
- Kunne forskjellen på AdaBoost (vekting av data) og gradient boosting (endring av target).

---

## 4.6 Stacking og sammenligning {#stacking}

*Kilder: notater 1.5, F5, eksamen 2024.*

### Introduksjon

Så langt har vi kombinert modeller med enkle regler: snitt, majoritet eller vekter. Stacking går et steg videre og *lærer* hvordan modellene skal kombineres. Etter denne delen skal du kunne forklare stacking og sammenligne de fire ensemblemetodene.

### Begreper

- **Stacking:** hierarkisk ensemble der en metamodell trenes til å kombinere prediksjonene fra flere basismodeller.
- **Basismodeller:** modellene på nederste nivå, trent uavhengig av hverandre.
- **Metamodell (toppmodell, «overdommer»):** modellen som tar basismodellenes prediksjoner som input.

### Forklaring

**Idéen (F5).**

1. Tren en gruppe basismodeller uavhengig av hverandre, hver på en del av dataene (for eksempel 80 %, men det er ikke et fast tall).
2. Bruk de resterende dataene til å trene metamodellen. Hver basismodells prediksjon er en *feature*, og target er fasiten.
3. Metamodellen lærer sammenhenger som «hvis modell 2, 3 og 4 er enige, kan vi stole på dem».

Det er et maskinlæringsproblem i seg selv. Metamodellen må trenes på data basismodellene ikke er trent på. Ellers lærer den å stole på prediksjoner som er for gode, fordi basismodellene har sett svaret.

**Sammenligning (F5, samme datasett):**

| Metode | Strategi | Accuracy |
|---|---|---|
| Beslutningstre | Én modell | 0,78 |
| AdaBoost | Sekvensiell | 0,81 |
| Random forest | Parallell | 0,83 |
| Stacking | Hierarkisk | 0,84 |

Alle ensemblene slår enkelttreet. Tallene gjelder dette ene eksempelet og er ikke en generell rangering.

**Oppsummering av strategiene (F5).**

| Strategi | Hva skjer | Eksempel | Reduserer mest |
|---|---|---|---|
| Parallell | Hver basismodell gjetter, så aggregeres svarene | Bagging, random forest | Varians |
| Sekvensiell | Hver modell sender informasjon videre, for eksempel om vanskelige punkter | AdaBoost, gradient boosting | Bias |
| Hierarkisk | Hver modell sender sin tro til en overdommer som er trent til å aggregere | Stacking | Avhenger av modellene |

### Formler

Stacking med basismodeller $f_1, \dots, f_T$ og metamodell $g$:

$$
\hat{y} = g\bigl(f_1(\mathbf{x}),\, f_2(\mathbf{x}),\, \dots,\, f_T(\mathbf{x})\bigr)
$$

### Sammenhenger

- Stacking er en generalisering av vektet gjennomsnitt: i stedet for at vi bestemmer vektene, lærer metamodellen dem, og den kan lære mer kompliserte regler enn vekter.
- Splitten mellom data til basismodellene og data til metamodellen følger samme logikk som splitten mellom trening og validering (kapittel 3.3).

### Vanlige misforståelser

- «Stacking er det samme som bagging.» I bagging er aggregeringen en fast regel. I stacking er den en lært modell.
- «Metamodellen kan trenes på de samme dataene som basismodellene.» Da lærer den å stole for mye på dem.

### Eksamensoppsummering

- Forklare stacking: basismodeller, metamodell, og at basismodellenes prediksjoner er features.
- Kunne sammenligne parallelle, sekvensielle og hierarkiske ensembler.
- Hovedbudskapet fra F5: mange enkle modeller som samarbeider, er ofte bedre enn å jobbe masse med én kjempegod modell.
