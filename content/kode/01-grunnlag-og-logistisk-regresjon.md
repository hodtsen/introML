---
kapittel: 1
tittel: Data, preprosessering og logistisk regresjon
ingress: 'Fra rådata til en trent logistisk regresjon og metrikkene du evaluerer den med. Dette er kapittelet med flest kodespørsmål på tidligere eksamener: skalering og cross-entropy i NumPy.'
---

## Rydde data med pandas og sklearn {#rydde-data}

*Pensum: 1.1 · Kilder: notater 1.1 og 1.3.4 (Titanic og Palmer Penguins), eksamen 2025 del 1*

```python
df = df[["Pclass", "Sex", "Age", "Survived"]].dropna()   # velg kolonner, fjern rader med hull
df["Sex"] = LabelEncoder().fit_transform(df["Sex"])     # "female"/"male" -> 0/1
X = df[["Pclass", "Sex", "Age"]].values                 # features, form (n, 3)
y = df["Survived"].values                               # target, form (n,)
```

#### Hva koden gjør

Dette er preprosesseringen notatene gjør før Titanic-dataene plottes og modelleres. Vi velger ut kolonnene vi vil bruke, fjerner rader der minst én verdi mangler (`dropna`), og gjør den kategoriske featuren `Sex` om til tall med en `LabelEncoder`, som gir hver kategori et eget heltall. Til slutt skilles features `X` fra target `y`.

`PassengerId` og `Name` tas ikke med: de sier ingenting om passasjeren som modellen kan bruke, og `PassengerId` er i praksis tilfeldig.

#### Fallgruver

- `dropna()` fjerner hele *rader*, ikke bare den tomme cellen. Mangler mange rader én verdi, kan du miste mye data.
- Kategoriske features som er strenger, må gjøres om til tall før de kan brukes i en modell som logistisk regresjon (spørsmål 1.1 på H25). Man fjerner dem ikke.
- `LabelEncoder` gir tallene $0, 1, 2, \dots$, som en lineær modell tolker som en rekkefølge. Det er greit for binære features og for beslutningstrær, men for en kategori med mange verdier kan en one-hot-koding være bedre (det brukes for tilstandene i DQN-eksempelet i notatene).
- Target skal ikke skaleres eller normaliseres for klassifisering. «Normaliser Converted slik at gjennomsnittet er 0» var et feilalternativ på H25.

## Splitte i trenings-, validerings- og testdata {#splitte-data}

*Pensum: 3.3, 1.1 · Kilder: notater 1.2.3 og 1.4.3, eksamen 2025 del 10 spørsmål 3*

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)
X_train, X_val, y_train, y_val = train_test_split(X_train, y_train, test_size=0.25, random_state=0)
# 80 % -> 60 % trening + 20 % validering, og 20 % test
```

#### Hva koden gjør

`train_test_split` deler data tilfeldig i to. Notatene bruker den to ganger for å få tre uavhengige sett: treningsdata tilpasser parametrene, valideringsdata brukes til å følge treningen og velge hyperparametre, og testdata brukes bare én gang til slutt for å rapportere ytelsen.

Andre kall deler de 80 % som er igjen. `test_size=0.25` av 80 % er 20 % av hele datasettet, så fordelingen blir 60/20/20.

#### Fallgruver

- Returverdiene kommer i rekkefølgen `X_train, X_test, y_train, y_test`: begge X-ene først, så begge y-ene. Bytter du om, trener du på feil data uten feilmelding.
- `test_size` i andre kall er en andel av det som er igjen, ikke av hele datasettet.
- Testdataene skal ikke brukes til å velge hyperparametre eller stoppe treningen. Da har du ingen usette data igjen til den endelige testen.
- `random_state` gjør splitten lik hver gang. Uten den får du nye tall hver kjøring, som gjør det vanskelig å sammenligne modeller (og reproduserbarhet ble etterspurt i øving 3).

## Skalere med parametre fra treningsdataene {#skalering}

*Pensum: 1.1, 3.2 · Kilder: notater 1.1 og 1.4.2, eksamen 2024 oppgave 4, eksamen 2025 del 1 spørsmål 4 og del 10 spørsmål 1*

```python
scaler = MinMaxScaler()                # eller StandardScaler()
scaler.fit(X_train)                    # lærer min og maks per feature fra treningsdata
X_train_s = scaler.transform(X_train)
X_test_s = scaler.transform(X_test)    # samme min og maks brukes på testdata
```

#### Hva koden gjør

Features med svært ulik størrelsesorden (som alder mot kjønn i Titanic) kan gi misvisende plott og treg gradient descent. En scaler regner ut parametre fra treningsdataene og bruker dem på alle data:

$$
x' = \frac{x - \min(x_{\text{train}})}{\max(x_{\text{train}}) - \min(x_{\text{train}})} \quad \text{(MinMaxScaler)}, \qquad x' = \frac{x - \mu_{\text{train}}}{\sigma_{\text{train}}} \quad \text{(StandardScaler)}
$$

`fit` lærer parametrene, `transform` bruker dem. `fit_transform(X_train)` gjør begge deler i ett kall og er greit på treningsdata.

#### Fallgruver

- `scaler.fit_transform(X_test)` eller `StandardScaler().fit_transform(X_test)` lærer nye parametre fra testdata. Da skaleres testdataene annerledes enn treningsdataene, og testen er ikke lenger uavhengig.
- `scaler.fit(X_test)` returnerer scaler-objektet, ikke skalerte data (feilalternativ på H25).
- Å tilpasse scaleren på hele datasettet før splitten lekker informasjon om testdataene inn i treningen (feilalternativ på H25).
- Testverdier kan havne litt utenfor $[0, 1]$ med MinMaxScaler. Det er forventet og ikke en feil.
- Beslutningstrær trenger ikke skalering (se kapittel 2), men det skader ikke.

## Sigmoid og prediksjon {#sigmoid}

*Pensum: 1.2 · Kilder: notater 1.2 og 1.2.3, øving 1 (`LogisticRegression.sigmoid`, `predict_proba`, `predict`), eksamen 2025 del 10 spørsmål 2*

```python
def sigmoid(z):
    return 1 / (1 + np.exp(-z))

z = np.matmul(X, w) + b                 # samme som X @ w + b, form (n,)
y_pred = sigmoid(z)                     # sannsynligheter i (0, 1)
klasser = (y_pred > 0.5).astype(int)    # notatene: [1 if _y > 0.5 else 0 for _y in y_pred]
```

#### Hva koden gjør

Logistisk regresjon er en lineær modell $z = \mathbf{w}\mathbf{x} + b$ sendt gjennom sigmoid-funksjonen

$$
\sigma(z) = \frac{1}{1 + e^{-z}},
$$

som gjør et hvilket som helst reelt tall om til et tall i $(0, 1)$ som tolkes som sannsynligheten for klasse 1. Med `X` av form `(n, d)` og `w` av form `(d,)` gir `np.matmul(X, w)` ett tall per datapunkt. Klassene får vi først når vi bruker en terskel.

Siden $\sigma(0) = 0{,}5$ og sigmoid er voksende, er `y_pred > 0.5` det samme som `z > 0`.

#### Fallgruver

- `y_pred` etter sigmoid er sannsynligheter, ikke klasser og ikke log-sannsynligheter (H25 del 10).
- `X * w` er elementvis multiplikasjon og gir form `(n, d)`, ikke `(n,)`. Det er `np.matmul` eller `@` du vil ha.
- Notatenes `fit` skriver `np.matmul(self.weights, x.transpose())`. Det gir det samme som `np.matmul(x, self.weights)`, bare skrevet med vektoren først.
- `np.exp(z)` uten minus gir $1/(1 + e^{z}) = 1 - \sigma(z)$, altså sannsynligheten for feil klasse.

## Binær og vektet cross-entropy i NumPy {#cross-entropy}

*Pensum: 1.3, 2.4 · Kilder: notater 1.2.1, eksamen 2024 oppgave 9, 10 og 11*

```python
def bce(y, y_pred):
    return -np.mean(y * np.log(y_pred) + (1 - y) * np.log(1 - y_pred))

def vektet_bce(y, y_pred, w_0, w_1):     # w_1 for klassen y = 1, w_0 for y = 0
    return -np.mean(w_1 * y * np.log(y_pred) + w_0 * (1 - y) * np.log(1 - y_pred))
```

#### Hva koden gjør

Binær cross-entropy er minus log-likelihood for at modellen gir riktig svar:

$$
L(y_{\text{pred}}, y) = -y \ln y_{\text{pred}} - (1 - y) \ln(1 - y_{\text{pred}}).
$$

For $y = 1$ er bare første ledd med, og tapet er stort når $y_{\text{pred}}$ er nær 0. For $y = 0$ er bare andre ledd med. `np.mean` tar snittet over datapunktene.

I den vektede versjonen ganges hvert ledd med vekten til *sin* klasse. Med ubalanserte klasser gir vi minoritetsklassen størst vekt, omvendt proporsjonalt med antall punkter. På H24 hadde klasse A 9000 punkter og klasse B 1000, og riktig svar var $w_A = 0{,}1$ og $w_B = 1$. Forholdet er det som teller.

#### Fallgruver

- Logaritmen tas av `y_pred`, ikke av `y`. Tre av fire alternativer på H24 oppgave 9 byttet om `y` og `y_pred` eller satte `log(1 - y_pred)` på feil ledd.
- Minustegnet foran: uten det er dette log-likelihood, som skal maksimeres, ikke minimeres.
- Vekten for $y = 1$ hører til leddet med `y * np.log(y_pred)`. På H24 oppgave 10 hadde ett av de gale alternativene riktig formel med vektene på feil ledd, og de to andre byttet i tillegg om `y` og `y_pred`.
- $\ln 0$ er $-\infty$. I praksis klipper man prediksjonene, for eksempel `np.clip(y_pred, 1e-15, 1 - 1e-15)` (standard praksis, ikke fra notatene).

## Gradient descent for logistisk regresjon {#gradient-descent}

*Pensum: 1.4 · Kilder: notater 1.2.2 og 1.2.3 (`fit`, `predict`), øving 1, eksamen 2025 del 1 spørsmål 3*

```python
def fit(self, X, y):
    self.w = np.zeros(X.shape[1])               # én vekt per feature
    self.b = 0.0
    for _ in range(self.epochs):                # full batch: én oppdatering per epoke
        y_pred = sigmoid(X @ self.w + self.b)
        grad_w = X.T @ (y_pred - y) / len(y)    # form (d,)
        grad_b = np.mean(y_pred - y)
        self.w -= self.lr * grad_w
        self.b -= self.lr * grad_b
        self.losses.append(bce(y, y_pred))
```

#### Hva koden gjør

Med cross-entropy og sigmoid blir de deriverte svært enkle (notatene, likning 22 og 25):

$$
\frac{\partial L}{\partial w_j} = (y_{\text{pred}} - y)\, x_j, \qquad \frac{\partial L}{\partial b} = y_{\text{pred}} - y.
$$

`X.T @ (y_pred - y)` regner ut summen over datapunktene for alle $w_j$ samtidig, og vi deler på antall punkter for å få snittet. Oppdateringsregelen er $\theta_{t+1} = \theta_t - \eta \, \partial L / \partial \theta$: vi går *mot* gradienten fordi den peker i retning av økende tap. Tapet lagres hver epoke slik at vi kan plotte det etterpå.

#### Fallgruver

- `+=` i stedet for `-=` (eller `y - y_pred` i stedet for `y_pred - y`) gir gradient *ascent*: tapet øker fra epoke til epoke.
- `X @ (y_pred - y)` har feil form. Det er `X.T` som har én rad per feature.
- For høy læringsrate får tapet til å oscillere eller eksplodere (H25 del 1 spørsmål 3). For lav læringsrate gir svært treg trening.
- Glemmer du å dele på `len(y)`, blir steget proporsjonalt med antall datapunkter, og læringsraten må endres hver gang datasettet endrer størrelse.
- Nullinitialisering er greit her fordi tapet er konvekst. I nevrale nett initialiseres vektene tilfeldig.

## Confusion matrix og metrikker for hånd {#metrikker}

*Pensum: 1.5 · Kilder: notater 1.2.4 (tabell 4), øving 2 problem 1 («implement the metrics presented in the lectures»), eksamen 2024 oppgave 5 og 7*

```python
tp = np.sum((y_pred == 1) & (y_true == 1))
tn = np.sum((y_pred == 0) & (y_true == 0))
fp = np.sum((y_pred == 1) & (y_true == 0))
fn = np.sum((y_pred == 0) & (y_true == 1))

accuracy = (tp + tn) / len(y_true)          # = np.mean(y_pred == y_true)
recall = tp / (tp + fn)                     # TPR, sensitivitet
fpr = fp / (fp + tn)                        # 1 - spesifisitet
precision = tp / (tp + fp)
```

#### Hva koden gjør

Hver linje teller én celle i confusion matrix ved å kombinere to boolske arrayer med `&` og summere antall `True`. Metrikkene er forholdstall mellom cellene:

$$
\text{TPR} = \frac{TP}{TP + FN}, \quad \text{FPR} = \frac{FP}{FP + TN}, \quad \text{presisjon} = \frac{TP}{TP + FP}.
$$

En nyttig huskeregel: recall og FPR deler på det som *faktisk* er positivt eller negativt, presisjon deler på det som er *predikert* positivt.

#### Fallgruver

- Parentesene rundt hver sammenligning er nødvendige. `&` binder sterkere enn `==` i Python, så `y_pred == 1 & y_true == 1` betyr noe helt annet og gir som regel en feilmelding for arrayer.
- FPR deler på alle faktiske negative ($FP + TN$), ikke på $FP + TP$.
- Høy accuracy betyr lite med ubalanserte klasser: en modell som alltid sier «frisk», får 99 % accuracy når 1 % er syke.
- Hva som er viktigst, avhenger av kostnaden ved feil: mange falske negative er alvorlig ved sykdom (høy recall), mange falske positive er dyrt ved utrykning (høy presisjon), som i H24 oppgave 7.

## Terskel, predict_proba og ROC {#terskel-roc}

*Pensum: 1.6 · Kilder: notater 1.2.5, eksamen 2024 oppgave 5 og 6*

```python
proba = model.predict_proba(X_test)[:, 1]     # P(y = 1) for hvert testpunkt
y_pred = (proba >= 0.3).astype(int)           # lavere terskel: flere predikert positive

fpr, tpr, terskler = roc_curve(y_test, proba) # ett (FPR, TPR)-punkt per terskel
auc = roc_auc_score(y_test, proba)
```

#### Hva koden gjør

`predict_proba` gir én kolonne per klasse, og kolonne 1 er sannsynligheten for positiv klasse. Klassene avhenger av terskelen vi velger. ROC-kurven får vi ved å gå gjennom mange terskler fra 1 til 0 og regne ut FPR og TPR for hver. Terskel 1 gir punktet $(0, 0)$, terskel 0 gir $(1, 1)$. ROC AUC er sannsynligheten for at modellen rangerer et tilfeldig positivt punkt høyere enn et tilfeldig negativt.

`roc_curve` og `roc_auc_score` fra `sklearn.metrics` gjør dette for deg. De står ikke i notatene, men er standard.

#### Fallgruver

- `predict_proba(X)` har form `(n, 2)`. Glemmer du `[:, 1]`, får du begge kolonnene.
- ROC og AUC skal regnes på sannsynligheter. Med `model.predict(X_test)` har du bare to verdier, 0 og 1, og ROC-kurven får bare ett punkt mellom endepunktene.
- Lavere terskel øker *både* TPR og FPR. Det er en avveining, ikke en ren forbedring.
- AUC 0,9 betyr ikke 90 % accuracy (H24 oppgave 6).
