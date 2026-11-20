---
kapittel: 1
tittel: Grunnlag og logistisk regresjon
kilder: Forelesningsnotater 1.1–1.2.6, F2 (Veiledet læring, data og klassifisering), eksamen 2024 og 2025, øving 1
---

# Kapittel 1 – Grunnlag og logistisk regresjon

Dette kapittelet bygger hele maskinlæringsprosessen fra bunnen: data inn, modell, tapsfunksjon, optimering og evaluering. Logistisk regresjon er eksempelmodellen, men nesten alt her går igjen senere. Tapsfunksjon, gradient descent, læringsrate, epoker og train/test-splitt brukes på nytt for nevrale nettverk i kapittel 5.

---

## 1.1 Maskinlæring, data og features {#data}

*Kilder: notater 1.1, F2. Definisjonen av induktivt bias kommer fra eksamen 2024 og står ikke i notatene eller slidene vi har (trolig fra F1).*

### Introduksjon

Maskinlæring handler om å få datamaskiner til å lære av data i stedet for å følge regler vi har skrevet for hånd. Før vi kan lage en modell, må vi vite hva slags data vi har, hva vi vil finne ut, og hvordan dataene må gjøres klare. Etter denne delen skal du kunne beskrive en datasett-tabell med riktig notasjon, skille typer features og vite hvilke preprosesseringssteg som trengs, og hvorfor.

### Begreper

- **Maskinlæring (Samuel 1959):** feltet som gir datamaskiner evnen til å lære uten å være eksplisitt programmert.
- **Maskinlæring (Mitchell 1997):** et program lærer av erfaring $E$ med hensyn til en oppgave $T$ og et ytelsesmål $P$ hvis ytelsen på $T$, målt med $P$, blir bedre med erfaring $E$. Erfaringen er data, oppgaven er det vi vil estimere, og ytelsesmålet er tapsfunksjonen og metrikkene.
- **Datasett, datapunkt, feature:** et datasett består av datapunkter (rader) med egenskaper (kolonner). Egenskapene heter variabler i statistikk og features i maskinlæring. Kurset bruker ordene om hverandre.
- **Target $y$:** kolonnen med svaret vi vil estimere, for eksempel `Survived` i Titanic-dataene.
- **Kvalitative (kategoriske) features:** et tellbart antall verdier eller kategorier, for eksempel kjønn, sjanger eller aldersgruppe. Må som regel enkodes til tall før bruk, for eksempel med label encoding.
- **Kvantitative (numeriske) features:** kan måles og sorteres, og vi kan regne med dem. De kan være diskrete (antall lyttere) eller kontinuerlige (alder, temperatur). De kan i prinsippet brukes direkte, men bør ofte normaliseres.
- **Binær feature:** kategorisk med bare to verdier, for eksempel `Sex` og `Survived`.
- **Læringsformer:** *veiledet læring* når dataene har et target per datapunkt, *uveiledet læring* når de ikke har det (kapittel 6), og *forsterkende læring* når en agent lærer av belønning ved å handle i et miljø (kapittel 7).
- **Preprosessering:** alt vi gjør med dataene før modellering, for eksempel å fjerne rader, enkode og skalere.
- **Induktivt bias:** antakelsene en modell gjør for å kunne generalisere fra treningsdata til usette data. En lineær modell antar for eksempel at hver feature bidrar additivt og uavhengig av de andre, altså at det ikke er vekselvirkninger mellom features.

### Forklaring

**Notasjon.** Hver rad er et datapunkt med indeks oppe i parentes, og hver kolonne er en feature med indeks nede:

$$
\mathbf{x}^{(i)} = \left(x_1^{(i)}, x_2^{(i)}, \dots, x_n^{(i)}\right), \qquad y^{(i)} \in \{0, 1\}
$$

Parentesen rundt $i$ skiller indeksen fra en eksponent. Fet $\mathbf{x}$ betyr vektor. Oppgaven i Titanic-eksempelet er altså å lære avbildningen

$$
\underbrace{(\text{Pclass},\ \text{Sex},\ \text{Age})}_{\mathbf{x}^{(i)}} \;\longrightarrow\; \underbrace{\text{Survived}}_{y^{(i)}}
$$

Vi har features $\mathbf{x}$ og targets $y$, og vi vil estimere $y$ for nye $\mathbf{x}$ ut fra sammenhengene i de kjente dataene. Siden vi har et target per datapunkt, kan vi bruke veiledet læring.

**Hvilke features skal vi bruke?** `PassengerId` er sannsynligvis tilfeldig valgt og sier ingenting om passasjeren, så den fjernes. `Name` er bare nyttig hvis modellen forstår språk godt nok til å finne en sammenheng mellom navn og overlevelse, og det gjør ikke modellene i dette kurset.

**Tre problemer som må løses før plotting og modellering:**

1. **Manglende verdier.** Rad 6 mangler alder. Vi kan fjerne raden (`dropna()` i pandas), fjerne hele featuren eller erstatte verdien med et estimat (imputering).
2. **Strenger.** `Sex` er tekst, og datamaskinen kan ikke regne med den. `LabelEncoder` gjør hver kategori om til et tall, for eksempel female → 0 og male → 1. Sjekk hvilken kategori som fikk hvilket tall.
3. **Ulik skala.** Alder ligger rundt 0–80, mens de enkodede featurene er 0–3. `MinMaxScaler` skalerer til $[0, 1]$. Skaleringen må tilpasses på treningsdataene alene (se 1.4).

**Se på dataene.** Plotting og preprosessering skjer om hverandre, fordi plott gir idéer til hvordan dataene bør behandles.

- Et **bar-plott** viser middelverdien per kategori, for eksempel andelen som overlevde i hver passasjerklasse. Det brukes til å sammenligne gjennomsnitt på tvers av kategorier.
- Et **histogram** viser fordelingen av en variabel, gjerne én fordeling per klasse. Stolpene er intervaller (bins). Ser histogrammet hakkete ut, har du trolig for mange bins med for få punkter i hver. Ser du ingen form, har du trolig for få bins. Det finnes ingen generell regel for antall bins.

Plottene av Titanic-dataene antyder allerede at kvinner, passasjerer på første klasse og unge oftere overlevde.

**Maskinlæringsprosessen i tre steg (F2):**

1. Hente, rense og splitte data.
2. Tilpasse en modell ved hjelp av en tapsfunksjon og en optimeringsalgoritme.
3. Evaluere modellen med metrikker.

### Formler

Modellen skal estimere sannsynligheten for target gitt features:

$$
f(\mathbf{x}) = y_{\text{pred}} \approx p(y \mid \mathbf{x})
$$

Min–maks-skalering av feature $x_j$, der minimum og maksimum hentes fra treningsdataene:

$$
x_j' = \frac{x_j - \min(x_j)}{\max(x_j) - \min(x_j)}
$$

### Sammenhenger

- Valget av læringsform styres av dataene: finnes et target, kan vi gjøre veiledet læring. Uten target står vi igjen med klynging, dimensjonsreduksjon og anomalideteksjon (kapittel 6).
- Skalering er viktig for gradientbaserte modeller (logistisk regresjon, nevrale nett) og for avstandsbaserte metoder (k-means, DBSCAN). Beslutningstrær trenger ikke skalering, fordi de bare sammenligner en feature med en terskel (kapittel 2).
- Enkoding med `LabelEncoder` gir kategoriene en rekkefølge (0 < 1 < 2) som ikke nødvendigvis finnes. For binære features spiller det ingen rolle.

### Vanlige misforståelser

- «Alle tall-kolonner er kvantitative.» `Pclass` er lagret som 1, 2 og 3, men er en kategori. `PassengerId` er et tall uten mening.
- «Preprosessering gjøres på hele datasettet før splitt.» Skalering og andre steg som lærer noe av dataene, skal tilpasses på treningsdataene alene. Ellers lekker informasjon fra testdataene inn i modellen.
- «Target er en feature.» Target er det vi vil estimere og skal aldri være input til modellen.

### Eksamensoppsummering

- Kunne Mitchell-definisjonen og koble $E$, $T$ og $P$ til data, oppgave og ytelsesmål.
- Skille kvalitative og kvantitative features, binære og kontinuerlige, og peke ut features som ikke bør brukes.
- Kjenne de tre preprosesseringsproblemene (manglende verdier, strenger, ulik skala) og løsningene (fjerne eller imputere, enkode, skalere).
- Kategoriske features må gjøres om til tall før logistisk regresjon. Target skal ikke normaliseres.
- Induktivt bias er antakelsene modellen gjør for å generalisere. En lineær modell antar ingen vekselvirkninger.

---

## 1.2 Logistisk regresjon: modellen {#logistisk-regresjon}

*Kilder: notater 1.2, F2, øving 1.*

### Introduksjon

Logistisk regresjon er den enkleste modellen for binær klassifisering, og den er byggesteinen i nevrale nettverk: ett nevron med sigmoid-aktivering er nøyaktig en logistisk regresjon. Etter denne delen skal du kunne skrive opp modellen, forklare hvorfor sigmoid trengs, tolke outputen og forklare hvorfor beslutningsgrensen er lineær.

### Begreper

- **Lineær kombinasjon $z$:** den vektede summen av features pluss bias.
- **Vekter $w_i$:** hvor mye hver feature betyr for utfallet. Fortegnet sier om featuren trekker mot klasse 1 eller 0.
- **Bias $b$:** et konstantledd som flytter beslutningsgrensen.
- **Sigmoid (logistisk funksjon) $\sigma$:** S-formet funksjon som mapper alle reelle tall til intervallet $(0, 1)$. Vi møter den igjen som aktiveringsfunksjon i nevrale nettverk.
- **Prediksjon $y_{\text{pred}}$ (eller $\hat{y}$):** modellens estimat av $p(y = 1 \mid \mathbf{x})$.
- **Modellparametre $\theta = (\mathbf{w}, b)$:** det som tilpasses under trening.

### Forklaring

Den enkleste modellen vi kan tenke oss er lineær regresjon, $z = \mathbf{w}\mathbf{x} + b$. Problemet er at $z$ kan bli hva som helst, mens vi trenger en sannsynlighet mellom 0 og 1. Løsningen er å sende $z$ gjennom sigmoid:

- Stor positiv $z$ gir $\sigma(z) \approx 1$.
- Stor negativ $z$ gir $\sigma(z) \approx 0$.
- $z = 0$ gir $\sigma(z) = 0{,}5$.

Modellen heter logistisk *regresjon* fordi den bruker den logistiske funksjonen på en lineær regresjon, men den brukes til *klassifisering*.

**Fra sannsynlighet til klasse.** Modellen gir et tall i $(0, 1)$. For å få en klasse velger vi en terskel, vanligvis 0,5: klasse 1 hvis $y_{\text{pred}} > 0{,}5$, ellers 0 (mer i 1.6). Siden $\sigma(z) > 0{,}5$ nøyaktig når $z > 0$, er beslutningsgrensen mengden der $\mathbf{w}\mathbf{x} + b = 0$. Det er en rett linje i 2D og et hyperplan i flere dimensjoner. Logistisk regresjon kan derfor bare skille klasser som er (omtrent) lineært separerbare i featurene den får.

**Regneeksempel.** La $\mathbf{w} = (0{,}5;\ -1)$, $b = 0{,}2$ og $\mathbf{x} = (2;\ 1)$:

$$
z = 0{,}5 \cdot 2 + (-1) \cdot 1 + 0{,}2 = 0{,}2, \qquad y_{\text{pred}} = \sigma(0{,}2) = \frac{1}{1 + e^{-0{,}2}} \approx 0{,}55
$$

Med terskel 0,5 blir dette klasse 1, men modellen er usikker.

**Kobling til øving 1.** I øving 1 følger klassifiseringsdataene et XOR-mønster: klassen bestemmes av fortegnet til $x_0 \cdot x_1$. Ingen rett linje i $(x_0, x_1)$-planet skiller klassene, så logistisk regresjon på de rå featurene blir ikke mye bedre enn tilfeldig. Legger vi til featuren $x_0 x_1$, blir problemet lineært separerbart i det nye feature-rommet. Dette er feature engineering (kapittel 3) og motivasjonen for nevrale nettverk (kapittel 5).

### Formler

$$
z = \sum_{i=1}^{n} w_i x_i + b = \mathbf{w}\mathbf{x} + b
$$

$$
\sigma(z) = \frac{1}{1 + e^{-z}}
$$

$$
y_{\text{pred}} = \sigma(\mathbf{w}\mathbf{x} + b) = \frac{1}{1 + e^{-\left(\sum_i w_i x_i + b\right)}}
$$

- $z$ er et tall (skalar), ikke en vektor: $\mathbf{w}\mathbf{x}$ er et skalarprodukt.
- $n$ er antall features.
- I NumPy, med $X$ av form (antall datapunkter, antall features), gir `np.matmul(X, w) + b` én $z$ per datapunkt, og `1 / (1 + np.exp(-z))` gir sannsynligheter i $(0, 1)$, ikke klasser.

### Sammenhenger

- Logistisk regresjon = lineær modell + sigmoid. Et nevron i et nevralt nett = lineær kombinasjon + aktiveringsfunksjon. Med sigmoid er de identiske.
- Lineær beslutningsgrense er modellens induktive bias. Trær, nevrale nett og feature engineering er ulike måter å komme forbi den på.
- Sigmoid gjør modellen deriverbar, i motsetning til en hard terskel (Heaviside). Det er det som gjør at vi kan trene den med gradient descent (1.4 og kapittel 5).

### Vanlige misforståelser

- «Logistisk regresjon er en regresjonsmetode.» Den er en klassifiseringsmetode.
- «Outputen er klassen.» Outputen er en sannsynlighet i $(0, 1)$. Klassen kommer først når vi velger en terskel.
- «Outputen er den sanne sannsynligheten.» Den er modellens *estimat*, som kan være dårlig kalibrert.
- «Logistisk regresjon gir en kurvet grense fordi sigmoid er kurvet.» Sigmoid virker på $z$, og grensen $z = 0$ er lineær i $\mathbf{x}$.

### Eksamensoppsummering

- Kunne skrive $z$, $\sigma(z)$ og $y_{\text{pred}}$ og regne ut en prediksjon for hånd.
- Vite at outputen ligger i $(0, 1)$ og tolkes som estimert sannsynlighet.
- Forklare hvorfor beslutningsgrensen er lineær og hvorfor XOR ikke kan løses uten nye features.
- Kjenne igjen sigmoid i NumPy-kode.

---

## 1.3 Tapsfunksjon: likelihood og cross-entropy {#tapsfunksjon}

*Kilder: notater 1.2.1, F2.*

### Introduksjon

For å trene en modell trenger vi et tall som sier hvor dårlig den gjør det: tapsfunksjonen. For logistisk regresjon utleder vi den fra sannsynlighetsteori, og resultatet er binær cross-entropy. Etter denne delen skal du kunne utlede tapsfunksjonen fra likelihood, forklare forskjellen på likelihood og sannsynlighet, og forklare hvorfor vi tar logaritmen og legger på et minustegn.

### Begreper

- **Trening (læring):** å tilpasse modellparametrene slik at måloppnåelsen øker på treningsdataene.
- **Treningsdata:** dataene som brukes til å tilpasse parametrene.
- **Tapsfunksjon (loss function) $\mathcal{L}(y_{\text{pred}}, y)$:** måler hvor langt prediksjonen er fra target for ett datapunkt.
- **Likelihood $L(\theta \mid \mathbf{x}, y)$:** sannsynligheten for de observerte dataene sett som en funksjon av parametrene. Dataene er gitt, parametrene varierer.
- **Sannsynlighet:** parametrene er gitt (vi har en modell), og vi spør hvor sannsynlige ulike observasjoner er.
- **Log-likelihood:** logaritmen av likelihood.
- **Cross-entropy loss:** minus log-likelihood. Skal minimeres.
- **Conditional maximum likelihood estimation:** å velge de parametrene som maksimerer log-likelihood for targets $y$ gitt features $\mathbf{x}$.

### Forklaring

**Steg 1: sannsynligheten for riktig svar.** Vi vil at modellen gir høy $y_{\text{pred}}$ når $y = 1$ og lav $y_{\text{pred}}$ når $y = 0$. Begge ønskene kan skrives i ett uttrykk:

$$
y_{\text{pred}}^{\,y}\,(1 - y_{\text{pred}})^{1 - y}
$$

Er $y = 1$, blir uttrykket $y_{\text{pred}}$. Er $y = 0$, blir det $1 - y_{\text{pred}}$. Det er altså sannsynligheten modellen gir til den *riktige* klassen, og den er størst når modellen treffer.

**Steg 2: likelihood.** Dataene kan vi ikke endre, men modellen kan vi endre, og det er det trening er. Vi setter inn $y_{\text{pred}} = \sigma(\mathbf{w}\mathbf{x} + b)$ og ser på uttrykket som en funksjon av parametrene. Da er det en likelihood. Vi står i situasjonen der observasjonene er kjent og vi vil finne en modell som passer til dem, og da trenger vi en fordeling over parametrene.

**Steg 3: logaritme.** Eksponentene gjør uttrykket tungvint. Siden logaritmen er monotont voksende, har log-likelihood maksimum i samme punkt som likelihood. Logaritmen gjør produkter om til summer og eksponenter om til faktorer.

**Steg 4: minustegn.** Likelihood skal maksimeres. Tap skal minimeres. Vi legger på et minustegn og får cross-entropy loss.

**Steg 5: snitt over datasettet.** Vi vil minimere tapet i gjennomsnitt over alle $N$ treningspunkter.

**Hvordan tapet straffer.** For et punkt med $y = 1$:

| $y_{\text{pred}}$ | Tap $-\ln y_{\text{pred}}$ |
|---|---|
| 0,9 | 0,11 |
| 0,5 | 0,69 |
| 0,1 | 2,30 |
| $\to 0$ | $\to \infty$ |

En sikker, men feil prediksjon straffes svært hardt. Det er en ønsket egenskap: modellen tvinges bort fra å være skråsikker og feil.

### Formler

Likelihood for ett datapunkt:

$$
L(\mathbf{w}, b \mid \mathbf{x}, y) = \sigma(\mathbf{w}\mathbf{x} + b)^{\,y}\,\bigl(1 - \sigma(\mathbf{w}\mathbf{x} + b)\bigr)^{1 - y}
$$

Log-likelihood:

$$
\ln L = y \ln \sigma(\mathbf{w}\mathbf{x} + b) + (1 - y)\ln\bigl(1 - \sigma(\mathbf{w}\mathbf{x} + b)\bigr)
$$

Binær cross-entropy loss:

$$
\mathcal{L}(y_{\text{pred}}, y) = -\ln L = -y \ln y_{\text{pred}} - (1 - y)\ln(1 - y_{\text{pred}})
$$

Treningsproblemet, med $\theta = (\mathbf{w}, b)$:

$$
\hat{\theta} = \arg\min_{\theta} \frac{1}{N}\sum_{i=1}^{N} \mathcal{L}\!\left(f(\mathbf{x}^{(i)}; \theta),\, y^{(i)}\right)
$$

- $N$ er antall treningspunkter, og $f(\mathbf{x}^{(i)}; \theta)$ er prediksjonen for punkt $i$ med parametrene $\theta$.
- $\arg\min_\theta$ betyr «verdien av $\theta$ som gjør uttrykket minst».

I kode (`y` og `y_pred` som arrayer):

```python
loss = -np.mean(y * np.log(y_pred) + (1 - y) * np.log(1 - y_pred))
```

### Sammenhenger

- Cross-entropy er minus log-likelihood. Å minimere cross-entropy er det samme som å gjøre maximum likelihood-estimering. Navnet kommer fra informasjonsteori (1.7).
- Tilsvarende gir MSE i lineær regresjon maximum likelihood når støyen er gaussisk (kapittel 3).
- Vektet cross-entropy for ubalanserte data (kapittel 2) er den samme formelen med en vekt foran hvert ledd.

### Vanlige misforståelser

- «Likelihood og sannsynlighet er det samme.» Formelen er den samme, men i likelihood er dataene faste og parametrene variable.
- «Vi tar logaritmen fordi det endrer optimum.» Det gjør det ikke. Logaritmen er monoton, så optimum er det samme. Vi tar den fordi uttrykket blir enklere å derivere.
- «Cross-entropy kan bare brukes til lineære modeller.» Den brukes til alle sannsynlighetsbaserte klassifikatorer, også nevrale nett.

### Eksamensoppsummering

- Kunne skrive binær cross-entropy og forklare hvert ledd.
- Kunne utlede den i fire steg: sannsynlighet for riktig svar, likelihood, log-likelihood, minus.
- Forklare hvorfor logaritmen ikke endrer optimum.
- Kjenne igjen riktig `np.log`-implementasjon av tapet.

---

## 1.4 Gradient descent og trening {#gradient-descent}

*Kilder: notater 1.2.2–1.2.3, F2, eksamen 2024 og 2025, øving 1.*

### Introduksjon

Vi har en modell og en tapsfunksjon. Nå trenger vi en metode for å finne parametrene som gir lavest tap. Gradient descent brukes gjennom hele kurset, også til nevrale nettverk. Etter denne delen skal du forstå hvordan metoden virker, hva læringsraten gjør, forskjellen på parametre og hyperparametre, og hvordan en treningsprosedyre settes opp med train/test-splitt.

### Begreper

- **Gradient descent:** iterativ metode for å finne minimum av en funksjon vi ikke kjenner formen til, ved å gå i retningen der funksjonen synker brattest.
- **Parameterrommet:** rommet utspent av alle parametrene $\theta$. Med fire parametre er det firedimensjonalt.
- **Gradient $\partial \mathcal{L} / \partial \theta$:** vektoren av partiellderiverte. Den peker i retning av *økende* tap.
- **Læringsrate $\eta$:** hvor store steg vi tar.
- **Hyperparameter:** parameter som definerer læringsprosessen, ikke modellen, for eksempel læringsrate og antall epoker. Settes av oss, ikke av treningen.
- **Epoke:** én gjennomgang av alle treningsdataene i læringsalgoritmen.
- **Konveks funksjon:** har bare ett minimum, så et funnet minimum er globalt.
- **Lokalt vs globalt minimum:** et lokalt minimum er lavere enn alt rundt seg, men ikke nødvendigvis det laveste totalt.
- **Generalisering:** å gjøre det godt på nye data, ikke bare på treningsdataene.
- **Train/test-splitt:** treningsdata brukes til å tilpasse parametrene. Testdata røres ikke før modellen er ferdig.

### Forklaring

**Intuisjon.** Du står på et fjell med bind for øynene og vil ned i dalen. Du kjenner etter hvilken vei bakken heller brattest nedover, tar et steg, og gjentar. Faren er at du går deg vill i en fjellkjede og blir stående i en grop (lokalt minimum) uten å vite at det finnes en dypere dal bak neste topp.

**Hvorfor det går bra for logistisk regresjon.** Cross-entropy-tapet for logistisk regresjon er konvekst. Det har bare ett minimum, så gradient descent som finner et minimum, har funnet det globale. For nevrale nettverk gjelder ikke dette.

**Algoritmen.**

1. Start med (tilfeldige eller null-) verdier for parametrene.
2. Regn ut prediksjonene og tapet.
3. Regn ut gradienten av tapet med hensyn på hver parameter.
4. Oppdater: gå et steg *mot* gradienten, skalert med $\eta$.
5. Gjenta til tapet slutter å synke.

**Viktig konsekvens.** Siden gradient descent trenger gradienten, *må tapsfunksjonen være deriverbar*. Det gjelder også for nevrale nett.

**Læringsraten.**

- For liten $\eta$: små steg, treg trening, kan trenge svært mange epoker.
- For stor $\eta$: stegene skyter over minimum, og tapet oscillerer eller divergerer i stedet for å synke jevnt. Et oscillerende treningstap med korrekt implementasjon tyder på for høy læringsrate.

**Regneeksempel (ett steg).** Én feature, $w = 0$, $b = 0$, datapunkt $x = 2$, $y = 1$ og $\eta = 0{,}1$:

$$
y_{\text{pred}} = \sigma(0) = 0{,}5, \qquad \frac{\partial \mathcal{L}}{\partial w} = (0{,}5 - 1)\cdot 2 = -1, \qquad \frac{\partial \mathcal{L}}{\partial b} = 0{,}5 - 1 = -0{,}5
$$

$$
w \leftarrow 0 - 0{,}1\cdot(-1) = 0{,}1, \qquad b \leftarrow 0 - 0{,}1\cdot(-0{,}5) = 0{,}05
$$

Begge parametrene øker, så $z$ og dermed $y_{\text{pred}}$ øker for dette punktet, akkurat som vi vil når $y = 1$.

**Læringsalgoritmen i kode (notater og F2).** Klassen har `fit` og `predict`. Navnene er standard i bibliotekene, så bruk dem også i egen kode.

```python
def fit(self, x, y):
    self.weights = np.zeros(x.shape[1])   # x.shape = (datapunkter, features)
    self.bias = 0
    for _ in range(self.epochs):          # epoker: en hyperparameter
        lin_model = np.matmul(self.weights, x.transpose()) + self.bias
        y_pred = self._sigmoid(lin_model)
        grad_w, grad_b = self.compute_gradients(x, y, y_pred)
        self.update_parameters(grad_w, grad_b)
```

Her bruker hver epoke alle treningsdataene til å regne ut gradienten, og gjør én oppdatering. Det er full-batch gradient descent. Varianter med mindre batcher kommer i kapittel 5. Ut av læringsalgoritmen får vi en *modell* med tilpassede parametre.

**Train/test-splitt.** Gullstandarden er at dataene som brukes til å trene modellen, ikke brukes til å evaluere den. Splitt i trening og test, og ikke rør testdataene før modellen er ferdig. Alt som «lærer» noe av dataene (`fit`), gjøres bare på treningsdataene. Testdataene får bare `transform`:

```python
X_train, X_test, y_train, y_test = train_test_split(X_data, y_data, test_size=0.2)
scaler = MinMaxScaler()
X_train = scaler.fit_transform(X_train)   # lærer min og maks fra treningsdata
X_test = scaler.transform(X_test)         # bruker de samme verdiene på testdata
```

Bruker vi `fit` på testdataene, eller på hele datasettet før splitt, lekker informasjon fra testdataene inn i treningen, og testresultatet blir for optimistisk.

**Følg med på treningen.** Plott tap og accuracy per epoke. Tapet bør synke og flate ut, og accuracy bør stige og flate ut. Har kurvene ikke flatet ut, trengs flere epoker. Har de flatet ut tidlig, kunne vi stoppet før.

### Formler

Oppdateringsregelen:

$$
\theta_{t+1} = \theta_t - \eta\,\frac{\partial}{\partial \theta}\mathcal{L}\bigl(f(\mathbf{x}; \theta), y\bigr)
$$

- $\theta_t$ er parameterverdien etter steg $t$.
- Minustegnet gjør at vi går *mot* gradienten, altså nedover.
- $\eta$ er læringsraten.

Nyttige derivasjonsregler for utledningen:

$$
\frac{d}{dx}\ln x = \frac{1}{x}, \qquad \frac{d}{dz}\sigma(z) = \sigma(z)\bigl(1 - \sigma(z)\bigr), \qquad \frac{\partial f}{\partial x} = \frac{\partial f}{\partial u}\frac{\partial u}{\partial x}
$$

Gradientene for logistisk regresjon med cross-entropy, for ett datapunkt:

$$
\frac{\partial \mathcal{L}}{\partial w_j} = (y_{\text{pred}} - y)\,x_j, \qquad \frac{\partial \mathcal{L}}{\partial b} = y_{\text{pred}} - y
$$

Over hele treningssettet bruker vi snittet:

$$
\frac{\partial \mathcal{L}}{\partial w_j} = \frac{1}{N}\sum_{i=1}^{N}\left(y_{\text{pred}}^{(i)} - y^{(i)}\right)x_j^{(i)}
$$

**Utledningen i korte trekk.** Med kjerneregelen gir $\ln$-leddene faktorene $1/\sigma$ og $1/(1-\sigma)$, og $\sigma'$ gir $\sigma(1-\sigma)$. Disse kansellerer:

$$
\frac{\partial \mathcal{L}}{\partial w_j}
= \frac{-y(1-\sigma) + (1-y)\sigma}{\sigma(1-\sigma)}\cdot\sigma(1-\sigma)\cdot x_j
= (\sigma - y)\,x_j
$$

Resultatet er enkelt og intuitivt: gradienten er feilen $(y_{\text{pred}} - y)$ ganget med inputen. Stor feil gir stor oppdatering, og features med stor verdi får større oppdatering.

### Sammenhenger

- Samme oppdateringsregel brukes for nevrale nett. Der regnes gradientene ut med backpropagation (kapittel 5).
- Læringsrate og epoker er hyperparametre. De velges med valideringsdata, ikke testdata (kapittel 3).
- Tapet er konvekst for logistisk regresjon, men ikke for nevrale nett. Der kan gradient descent havne i lokale minima.

### Vanlige misforståelser

- «Gradienten peker mot minimum.» Gradienten peker mot *økende* tap. Vi går i motsatt retning.
- «Læringsraten er en modellparameter.» Den er en hyperparameter. Den styrer læringen, men er ikke en del av den ferdige modellen.
- «En epoke er én oppdatering.» En epoke er én gjennomgang av alle treningsdataene. Hvor mange oppdateringer det blir, avhenger av batch size (kapittel 5).
- «Høyere læringsrate gir alltid raskere trening.» For høy læringsrate kan få tapet til å oscillere eller divergere.
- «Skaler hele datasettet først, så splitt.» Det gir datalekkasje.

### Eksamensoppsummering

- Kunne oppdateringsregelen og forklare minustegnet og $\eta$.
- Kunne regne ett gradient descent-steg for hånd.
- Kunne gradientene $(y_{\text{pred}} - y)x_j$ og $(y_{\text{pred}} - y)$.
- Forklare forskjellen på parametre og hyperparametre.
- Vite at tapsfunksjonen må være deriverbar, og at tapet er konvekst for logistisk regresjon.
- Diagnostisere for høy læringsrate (oscillerende tap).
- Kunne riktig rekkefølge: splitt, `fit` på trening, `transform` på test.

---

## 1.5 Evaluering: confusion matrix og metrikker {#metrikker}

*Kilder: notater 1.2.4, F2, eksamen 2024.*

### Introduksjon

Et lavt tap betyr ikke at modellen er god til det den skal brukes til. Vi trenger metrikker som gir mening for mennesker og som passer bruksområdet. Etter denne delen skal du kunne sette opp en confusion matrix, regne ut de viktigste metrikkene og velge riktig metrikk for en gitt situasjon.

### Begreper

- **Evalueringsmetrikk:** et mål på ytelse som gir mening for mennesker og er tilpasset bruksområdet. Den trenger ikke være deriverbar.
- **Accuracy (treffsikkerhet):** andel riktige prediksjoner.
- **Confusion matrix:** tabell over riktige og gale prediksjoner per klasse. For binær klassifisering: positiv klasse (1) og negativ klasse (0).
- **TP (sann positiv):** positiv, predikert positiv.
- **TN (sann negativ):** negativ, predikert negativ.
- **FP (falsk positiv):** negativ, predikert positiv. Falsk alarm.
- **FN (falsk negativ):** positiv, predikert negativ. Oversett tilfelle.
- **P og N:** antall faktisk positive ($TP + FN$) og negative ($TN + FP$).
- **TPR, recall, sensitivitet, sannsynlighet for deteksjon:** andel av de positive som blir funnet.
- **TNR, spesifisitet:** andel av de negative som blir riktig klassifisert.
- **FPR, sannsynlighet for falsk alarm:** andel av de negative som feilaktig blir predikert positive. $FPR = 1 - TNR$.
- **PPV, precision (presisjon):** andel av de predikert positive som faktisk er positive.

### Forklaring

**Hvorfor ikke bare bruke tapet?** Tapsfunksjonen må være deriverbar og passe optimeringen. Metrikken skal fortelle *oss* hvor god modellen er til oppgaven, og den kan godt være ikke-deriverbar, som accuracy. Tap og accuracy sier dessuten lite om *hvilke* feil modellen gjør. Tror den at folk som døde overlevde, eller omvendt?

**Confusion matrix.** Sanne prediksjoner ligger på diagonalen, gale utenfor:

| | Predikert negativ | Predikert positiv |
|---|---|---|
| **Faktisk negativ (N)** | TN | FP |
| **Faktisk positiv (P)** | FN | TP |

**Regneeksempel (F2).** TN = 73, FP = 13, FN = 23 og TP = 34, altså 57 positive og 86 negative.

| Metrikk | Utregning | Verdi |
|---|---|---|
| TPR (recall) | $34 / 57$ | 0,60 |
| TNR (spesifisitet) | $73 / 86$ | 0,85 |
| FPR | $13 / 86$ | 0,15 |
| PPV (precision) | $34 / 47$ | 0,72 |
| Accuracy | $107 / 143$ | 0,75 |

Accuracy på 0,75 skjuler at modellen bare finner 60 % av de positive.

**Velg metrikk etter hvilken feil som er dyrest.**

- **Sykehus som skal finne en dødelig sykdom:** en falsk negativ er svært alvorlig, så modellen må ha høy **recall**.
- **Dyr utrykning eller alarm:** en falsk positiv er dyr, så modellen må ha høy **presisjon** (eller lav FPR).
- **Sjelden sykdom:** accuracy kan være høy selv om modellen aldri finner en eneste syk pasient, fordi nesten alle er friske. Se accuracy-paradokset i kapittel 2.

### Formler

$$
\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}
$$

$$
TPR = \text{Recall} = \frac{TP}{P} = \frac{TP}{TP + FN}, \qquad TNR = \frac{TN}{N} = \frac{TN}{TN + FP}
$$

$$
FPR = \frac{FP}{N} = \frac{FP}{FP + TN} = 1 - TNR, \qquad PPV = \text{Precision} = \frac{TP}{TP + FP}
$$

Huskeregel: TPR og recall har *faktisk positive* i nevneren. Precision har *predikert positive* i nevneren. TNR og FPR har *faktisk negative* i nevneren.

### Sammenhenger

- Recall og precision har samme teller (TP), men ulik nevner. Recall spør «hvor mange av de positive fant vi?», precision spør «hvor mange av alarmene var ekte?».
- TPR og FPR beregnes innad i hver klasse, så de påvirkes ikke av hvor mange positive og negative det er. Precision blander klassene (TP fra de positive, FP fra de negative) og avhenger derfor av klassefordelingen.
- Alle metrikkene avhenger av klassifiseringsterskelen (1.6).

### Vanlige misforståelser

- «Høy accuracy betyr god modell.» Ikke med ubalanserte data.
- «Precision og recall er to navn på det samme.» De har ulik nevner og måler ulike feil.
- «FPR er andelen av alarmene som er falske.» FPR er andelen av de *negative* som gir alarm. Andelen falske blant alarmene er $1 - \text{precision}$.
- «Tapsfunksjon og metrikk bør være den samme.» Tapet må være deriverbart og egnet til optimering. Metrikken må gi mening for anvendelsen.

### Eksamensoppsummering

- Kunne sette opp en confusion matrix og regne TPR, TNR, FPR, precision og accuracy.
- Kunne alle alternative navn: recall = sensitivitet = TPR, spesifisitet = TNR, precision = PPV, FPR = 1 − spesifisitet.
- Velge recall når falske negative er dyre og precision når falske positive er dyre.
- Forklare hvorfor tap og metrikk ikke bør være det samme.

---

## 1.6 Klassifiseringsterskel, ROC og precision–recall {#roc}

*Kilder: notater 1.2.5, F2, notater kap. 8 (eksempeloppgaver), eksamen 2024.*

### Introduksjon

Modellen gir sannsynligheter, og terskelen avgjør hva som blir klasse 1. Ulike terskler gir ulike confusion matrices og dermed ulike metrikker. ROC-kurven og precision–recall-kurven viser modellen over alle terskler på én gang. Etter denne delen skal du kunne lese og tolke en ROC-kurve, forklare AUC og velge terskel ut fra anvendelsen.

### Begreper

- **Klassifiseringsterskel:** verdien som skiller klasse 1 fra klasse 0, vanligvis 0,5.
- **ROC-kurve (Receiver Operating Characteristic):** TPR plottet mot FPR for mange terskler mellom 1 og 0.
- **AUC (area under the curve), ROC AUC:** arealet under ROC-kurven, mellom 0 og 1.
- **Precision–recall-kurve:** precision plottet mot recall for ulike terskler.
- **`predict_proba`:** metoden som returnerer sannsynlighetene i stedet for klassene. ROC krever sannsynligheter.

### Forklaring

**Historien bak navnet.** Under andre verdenskrig satt radaroperatører og prøvde å skille fly (positiv klasse) fra for eksempel gjess (negativ klasse). Noen var nervøse og slo alarm for alt, andre var i overkant kule. De brukte altså ulike terskler. ROC-kurven ble laget for å analysere TPR og FPR som funksjon av terskelen.

**Endepunktene.**

- Terskel 1 (eller høyere), «operatøren sover»: nesten ingenting predikeres positivt. TPR = FPR = 0, punktet (0, 0).
- Terskel 0, «operatøren er supernervøs»: alt predikeres positivt. TPR = FPR = 1, punktet (1, 1).
- Kurven går derfor alltid fra (0, 0) til (1, 1). Når terskelen senkes, beveger vi oss oppover og mot høyre.

**Hva er bra?** Vi vil ha høy TPR og lav FPR. Jo høyere TPR per FPR, jo bedre er modellen, for alle terskler. Den ideelle modellen går rett opp til (0, 1). Myntkast gir diagonalen fra (0, 0) til (1, 1), med AUC = 0,5. En modell er bedre enn tilfeldig hvis kurven ligger over diagonalen og AUC er større enn 0,5. AUC = 1 er perfekt separasjon.

**Tolkningen av AUC.** AUC er sannsynligheten for at modellen gir et tilfeldig valgt positivt punkt høyere predikert verdi enn et tilfeldig valgt negativt punkt. AUC = 0,9 betyr altså 90 % sjanse for riktig rangering av et tilfeldig positivt–negativt par. Det betyr *ikke* 90 % accuracy.

**Regneeksempel.** 60 positive og 80 negative.

| Terskel | TP | FN | FP | TN | TPR | FPR |
|---|---|---|---|---|---|---|
| 0,4 | 45 | 15 | 24 | 56 | 0,75 | 0,30 |
| 0,8 | 27 | 33 | 4 | 76 | 0,45 | 0,05 |

Den høye terskelen gir punktet (0,05; 0,45) nede til venstre, den lave gir (0,30; 0,75) lenger opp til høyre. Lavere terskel gir alltid flere positive prediksjoner, så både TPR og FPR øker (eller står stille).

**Precision–recall.** Når terskelen justeres, er det en tradeoff mellom precision og recall: når den ene øker, synker den andre (for samme modell). I eksempelet over gir terskel 0,8 precision $27/31 \approx 0{,}87$ og recall 0,45, mens terskel 0,4 gir precision $45/69 \approx 0{,}65$ og recall 0,75.

F2 formulerer det slik: på ROC-kurven er det ingen målkonflikt, for vi vil alltid ha lav FPR og høy TPR. Konflikten oppstår mellom de to metrikkene vi begge vil ha høye, precision og recall.

- Er falsk alarm dyr (utrykning, utvisning): prioriter høy precision.
- Er det dyrt å overse et positivt tilfelle (alvorlig sykdom, hvitvasking): prioriter høy recall.
- Precision = recall når $FP = FN$, fordi de har samme teller.
- Precision avhenger av klassefordelingen. Recall gjør det ikke, siden den bare bruker de positive.

**I kode.**

```python
prob_predictions = log_reg.predict_proba(X_test)     # sannsynligheter, ikke klasser
fpr, tpr, thresholds = metrics.roc_curve(y_test, prob_predictions, pos_label=1)
auc = metrics.roc_auc_score(y_test, prob_predictions)
```

### Formler

$$
\hat{y}_{\text{klasse}} =
\begin{cases}
1 & \text{hvis } y_{\text{pred}} > \tau \\
0 & \text{ellers}
\end{cases}
$$

$$
\text{AUC} = P\bigl(f(\mathbf{x}_+) > f(\mathbf{x}_-)\bigr)
$$

- $\tau$ er terskelen.
- $\mathbf{x}_+$ og $\mathbf{x}_-$ er et tilfeldig valgt positivt og negativt datapunkt.

### Sammenhenger

- ROC-kurven bruker TPR og FPR, som er rater innad i hver klasse. Precision–recall-kurven bruker precision, som avhenger av klassefordelingen. Med svært ubalanserte data sier precision–recall-kurven derfor ofte mer om hvordan alarmene vil oppleves.
- Terskelvalget er der anvendelsen kommer inn. Modellen er den samme, men sykehuset og politiet bør velge ulik terskel.
- AUC oppsummerer modellen over alle terskler. Accuracy, precision og recall gjelder én terskel.

### Vanlige misforståelser

- «Diagonalen er en middels god modell.» Diagonalen er tilfeldig gjetning.
- «Diagonalen betyr at modellen predikerer 0,5 for alt.» Den betyr at modellen ikke skiller klassene bedre enn tilfeldig, uansett hvilke tall den gir.
- «Diagonalen tilsvarer terskel 0,5.» Hvert punkt på kurven er en terskel. Diagonalen er en hel kurve.
- «Lav AUC betyr lav precision.» AUC handler om rangering over alle terskler, ikke om precision ved én terskel.
- «AUC = 0,9 betyr 90 % riktige.» AUC er en rangeringssannsynlighet.
- «Punktet øverst til høyre har høyest terskel.» Det har *lavest* terskel.

### Eksamensoppsummering

- Kunne plassere confusion matrices for ulike terskler som punkter på ROC-kurven.
- Vite at kurven går fra (0, 0) ved høy terskel til (1, 1) ved lav terskel.
- Kunne tolke diagonalen (tilfeldig gjetning, AUC 0,5) og AUC som rangeringssannsynlighet.
- Forklare precision–recall-tradeoffen og velge terskel ut fra kostnaden av feil.
- Vite når precision = recall, og hvilken av dem som avhenger av klassefordelingen.

---

## 1.7 Entropi og cross-entropy {#entropi}

*Kilder: notater 1.2.6, F2.*

### Introduksjon

Hvorfor heter tapsfunksjonen *cross-entropy*? Svaret kommer fra informasjonsteori, og det gir en ny måte å forstå tapet på: som forskjellen mellom den sanne fordelingen av labels og modellens predikerte fordeling. Etter denne delen skal du kunne definere entropi og cross-entropy, regne dem ut for små eksempler og se at binær cross-entropy loss er et spesialtilfelle. Entropi kommer igjen i beslutningstrær (kapittel 2), og KL-divergens i t-SNE (kapittel 6).

### Begreper

- **Entropi (Shannon-entropi) $H$:** et mål på usikkerheten, eller informasjonsmengden, i en tilfeldig variabel. F2 kaller den et mål på tilfeldigheten (støyet) i en fordeling.
- **Fordelingen $p$:** fordelingen observasjonene faktisk kommer fra. I Titanic-eksempelet er det fordelingen av labels i datasettet.
- **Fordelingen $q$:** det vi tror, altså modellens predikerte fordeling.
- **Cross-entropy $H(p, q)$:** måler forskjellen mellom to fordelinger over de samme utfallene. Forventningen tas over $p$, mens logaritmen er av $q$.
- **One-hot-label:** for flere klasser er $\mathbf{y}$ en vektor med 1 for riktig klasse og 0 ellers.

### Forklaring

**Entropi som overraskelse.** Et utfall med sannsynlighet $p(x)$ har «overraskelse» $\log\frac{1}{p(x)}$. Sjeldne utfall overrasker mye, sikre utfall ikke i det hele tatt. Entropien er den forventede overraskelsen.

- En rettferdig mynt ($p = 0{,}5$) har maksimal usikkerhet: $H = 1$ bit (med $\log_2$).
- En skjev mynt med $p = 0{,}9$ har $H = -(0{,}9\log_2 0{,}9 + 0{,}1\log_2 0{,}1) \approx 0{,}47$ bit.
- En mynt som alltid gir krone, har $H = 0$. Ingen usikkerhet.

**Cross-entropy som tap.** Observasjonene kommer *alltid* fra $p$, mens modellen tror $q$. Cross-entropy er den forventede overraskelsen når vi koder sannheten med modellens tro. Den er minst når $q = p$. Ved trening vil vi derfor gjøre forskjellen mellom de to fordelingene så liten som mulig.

For binær klassifisering har ett datapunkt $p = (y,\ 1 - y)$ og $q = (y_{\text{pred}},\ 1 - y_{\text{pred}})$. Setter vi inn i $H(p, q)$, får vi nøyaktig binær cross-entropy loss fra 1.3. Tapsfunksjonen og informasjonsteorien er altså samme sak sett fra to sider.

**Flere klasser.** Med one-hot-labels er bare ett ledd i summen ulikt null, så tapet blir $-\log$ av sannsynligheten modellen gir den riktige klassen. Gir modellen $\hat{\mathbf{y}} = (0{,}7;\ 0{,}2;\ 0{,}1)$ og riktig klasse er den første, blir tapet $-\ln 0{,}7 \approx 0{,}36$.

### Formler

Entropi:

$$
H(X) = \mathbb{E}\!\left[\log\frac{1}{p(X)}\right] = -\sum_{x \in X} p(x)\log p(x), \qquad H(p) = -\sum_i p(x_i)\log p(x_i)
$$

Cross-entropy:

$$
H(p, q) = -\sum_i p(x_i)\log q(x_i)
$$

Cross-entropy loss for flere klasser, der summen går over klassene $i$:

$$
\mathcal{L}(\hat{\mathbf{y}}, \mathbf{y}) = -\sum_i y_i \log \hat{y}_i
$$

- $p(x_i)$ er den sanne sannsynligheten for utfall $i$, og $q(x_i)$ er modellens.
- Grunntallet i logaritmen bestemmer enheten: $\log_2$ gir bits, $\ln$ gir nats. For optimering spiller det ingen rolle.
- Hatt ($\hat{y}$) brukes for prediksjonen for å unngå dobbel fotskrift.

### Sammenhenger

- Binær cross-entropy (1.3) = $H(p, q)$ med to utfall = minus log-likelihood.
- Entropi brukes som urenhetsmål i beslutningstrær, og informasjonsgevinst er reduksjonen i entropi (kapittel 2).
- KL-divergens, som t-SNE minimerer, er forskjellen mellom cross-entropy og entropi: $D_{KL}(p \,\|\, q) = H(p, q) - H(p)$ (kapittel 6).
- Kurset sier at multiclass-klassifisering ikke studeres i dybden. Formelen for flere klasser er likevel med i notatene og F2, og softmax-output i nevrale nett bruker den (kapittel 5).

### Vanlige misforståelser

- «$H(p, q) = H(q, p)$.» Cross-entropy er ikke symmetrisk. Forventningen tas over den sanne fordelingen.
- «Cross-entropy måler likhet.» Den måler forskjell, og er minst når fordelingene er like.
- «Entropi er størst når én klasse dominerer.» Entropi er størst når alle utfall er like sannsynlige.

### Eksamensoppsummering

- Kunne formlene for $H(p)$ og $H(p, q)$ og vite hva $p$ og $q$ står for.
- Regne entropi for en mynt eller en enkel fordeling.
- Vise at binær cross-entropy loss er $H(p, q)$ med to utfall.
- Kunne tapet for flere klasser, $-\sum_i y_i \log \hat{y}_i$.
