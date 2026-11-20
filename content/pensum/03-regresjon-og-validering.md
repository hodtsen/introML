---
kapittel: 3
tittel: Regresjon, validering og bias–varians
kilder: Forelesningsnotater 1.4, F4 (Regresjon, feature engineering, validering, bias-variance tradeoff, regresjonstrær), eksamen 2024 og 2025, øving 1 og 3
---

# Kapittel 3 – Regresjon, validering og bias–varians

Dette kapittelet går fra klassifisering til regresjon, altså prediksjon av kontinuerlige verdier. Underveis kommer noen av de viktigste idéene i hele faget: hvorfor vi trenger valideringsdata, hvordan vi oppdager over- og undertilpasning, og hvorfor feilen til enhver læringsalgoritme kan deles i bias, varians og støy.

> **F4 om rollene til dataene:** «Husk dette. 1) Det er pinlig å ikke ha kontroll på dette. 2) Det kommer på eksamen.»

---

## 3.1 Lineær regresjon og MSE {#lineaer-regresjon}

*Kilder: notater 1.4.1, F4, eksamen 2024 oppg. 1–2 og 2025 4.1, øving 1.*

### Introduksjon

Regresjon er veiledet læring der target er en kontinuerlig verdi, for eksempel prisen på en bolig, skåren til en film eller sykefraværet til en ansatt. Den enkleste modellen er lineær regresjon. Den trenes med gradient descent akkurat som logistisk regresjon, men med en annen tapsfunksjon. Etter denne delen skal du kunne skrive modellen og MSE, utlede gradientene og regne et oppdateringssteg.

### Begreper

- **Regresjon:** prediksjon av en eller flere kontinuerlige verdier.
- **Klassifisering vs regresjon:** i klassifisering er targets kvalitative (kategorier). I regresjon er de kvantitative.
- **Lineær regresjonsmodell:** en vektet sum av features pluss et konstantledd.
- **Bias $\beta_0$ (konstantleddet):** funksjonsverdien når alle $x_i = 0$, der linjen krysser $y$-aksen. Det flytter alle prediksjoner med en konstant, som en baseline før featurene tas med.
- **Stigningstall $\beta_1$:** hvor mye prediksjonen endres per enhet økning i $x_1$.
- **MSE (mean squared error):** gjennomsnittlig kvadrert avvik mellom target og prediksjon. Den vanligste tapsfunksjonen for regresjon.

### Forklaring

**Hva kan vi gjenbruke fra klassifisering?** Nesten alt: gradient descent, læringsrate, epoker og treningsløkken. Det vi *ikke* kan gjenbruke, er tapsfunksjonen. I klassifisering tolket vi prediksjonen som en sannsynlighet for klasse, og cross-entropy bygger på det. En regresjonsmodell predikerer verdier, ikke sannsynligheter.

**MSE.** Kvadrerer vi avviket, blir alle feil positive, og store feil straffes mye mer enn små. MSE er liten når prediksjonene er nær targets. Faktoren $\tfrac{1}{2}$ er bare for bekvemmelighet: den kansellerer toeren fra derivasjonen. Noen definisjoner har den ikke, og da blir gradientene dobbelt så store.

**Hvorfor MSE?** Antar vi at støyen i dataene er normalfordelt (gaussisk), er det å minimere MSE det samme som å maksimere likelihood. Det er samme logikk som gir cross-entropy for logistisk regresjon (kapittel 1.3).

**Sjekk at gradienten gir mening (F4).** Overestimerer modellen konsekvent for alle $x$, er $f(x) > y$ for alle punkter. Da er $\beta_0$ for høy, og $\partial\mathcal{L}/\partial\beta_0 = \frac{1}{N}\sum(f - y) > 0$. Det gir mening: tapet øker når $\beta_0$ øker, så oppdateringen senker $\beta_0$.

**Regneeksempel (ett steg).** Modellen $f(x) = \beta_0 + \beta_1 x$ starter i $\beta_0 = 0$ og $\beta_1 = 1$. Ett datapunkt $x = 3$, $y = 5$, læringsrate $\eta = 0{,}1$ og tap $\tfrac{1}{2}(y - f)^2$:

$$
f(3) = 3, \qquad \frac{\partial\mathcal{L}}{\partial\beta_0} = f - y = -2, \qquad \frac{\partial\mathcal{L}}{\partial\beta_1} = x(f - y) = -6
$$

$$
\beta_0 \leftarrow 0 - 0{,}1\cdot(-2) = 0{,}2, \qquad \beta_1 \leftarrow 1 - 0{,}1\cdot(-6) = 1{,}6
$$

Modellen underestimerte, så begge parametrene øker. Uten faktoren $\tfrac{1}{2}$ blir gradientene $-4$ og $-12$.

**Antakelsen.** Lineær regresjon antar at targets avhenger lineært av featurene, og at hver feature bidrar uavhengig av de andre (ingen vekselvirkninger). Er dataene ikke lineære, fungerer modellen dårlig, uansett hvor lenge vi trener.

**Om eksakt løsning.** Lineær regresjon kan løses eksakt med minste kvadraters metode (ordinary least squares), og `sklearn.linear_model.LinearRegression` gjør det. Det hører hjemme i statistikkurset og er ikke pensum. Vi bruker gradient descent fordi vi vil følge tapet underveis (3.3) og fordi samme metode brukes for nevrale nett.

### Formler

Modellen med $n$ features og $n + 1$ parametre:

$$
f(\mathbf{x}) = \beta_0 + \beta_1 x_1 + \beta_2 x_2 + \dots + \beta_n x_n
$$

MSE over $N$ datapunkter:

$$
\text{MSE} = \frac{1}{2N}\sum_{i=1}^{N}\left(y^{(i)} - f(\mathbf{x}^{(i)})\right)^2
$$

Gradientene for én feature, $f(x) = \beta_0 + \beta_1 x$:

$$
\frac{\partial\mathcal{L}}{\partial\beta_0} = \frac{1}{N}\sum_{i=1}^{N}\left(\beta_1 x^{(i)} + \beta_0 - y^{(i)}\right), \qquad
\frac{\partial\mathcal{L}}{\partial\beta_1} = \frac{1}{N}\sum_{i=1}^{N} x^{(i)}\left(\beta_1 x^{(i)} + \beta_0 - y^{(i)}\right)
$$

Oppdateringsreglene:

$$
\beta_0 \leftarrow \beta_0 - \eta\,\frac{1}{N}\sum_{i=1}^{N}\left(f(x^{(i)}) - y^{(i)}\right), \qquad
\beta_1 \leftarrow \beta_1 - \eta\,\frac{1}{N}\sum_{i=1}^{N} x^{(i)}\left(f(x^{(i)}) - y^{(i)}\right)
$$

Sammenlign med logistisk regresjon: gradienten har samme form, feil ganget med input. Forskjellen er at $f$ her er lineær, ikke sigmoid.

### Sammenhenger

- Lineær og logistisk regresjon har samme lineære kjerne. Logistisk regresjon legger på sigmoid og bruker cross-entropy.
- Begge tapene er maximum likelihood under hver sin antakelse: gaussisk støy (MSE) og Bernoulli-fordelte labels (cross-entropy).
- At koeffisientene sier hvor viktig hver feature er, gjelder bare når featurene har sammenlignbar skala. Ellers kan en liten koeffisient på en feature med store verdier bety mye. Øving 4 XAI spør nettopp hvorfor koeffisientene og SHAP er uenige (kapittel 8).

### Vanlige misforståelser

- «Bias $\beta_0$ er det samme som bias i bias–varians.» Navnet er det samme, men begrepene har ingenting med hverandre å gjøre (3.5).
- «Vi kan bruke cross-entropy for regresjon.» Cross-entropy forutsetter sannsynligheter for klasser.
- «MSE har en absolutt skala der for eksempel 100 er høyt.» MSE har samme enhet som $y^2$. Om den er høy, må vurderes mot størrelsen på targets. Notatene får MSE rundt 960 med targets rundt 30, og siden $30^2 = 900$ er det et stort tap.
- «MSE gjør modellen robust mot outliers.» Kvadratet gjør at outliers får *stor* innflytelse.

### Eksamensoppsummering

- Kunne modellen, MSE og gradientene, og regne ett gradient descent-steg.
- Vite hva faktoren $\tfrac{1}{2}$ gjør, og hvordan fortegnet på gradienten henger sammen med over- og underestimering.
- Vite at minimering av MSE tilsvarer maximum likelihood under gaussisk støy.
- Kunne antakelsen til lineær regresjon: lineær sammenheng og ingen vekselvirkninger.

---

## 3.2 Polynomisk regresjon og feature engineering {#feature-engineering}

*Kilder: notater 1.4.2, F4, øving 1 og 3.*

### Introduksjon

Hva gjør vi når dataene ikke er lineære? Én løsning er å lage nye features, for eksempel $x^2$, og så gjøre lineær regresjon i det nye feature-rommet. Etter denne delen skal du forstå feature engineering, polynomisk regresjon og hvorfor polynomgraden er en hyperparameter.

### Begreper

- **Feature engineering:** alt som skjer fra du åpner de innsamlede dataene til du har datasettet du vil bruke til maskinlæring.
- **Feature selection:** å velge ut features, som da `Name` ble fjernet fra Titanic-dataene.
- **Feature preprocessing:** å behandle features, som da `Age` ble skalert til $[0, 1]$.
- **Feature extraction:** å lage nye features, som $x^2$ fra $x$, eller å kombinere flere features.
- **Polynomisk regresjon:** lineær regresjon på polynomiske features av grad $M$.
- **Modellkompleksitet:** hvor fleksibel modellen er, her styrt av polynomgraden.

### Forklaring

**Eksempelet.** Data generert fra en parabel med gaussisk støy. En rett linje passer dårlig, og MSE blir høy, fordi lineær regresjon antar en lineær sammenheng. Ved å plotte dataene ser vi formen, og en passende transformasjon er $x \to x^2$. Da har vi to features, $\{x_1, x_2\} = \{x, x^2\}$, og vi gjør lineær regresjon med tre parametre. F4 genererte dataene fra $x^2 + 2x + 0$ pluss støy og fant omtrent $\beta_2 = 1$, $\beta_1 = 2$ og $\beta_0 = 0$ igjen.

**Fortsatt lineær regresjon.** Modellen er lineær i *parametrene*, selv om den er kurvet i $x$. Det er derfor vi kan bruke samme kode og samme gradient descent.

**I sklearn.** `PolynomialFeatures` lager features opp til en valgt grad. Som med skalering tilpasses (`fit`) transformasjonen på treningsdataene og brukes (`transform`) på testdataene. Analysen skal være uavhengig av testdataene.

**Hvilken grad?** F4 og notatene viser data fra et polynom av ukjent grad, tilpasset med grad 1, 3 og 15:

| Grad | Typisk resultat | Tolkning |
|---|---|---|
| 1 (lineær) | Høy MSE på både trening og validering | For enkel, klarer ikke å matche variasjonen i dataene. Undertilpasning. |
| 3 | Lavest MSE | Passende kompleksitet |
| 15 | Svært lav treningsfeil, høy valideringsfeil | Kapasitet til å memorere treningsdataene. Overtilpasning. |

Høyere kompleksitet gir altså ikke nødvendigvis lavere feil på nye data. Både for lav og for høy kompleksitet er et problem.

**Kobling til prosjektene.** I øving 1 er featuren $x_0 \cdot x_1$ det som gjør XOR-dataene lineært separerbare for logistisk regresjon. Det er feature extraction. I øving 3 er målfunksjonen $x^3 - 3xy^2$, som et nevralt nett må lære uten at vi lager polynomfeatures for hånd. Til øvingene kan dere feature-engineere så mye dere vil, så lenge dere forstår og kan forklare hva dere har gjort og hvorfor.

### Formler

Polynom av grad $M$ i én variabel:

$$
f(x) = \beta_0 + \beta_1 x + \beta_2 x^2 + \dots + \beta_M x^M
$$

Med den genererte featuren $x_2 = x^2$:

$$
y = \beta_0 + \beta_1 x_1 + \beta_2 x_2
$$

### Sammenhenger

- Polynomgraden definerer modellen, men tilpasses ikke under trening. Den er derfor en **hyperparameter**, ikke en modellparameter og ikke en feature (F4-quiz).
- Hyperparametre velges med valideringsdata (3.3).
- Feature engineering kan brukes i alle typer maskinlæring, ikke bare i veiledet læring og ikke bare i regresjon.
- Nevrale nettverk lærer i praksis sine egne features, slik at vi slipper å gjette transformasjonen (kapittel 5).

### Vanlige misforståelser

- «Polynomisk regresjon er ikke lineær regresjon.» Den er lineær regresjon i nye features.
- «Høyere grad er alltid bedre fordi treningsfeilen synker.» Treningsfeilen synker, men valideringsfeilen kan øke.
- «Polynomgraden er en modellparameter.» Den er en hyperparameter.
- «Vi kan lage polynomfeatures på hele datasettet før splitt.» `fit` skal bare skje på treningsdataene.

### Eksamensoppsummering

- Kunne de tre delene av feature engineering: selection, preprocessing og extraction, med eksempler.
- Forklare hvorfor en transformasjon som $x \to x^2$ lar lineær regresjon modellere en parabel.
- Vite at polynomgraden er en hyperparameter, og at for lav grad gir undertilpasning og for høy grad overtilpasning.

---

## 3.3 Trening, validering og test {#validering}

*Kilder: notater 1.4.3, F4, eksamen 2024 og 2025 (del 1 og 4), øving 3.*

### Introduksjon

For å velge hyperparametre (polynomgrad, læringsrate, tredybde) trenger vi data modellen ikke er trent på. Testdataene kan ikke brukes til det, for da har vi ikke lenger usette data å rapportere ytelsen på. Løsningen er et tredje datasett: valideringsdata. Etter denne delen skal du kunne rollen til hvert datasett, lese trenings- og valideringskurver og forklare early stopping.

### Begreper

- **Overtilpasning (overfit):** modellen tilpasser seg treningsdataene så godt at det går utover generaliseringsevnen på nye data.
- **Undertilpasning (underfit):** modellen er for enkel til å fange sammenhengene i dataene.
- **Treningsdata:** brukes til å tilpasse modellparametrene.
- **Valideringsdata:** brukes til å følge med på modellen under trening og til å velge hyperparametre.
- **Testdata:** brukes ikke til noen form for tilpasning, verken av parametre, hyperparametre eller treningsprosedyren. Brukes bare til å rapportere ytelsen til den endelige modellen.
- **Early stopping:** å stoppe treningen når noe bestemt inntreffer, for eksempel når valideringstapet ikke har sunket innenfor en toleranse de siste $n$ epokene.

### Forklaring

**Hvorfor tre sett?**

- Treningsdataene kan ikke avsløre overtilpasning, for treningen har som mål å tilpasse seg nettopp dem.
- Testdataene kan ikke brukes til å justere noe, for da er de ikke lenger usette.
- Vi trenger derfor et eget «testsett» for treningsfasen: valideringssettet.

| Datasett | Brukes til |
|---|---|
| Trening | Justere parametre |
| Validering | Velge hyperparametre |
| Test | Måle ytelsen til slutt |

**Splitt i to steg (F4).** 20 % til test, så 25 % av resten til validering, som gir 60 / 20 / 20:

```python
X_train_val, X_test, y_train_val, y_test = train_test_split(X, y, test_size=0.2)
X_train, X_val, y_train, y_val = train_test_split(X_train_val, y_train_val, test_size=0.25)
```

**Overvåk treningen.** Med en iterativ metode kan vi regne ut tapet på både trenings- og valideringsdataene underveis. I sklearn kjører `SGDRegressor.fit()` mange epoker, mens `.partial_fit()` kjører én:

```python
for epoch in range(n_epochs):
    model.partial_fit(X_train, y_train)
    train_losses.append(mean_squared_error(y_train, model.predict(X_train)))
    val_losses.append(mean_squared_error(y_val, model.predict(X_val)))
```

**Les kurvene.**

| Mønster | Diagnose |
|---|---|
| Treningstapet synker jevnt, valideringstapet er mye høyere og flater ut eller øker | Overtilpasning. Modellen memorerer og generaliserer ikke. |
| Begge flater ut på et høyt nivå, ofte raskt | Undertilpasning. Modellen mangler kapasitet eller riktig form. Det tydeligste tegnet er høyt *treningstap*. |
| Begge synker jevnt og flater ut på samme nivå | God tilpasning. Modellen lærer og generaliserer. |

I F4 ga grad 15 lavt treningstap og høyt, hoppende valideringstap (overtilpasning), grad 1 høyt tap på begge (undertilpasning), og grad 3 jevnt synkende tap på begge.

**Når skal vi stoppe?** Kurvene viser også når det ikke er mer å hente. Flater begge ut etter 200 av 500 epoker, har det ingen hensikt å fortsette. Med early stopping trenger vi ikke bestemme antall epoker på forhånd. Kurvene kan også brukes til å justere hyperparametre underveis, for eksempel å senke læringsraten.

**Kobling til øving 3.** Øving 3 ber deg plotte trenings- og valideringstap per epoke og vurdere om sluttverdiene er et godt mål på modellen. Regresjonsdataene har ikke $y$ for testpunktene, så valideringssettet må lages fra treningsdataene. RMSE-kravet måles mot den sanne, støyfrie funksjonen, ikke mot de støyete targetene. En modell som har lært støyen, straffes derfor.

### Formler

Andelene med to splitter, først $t_1$ til test og deretter $t_2$ av resten til validering:

$$
\text{trening} = (1 - t_1)(1 - t_2), \qquad \text{validering} = (1 - t_1)\,t_2, \qquad \text{test} = t_1
$$

Med $t_1 = 0{,}2$ og $t_2 = 0{,}25$ blir det 60 %, 20 % og 20 %.

### Sammenhenger

- Overtilpasning svarer til høy varians og undertilpasning til høy bias (3.5).
- Valideringsdata brukes til å velge alle hyperparametre i kurset: polynomgrad, læringsrate, tredybde, antall epoker, batch size, nettverksarkitektur, $k$ i k-means.
- Early stopping i Keras overvåker vanligvis `val_loss` (kapittel 5).
- Datalekkasje er beslektet: alt som bruker testdata før den endelige evalueringen, gjør testresultatet for optimistisk.

### Vanlige misforståelser

- «Vi kan velge hyperparametre på testdata, så lenge vi ikke trener på dem.» Da er testsettet brukt, og testresultatet er ikke lenger et ærlig estimat.
- «Lavt treningstap betyr god modell.» Det kan bety overtilpasning.
- «Undertilpasning oppdages på valideringstapet.» Det tydeligste tegnet er høyt treningstap.
- «Kryssvalidering bruker bare treningsdata.» Den roterer hvilke deler som brukes til trening og evaluering (3.4).

### Eksamensoppsummering

- Kunne rollen til trening, validering og test uten å nøle.
- Kunne lese trenings- og valideringskurver og diagnostisere over- og undertilpasning.
- Forklare early stopping.
- Vite at testdata aldri brukes til justering av noe.

---

## 3.4 Kryssvalidering {#kryssvalidering}

*Kilder: notater 1.4.4, F4, eksamen 2024 og 2025, øving 2.*

### Introduksjon

Én tilfeldig splitt kan gi et testresultat som avhenger mye av hvilke punkter som havnet hvor. Dessuten mister vi treningsdata når vi setter av data til validering og test. Kryssvalidering løser begge problemene ved å rotere hvilke data som brukes til evaluering. Etter denne delen skal du kunne beskrive LOOCV og k-fold og sammenligne dem.

### Begreper

- **Kryssvalidering:** å trene og evaluere flere ganger med ulike splitter og ta snittet av resultatene.
- **LOOCV (leave-one-out cross-validation):** med $n$ datapunkter trenes modellen $n$ ganger på $n - 1$ punkter og evalueres på det ene som ble holdt ute.
- **k-fold cross-validation:** datasettet deles i $k$ deler. Hver del er evalueringssett én gang mens resten brukes til trening, så modellen trenes $k$ ganger.
- **CV-estimat:** gjennomsnittet av de $n$ eller $k$ resultatene.

### Forklaring

**Problemet.** Splitten er tilfeldig, så vi gjør ikke noe valg om hvilke punkter som havner hvor. Men splitten kan påvirke testresultatet, så resultatet kan ha høy varians. Samtidig vil vi alltid ha så mye treningsdata som mulig.

**LOOCV.** Siden estimatet til sammen bruker alle datapunktene, er det notatenes beste estimat. Ulempen er at modellen må trenes like mange ganger som det er datapunkter, noe som er svært ressurskrevende.

**k-fold.** Den desidert mest brukte metoden. Typiske valg er $k = 5$ eller $k = 10$, så modellen trenes 5–10 ganger.

| | LOOCV | k-fold |
|---|---|---|
| Antall treninger | $n$ | $k$ (typisk 5 eller 10) |
| Beregningskostnad | Svært høy | Mye lavere |
| Avhengighet av splitten | Ingen (alle splitter brukes) | Mer enn LOOCV, men mindre enn én splitt |
| Bias i estimatet (F4) | Lavere | Høyere |

Lærebøker legger ofte til at LOOCV til gjengjeld kan ha høyere *varians* i estimatet, fordi de $n$ modellene er trent på nesten identiske data. Det står ikke i kursmaterialet, så hold deg til F4s påstand om bias på eksamen.

**Begge splittene kan kryssvalideres.** Kryssvalidering kan brukes både til å velge hyperparametre (validering) og til å estimere testytelsen. Husk likevel hva hver splitt brukes til: trening justerer parametre, validering velger hyperparametre, test måler ytelse.

**Kobling til øving 2.** Problem 2 bruker kryssvalidering for beslutningstreet og spør hva formålet er: å få et mer pålitelig estimat av ytelsen, og å velge hyperparametre som splitt-kriterium og dybde, uten å bruke testdataene.

### Formler

CV-estimatet av en metrikk $M$ med $k$ folder:

$$
\text{CV}_{(k)} = \frac{1}{k}\sum_{j=1}^{k} M_j
$$

- $M_j$ er resultatet når fold $j$ er evalueringssett.
- LOOCV er spesialtilfellet $k = n$.

### Sammenhenger

- Kryssvalidering roterer *datasplitten*, mens bagging trekker *bootstrap-utvalg* for å bygge mange modeller (kapittel 4). Den første estimerer ytelse, den andre forbedrer modellen.
- Variansen i testresultatet mellom splitter er et uttrykk for samme fenomen som variansen i bias–varians: resultatet avhenger av det tilfeldige utvalget.

### Vanlige misforståelser

- «LOOCV er alltid å foretrekke fordi estimatet er best.» Kostnaden er ofte for høy.
- «Kryssvalidering gir én ferdig modell.» Den gir et estimat av ytelsen. Den endelige modellen trenes etterpå med valgte hyperparametre.
- «Kryssvalidering erstatter et urørt testsett.» Kursets praksis er fortsatt å rapportere på data som ikke er brukt til noe valg.

### Eksamensoppsummering

- Kunne beskrive LOOCV og k-fold, og hvor mange ganger modellen trenes.
- Fordeler og ulemper: k-fold er langt billigere, LOOCV er mindre avhengig av splitten og har lavere bias.
- Forklare hvorfor vi kryssvaliderer: varians fra splitten og ønsket om mest mulig treningsdata.

---

## 3.5 Bias–varians-dekomposisjonen {#bias-varians}

*Kilder: notater 1.4.5, F4, eksamen 2024 og 2025 4.2.*

### Introduksjon

Hvorfor er både for enkle og for komplekse modeller dårlige? Bias–varians-dekomposisjonen gir svaret: den forventede feilen på et nytt datapunkt består av tre ledd, bias², varians og irredusibel støy. Etter denne delen skal du kunne definere hvert ledd, koble dem til over- og undertilpasning, og forstå (og helst kunne følge) utledningen.

### Begreper

- **Estimator:** læringsalgoritmen vår. For logistisk og lineær regresjon og nevrale nett er det gradient descent. Den har bias og varians.
- **Sann funksjon $F$:** den ukjente sammenhengen som genererer targets. Ingen unntatt universet kjenner den.
- **Irredusibel støy $\varepsilon$:** støy utenfor vår kontroll (måleapparat, ytre faktorer). Antas normalfordelt med forventning 0.
- **Treningsdatasett $D$:** én tilfeldig trekning av $n$ observasjoner. Andre data gir en annen modell, så vi skriver $f(\mathbf{x}; D)$.
- **Bias (for en læringsalgoritme):** det forventede avviket mellom modellen og den sanne verdien, over mange trekninger av treningsdata. Feilen som følger av de innebygde forenklingene i modellen. Har ingenting med $\beta_0$ å gjøre.
- **Varians:** hvor mye modellen varierer rundt sitt eget gjennomsnitt fra trekning til trekning. Hvor sensitiv modellen er for små variasjoner i treningsdataene.
- **Bias–varians-tradeoff:** når den ene minker, øker typisk den andre.

### Forklaring

**Oppsettet.** Vi bryr oss ikke bare om tapet på det ene treningssettet vi har, men om tapet på nye punkter, i forventning over mange tenkte trekninger av treningsdata. Den forventede feilen kan, for *enhver* $f$, deles i tre.

**Bias, intuitivt.** En tendens til alltid å bomme i samme retning. Notateksempelet: den sanne snitthøyden til norske kvinner er 167 cm. Mange modeller, trent på ulike tilfeldige utvalg, predikerer i snitt 165 cm. Biasen er $165 - 167 = -2$ cm.

**Varians, intuitivt.** Hvor ulike modellene blir når vi trener på nye utvalg. Komplekse modeller med mange parametre får ulike parameterverdier for hvert treningssett og kan modellere støy like mye som faktiske sammenhenger.

**Eksemplene i F4.** Data fra $x^2$ med mye støy:

- 20 lineære modeller blir nesten like (lav varians), men alle bommer systematisk på parabelen (høy bias). F4 fant $\text{MSE} = 13{,}6 \approx \text{bias}^2\ 13{,}5 + \text{varians}\ 0{,}1$.
- Nevrale nett med hundrevis av frie parametre tilpasser seg hvert treningssett, inkludert støyen (høy varians), men treffer i snitt (lav bias). F4 fant $\text{MSE} = 3{,}5 \approx \text{bias}^2\ 0{,}1 + \text{varians}\ 3{,}4$.

**Kobling til over- og undertilpasning.**

| | Bias | Varians | Typisk eksempel |
|---|---|---|---|
| Undertilpasning | Høy | Lav | Lineær regresjon på ikke-lineære data |
| Overtilpasning | Lav | Høy | Nevrale nett, dype trær, høy polynomgrad |

Høy varians tyder på at algoritmen er for sensitiv for variasjoner i dataene (overtilpasning). Lav varians kan bety at modellene predikerer for nær gjennomsnittet og ikke utnytter informasjonen i featurene (undertilpasning). Høy bias overskygger subtile, men relevante sammenhenger. Høy varians betyr at modellen har overmodellert sammenhengene i stedet for å generalisere.

**Utledningen (frivillig i F4, full i notatene).** Vi skriver $y = F + \varepsilon$, lar $\bar{f} = \mathbb{E}_D[f(\mathbf{x}; D)]$, og bruker at $\mathbb{E}[\varepsilon] = 0$ og at $\varepsilon$ er uavhengig av $D$:

1. $\mathbb{E}[(y - f)^2] = \mathbb{E}[(F - f)^2] + 2\,\mathbb{E}[(F - f)\varepsilon] + \mathbb{E}[\varepsilon^2]$. Kryssleddet er 0, og $\mathbb{E}[\varepsilon^2] = \sigma^2$.
2. Legg til og trekk fra $\bar{f}$: $\mathbb{E}[(F - \bar{f} + \bar{f} - f)^2]$.
3. Første kvadrat: $(F - \bar{f})^2 = \text{Bias}^2$, fordi både $F$ og $\bar{f}$ er konstanter for gitt $\mathbf{x}$.
4. Andre kvadrat: $\mathbb{E}[(\bar{f} - f)^2] = \text{Var}$.
5. Kryssleddet $2\,\mathbb{E}[(F - \bar{f})(\bar{f} - f)] = 2(F - \bar{f})(\bar{f} - \bar{f}) = 0$.

**Hvorfor kan $F(\mathbf{x})$ flyttes ut av forventningen?** Fordi den sanne sammenhengen ikke avhenger av hvilket datasett $D$ vi trekker. For gitt $\mathbf{x}$ er $F(\mathbf{x})$ en konstant.

### Formler

$$
y = F(\mathbf{x}) + \varepsilon, \qquad \mathbb{E}[\varepsilon] = 0, \quad \text{Var}[\varepsilon] = \sigma^2
$$

$$
\mathbb{E}_D\!\left[\bigl(y - f(\mathbf{x}; D)\bigr)^2\right] = \bigl(\text{Bias}_D[f(\mathbf{x}; D)]\bigr)^2 + \text{Var}_D[f(\mathbf{x}; D)] + \sigma^2
$$

$$
\text{Bias}_D[f(\mathbf{x}; D)] = \mathbb{E}_D[f(\mathbf{x}; D) - F(\mathbf{x})] = \mathbb{E}_D[f(\mathbf{x}; D)] - F(\mathbf{x})
$$

$$
\text{Var}_D[f(\mathbf{x}; D)] = \mathbb{E}_D\!\left[\bigl(\mathbb{E}_D[f(\mathbf{x}; D)] - f(\mathbf{x}; D)\bigr)^2\right]
$$

Nyttige regler for utledningen, der $c$ er en konstant:

$$
\mathbb{E}[\varepsilon] = 0, \quad \mathbb{E}[c] = c, \quad \mathbb{E}[cX] = c\,\mathbb{E}[X], \quad \mathbb{E}[X + Y] = \mathbb{E}[X] + \mathbb{E}[Y], \quad \mathbb{E}[XY] = \mathbb{E}[X]\,\mathbb{E}[Y] \text{ for uavhengige } X, Y
$$

### Sammenhenger

- Ensemblemetoder angriper hvert sitt ledd: bagging og random forest reduserer varians, boosting reduserer bias (kapittel 4).
- Oversampling kan gi høy varians og undersampling høy bias (kapittel 2.4).
- Støyleddet $\sigma^2$ er et gulv. Ingen modell kan få lavere forventet feil.
- Dekomposisjonen er utledet for MSE, men idéen brukes om alle modeller.

### Vanlige misforståelser

- «Bias er konstantleddet $\beta_0$.» Det er to helt ulike begreper med samme navn.
- «Bias og varians måles på ett datasett.» Begge er definert over mange tenkte trekninger av treningsdata.
- «Varians er variansen i dataene.» Det er variansen i *modellens prediksjoner* mellom treningssett.
- «Vi kan få både bias og varians til null.» Det er en tradeoff, og støyen kan vi aldri fjerne.
- «Svært lav treningsfeil, økende valideringsfeil og prediksjoner som endrer seg med splitten betyr høy bias.» Det er høy varians, altså overtilpasning.

### Eksamensoppsummering

- Kunne dekomposisjonen og definisjonen av bias og varians.
- Koble høy bias til undertilpasning og høy varians til overtilpasning, og gi typiske eksempler (lineær regresjon og nevrale nett).
- Forklare hvorfor $F(\mathbf{x})$ kan flyttes ut av forventningen.
- Diagnostisere bias og varians ut fra en beskrivelse av trenings- og valideringsfeil.

---

## 3.6 Regresjonstrær {#regresjonstraer}

*Kilder: notater 1.4.6, F4, eksamen 2025 4.4.*

### Introduksjon

Noen data følger ikke et polynom, men faller i regioner, for eksempel trappetrinn. Beslutningstrær, som vi brukte til klassifisering, kan også brukes til regresjon ved å dele feature-rommet i regioner og predikere én verdi per region. Etter denne delen skal du forstå hvordan regresjonstrær virker, hvorfor de kan overtilpasse, og hvordan de skiller seg fra regresjonsmodeller.

### Begreper

- **Regresjonstre:** beslutningstre der løvnodene gir en kontinuerlig verdi.
- **Region:** del av feature-rommet som ender i samme løvnode. Prediksjonen er konstant i hver region.
- **Splittregel for regresjonstrær:** velg splitten som gir lavest varians (kvadratfeil) i targets etter splitt.

### Forklaring

**Eksempelet.** Data fra $\lfloor x \rfloor$ (trappetrinn) med litt støy. Et polynom av grad 4 eller 5 klarer ikke å tilpasse seg trinnene. Men ser vi på dataene, ligger de i regioner, og trær er nettopp gode til å dele data i regioner gjennom splitt-kriterier.

**Hvordan treet splitter.** Hver splitt deler rommet i to. Den øverste splitten gir to regioner, neste nivå fire, og så videre. Dybde $d$ gir høyst $2^d$ regioner. For å velge splitt måler treet hvor stor variansen i target-verdiene blir etter splitten, og velger splitten med *lavest* varians. Det er regresjonsvarianten av å minimere urenhet. Prediksjonen i en region er gjennomsnittet av treningstargetene der (slik sklearns `DecisionTreeRegressor` gjør det).

**Dybde og overtilpasning.** Trappen i eksempelet har fire trinn, så fire regioner og `max_depth = 2` er nok. Får sklearn velge selv, lager den likevel et svært dypt tre (notatene: dybde 12 og 85 noder, F4: 75 noder), fordi den fortsetter å splitte for å treffe støyen i hvert treningspunkt. Treet med dybde 2 gir lavest MSE på testdata. Overtilpasning skjer altså også for trær, særlig med støyete data.

**Trær vs regresjonsmodeller (notatene og F4).**

| Trær | Regresjonsmodeller |
|---|---|
| Skalering er ikke nødvendig, fordi treet deler dataene i regioner. | Features bør ha samme størrelsesorden, helst rundt 1, ellers kan gradientene bli enorme. |
| Uten begrensning på dybden kan treet bli for dypt og overtilpasse. | Funksjonsformen er bestemt av graden. Algoritmen kan ikke legge til eller fjerne ledd. |
| Har en overordnet struktur, men den konkrete oppbygningen (arkitekturen) bestemmes under trening. | Har en gitt likningsform. Bare parametrene til hvert ledd tilpasses. |
| Returnerer et flyttall (regresjon) eller en klasse (klassifisering). | Returnerer et flyttall. |

**Begge er tolkbare.** I regresjonsmodeller sier størrelsen på koeffisientene hvor viktig hver feature er (med sammenlignbar skala). I trær er splitt-kriteriene forståelige, og features som splittes tidlig eller ofte, er viktige. Det samme gjelder ikke for modellene som kommer etterpå, som nevrale nett. Det er motivasjonen for forklarbar KI (kapittel 8).

### Formler

Varians i targets i en node $R$ med $|R|$ punkter og snitt $\bar{y}_R$:

$$
\text{Var}(R) = \frac{1}{|R|}\sum_{i \in R}\left(y^{(i)} - \bar{y}_R\right)^2
$$

Vektet varians etter splitt i $R_1$ og $R_2$, som skal minimeres:

$$
\frac{|R_1|}{|R|}\,\text{Var}(R_1) + \frac{|R_2|}{|R|}\,\text{Var}(R_2)
$$

Prediksjon for et punkt som havner i region $R_m$:

$$
\hat{y} = \bar{y}_{R_m}
$$

Formlene er standardformen sklearn bruker. Kursmaterialet beskriver prinsippet (lavest varians etter splitt), men skriver ikke ut formelen.

### Sammenhenger

- Samme struktur som klassifiseringstrær (kapittel 2). Bare urenhetsmålet og prediksjonen i løvnodene er byttet ut.
- Dype trær har lav bias og høy varians. Random forest og gradient boosting bygger på mange trær for å utnytte dette (kapittel 4).
- Gradient boosting for regresjon trener regresjonstrær på residualene (kapittel 4).

### Vanlige misforståelser

- «Regresjonstreet velger splitten med høyest varians.» Det velger lavest varians etter splitt.
- «Et tre gir en glatt kurve.» Prediksjonen er stykkevis konstant.
- «sklearn velger optimal dybde automatisk.» Uten begrensning vokser treet til det overtilpasser.

### Eksamensoppsummering

- Forklare at regresjonstrær deler rommet i regioner og predikerer én verdi per region.
- Vite at splitten velges for lavest varians i targets etter splitt.
- Forklare hvorfor et ubegrenset tre overtilpasser støyete data, og at dybden er en hyperparameter.
- Kunne forskjellene mellom trær og regresjonsmodeller i tabellen.
