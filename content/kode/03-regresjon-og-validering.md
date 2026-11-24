---
kapittel: 3
tittel: Regresjon, validering og regresjonstrær
ingress: 'Lineær regresjon med gradient descent (øving 1), polynomiske features, treningsløkker som følger med på valideringstapet, kryssvalidering og regresjonstrær.'
---

## Lineær regresjon med gradient descent {#linear-regresjon}

*Pensum: 3.1 · Kilder: notater 1.4.1 (likning 52–57), øving 1 (`LinearRegression.fit` og `predict`)*

```python
def fit(self, X, y):
    self.w = np.zeros(X.shape[1])
    self.b = 0.0
    for _ in range(self.n_iterations):
        y_pred = X @ self.w + self.b                 # ingen sigmoid: kontinuerlig output
        grad_w = X.T @ (y_pred - y) / len(y)
        grad_b = np.mean(y_pred - y)
        self.w -= self.lr * grad_w
        self.b -= self.lr * grad_b
        self.loss_history.append(np.mean((y - y_pred) ** 2) / 2)

def predict(self, X):
    return X @ self.w + self.b
```

#### Hva koden gjør

Notatene definerer MSE med en faktor $\tfrac12$ som forsvinner når vi deriverer:

$$
\text{MSE} = \frac{1}{2N}\sum_{i=1}^{N}\left(y^{(i)} - f(\mathbf{x}^{(i)})\right)^2, \qquad \frac{\partial L}{\partial \beta_0} = \frac{1}{N}\sum_i \left(f(\mathbf{x}^{(i)}) - y^{(i)}\right), \qquad \frac{\partial L}{\partial \beta_1} = \frac{1}{N}\sum_i x^{(i)}\left(f(\mathbf{x}^{(i)}) - y^{(i)}\right).
$$

Legg merke til at koden er nesten lik logistisk regresjon i kapittel 1. Gradienten har samme form, $(y_{\text{pred}} - y)\,x_j$. Det som er annerledes, er at det ikke er noen sigmoid, og at tapet er MSE i stedet for cross-entropy.

En kontroll fra notatene: hvis modellen overestimerer for alle $x$, er $\beta_0$ for stor, og $\partial L / \partial \beta_0 > 0$. Oppdateringen trekker da $\beta_0$ ned.

#### Fallgruver

- Cross-entropy kan ikke brukes som tap her, siden target ikke er en sannsynlighet. Det var svaret på notatenes «hva kan vi ikke gjenbruke fra klassifiseringen?».
- Med eller uten faktoren $\tfrac12$ er begge vanlige definisjoner av MSE. Uten den får gradienten en ekstra faktor 2.
- Er featurene av svært ulik størrelse, går gradient descent tregt eller divergerer. Skaler først.
- MSE har samme enhet som $y^2$, så om en MSE er «stor», kommer an på størrelsen på targetene (notatene: MSE rundt 960 når targetene er rundt 30).

## Polynomiske features {#polynomiske-features}

*Pensum: 3.2 · Kilder: notater 1.4.2*

```python
from sklearn.preprocessing import PolynomialFeatures

poly = PolynomialFeatures(degree=2, include_bias=False)
X_train_p = poly.fit_transform(X_train)      # x -> (x, x^2)
X_test_p = poly.transform(X_test)
model = LinearRegression().fit(X_train_p, y_train)
```

#### Hva koden gjør

Ligger dataene på en parabel, fungerer lineær regresjon dårlig. Løsningen er feature engineering: vi lager en ny feature $x^2$ og gjør *fortsatt lineær regresjon*, nå med to features:

$$
y = \beta_0 + \beta_1 x_1 + \beta_2 x_2, \qquad x_1 = x,\ x_2 = x^2.
$$

Modellen er lineær i parametrene, selv om den er ikke-lineær i $x$. Graden er en hyperparameter: for lav grad gir høy bias, for høy grad gir overtilpasning.

#### Fallgruver

- Notatene sier eksplisitt at transformasjonen ikke skal tilpasses (`.fit`) på testdataene. For `PolynomialFeatures` gir det riktignok samme resultat, fordi den bare lærer antall input-features, men vanen er farlig: gjør du det samme med en scaler eller PCA, får testdataene egne parametre.
- Graden er ikke en modellparameter (den læres ikke av gradient descent) og ikke en feature. Den er en hyperparameter som velges med valideringsdata.
- Antall features vokser fort med grad og antall input-features, og det øker faren for overtilpasning.

## Treningsløkke med valideringstap {#valideringstap}

*Pensum: 3.3 · Kilder: notater 1.4.3*

```python
model = SGDRegressor(learning_rate="constant", eta0=0.01)
train_losses, val_losses = [], []
for epoch in range(100):
    model.partial_fit(X_train, y_train)                    # én runde SGD
    train_losses.append(mean_squared_error(y_train, model.predict(X_train)))
    val_losses.append(mean_squared_error(y_val, model.predict(X_val)))
```

#### Hva koden gjør

`partial_fit` gjør én runde med stokastisk gradient descent over dataene, i stedet for å trene til konvergens som `fit`. Etter hver runde lagres tapet både på treningsdata og valideringsdata, slik at vi kan plotte de to kurvene og se hvordan modellen utvikler seg:

| Kurvene | Tolkning |
|---|---|
| Treningstapet synker, valideringstapet flater ut eller øker | Overtilpasning, for høy kompleksitet |
| Begge er høye og flate | Undertilpasning, for lav kompleksitet |
| Begge synker og flater ut på omtrent samme nivå | God tilpasning |

#### Fallgruver

- Valideringsdata, ikke testdata, brukes i løkka. Bruker du testdata til å bestemme når du stopper, er testen ikke lenger uavhengig.
- Det endelige treningstapet alene sier lite om hvor godt modellen generaliserer.
- `learning_rate="constant"` og `eta0` er læringsraten, altså hyperparametre, ikke modellparametre.

## Kryssvalidering {#kryssvalidering}

*Pensum: 3.4 · Kilder: notater 1.4.4, øving 2*

```python
idx = np.random.default_rng(0).permutation(len(X_train))
folds = np.array_split(idx, 5)                       # fem ikke-overlappende deler
scores = []
for i in range(5):
    val = folds[i]
    tren = np.concatenate([folds[j] for j in range(5) if j != i])
    model.fit(X_train[tren], y_train[tren])
    scores.append(model.score(X_train[val], y_train[val]))
# Samme som cross_val_score(model, X_train, y_train, cv=5)
```

#### Hva koden gjør

I $k$-fold kryssvalidering deles treningsdataene i $k$ like store, ikke-overlappende deler. Modellen trenes $k$ ganger, hver gang på $k - 1$ deler og evalueres på den siste. Hvert datapunkt brukes til validering nøyaktig én gang. Snittet av de $k$ skårene er et mer stabilt estimat enn én enkelt valideringssplitt, og standardavviket sier hvor mye resultatet varierer. Med $k = N$ får vi leave-one-out (LOOCV).

#### Fallgruver

- Kryssvalidering deler i ikke-overlappende delsett. Bootstrapping trekker med tilbakelegging og kan gi overlapp (H24 oppgave 18).
- Modellen må trenes på nytt for hver fold. Gjenbruker du en modell som allerede er trent på alt, måler du ikke noe nyttig.
- Kryssvalidering gjøres på treningsdataene. Testdataene holdes utenfor.
- LOOCV gir $N$ treninger og er dyrt for store datasett.

## Regresjonstrær {#regresjonstre}

*Pensum: 3.6 · Kilder: notater 1.4.6 (stegdataene med `np.floor`)*

```python
def f_true(x):
    return np.floor(x)

X_data = np.linspace(-3, 3, 100).reshape(-1, 1)          # sklearn vil ha form (n, 1)
y_data = f_true(X_data).ravel() + np.random.normal(0, 0.1, 100)
X_train, X_test, y_train, y_test = train_test_split(X_data, y_data)
reg = DecisionTreeRegressor().fit(X_train, y_train)
print(reg.get_depth(), reg.get_n_leaves(), mean_squared_error(y_test, reg.predict(X_test)))
```

#### Hva koden gjør

Et regresjonstre deler input-rommet i regioner og predikerer én verdi per region: snittet av targetene i løvnoden. Prediksjonen blir derfor en trappefunksjon. Splitten velges slik at variansen (eller MSE) i targetene etter splitten blir minst mulig.

Dataene er noen få trinn, så et tre med noen få splitter ville vært nok. Uten `max_depth` vokser treet til hvert løv har svært få punkter. Notatene viser at sklearn da gjerne lager et tre med dybde 12 og 85 noder, som tilpasser seg støyen.

#### Fallgruver

- `reshape(-1, 1)` er nødvendig fordi sklearn vil ha `X` som en matrise med én kolonne, også når det er én feature.
- Treet velger splitten med *lavest* varians etter splitt (H25 del 4 spørsmål 4).
- Et regresjonstre kan ikke predikere verdier utenfor området til targetene det har sett, og det ekstrapolerer ikke.
- Treningsfeil nær 0 med et dypt tre er et tegn på overtilpasning, ikke på en god modell.
