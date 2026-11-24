---
kapittel: 4
tittel: Ensembler – bagging, random forest og boosting
ingress: 'Bootstrap-trekning, ensemblemodellene i sklearn og gradient boosting skrevet ut for hånd. Hyperparametrene og hva de styrer er det viktigste å kjenne igjen.'
---

## Bootstrap-trekning {#bootstrap}

*Pensum: 4.2 · Kilder: notater 1.5.1, eksamen 2025 del 3 spørsmål 1*

```python
rng = np.random.default_rng(0)
n = len(X_train)
idx = rng.choice(n, size=n, replace=True)        # trekk n punkter med tilbakelegging
X_boot, y_boot = X_train[idx], y_train[idx]
oob = np.setdiff1d(np.arange(n), idx)            # punktene som aldri ble trukket
```

#### Hva koden gjør

Et bootstrap-utvalg er like stort som det opprinnelige datasettet, men trukket med tilbakelegging. Noen punkter kommer med flere ganger og andre ikke i det hele tatt. I bagging trenes hver modell på sitt eget bootstrap-utvalg, så modellene blir ulike, og snittet (regresjon) eller flertallsstemmen (klassifisering) får lavere varians enn hver modell alene.

Sannsynligheten for at et bestemt punkt aldri trekkes, er

$$
\left(1 - \frac{1}{n}\right)^n \approx e^{-1} \approx 0{,}37,
$$

så hvert utvalg inneholder i snitt omtrent 63 % av de unike punktene (standard sannsynlighetsregning, ikke fra notatene).

#### Fallgruver

- `replace=True` er hele poenget. Uten tilbakelegging og med `size=n` får du bare de samme punktene i ny rekkefølge.
- Bootstrapping øker variasjonen *mellom* modellene, den reduserer ikke bias (H25 del 3 spørsmål 1).
- Isolation forest trekker derimot sine utvalg *uten* tilbakelegging (notatene 3.3.3).

## Ensemblene i sklearn {#ensembler-sklearn}

*Pensum: 4.3, 4.4, 4.5 · Kilder: notater 1.5, øving 2 (`AdaBoostClassifier`), prosjekt 4 XAI (`GradientBoostingRegressor`)*

```python
from sklearn.ensemble import (RandomForestClassifier, AdaBoostClassifier,
                              GradientBoostingRegressor)

rf = RandomForestClassifier(n_estimators=100, max_features="sqrt", random_state=0)
ada = AdaBoostClassifier(n_estimators=50, random_state=0)
gb = GradientBoostingRegressor(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=0)
for model in (rf, ada):
    model.fit(X_train, y_train)
```

#### Hva koden gjør

| Modell | Hvordan modellene lages | Viktigste hyperparametre |
|---|---|---|
| Random forest | Parallelt: hvert tre på sitt bootstrap-utvalg, og bare et tilfeldig utvalg features vurderes i hver splitt | `n_estimators` (antall trær), `max_features` (features per splitt), `max_depth` |
| AdaBoost | Sekvensielt: punkter som ble feilklassifisert, får større vekt i neste runde | `n_estimators`, `learning_rate` |
| Gradient boosting | Sekvensielt: hvert nytt tre tilpasses pseudo-residualene til ensemblet så langt | `n_estimators`, `learning_rate`, `max_depth` |

Både bootstrap-utvalgene og det tilfeldige feature-utvalget i random forest skal gjøre trærne mindre korrelerte, slik at gjennomsnittet blir mer robust (H25 del 3 spørsmål 2).

#### Fallgruver

- Flere trær i en random forest gir ikke mer overtilpasning, bare lengre kjøretid. I boosting kan for mange runder derimot overtilpasse, fordi hvert tre retter på feilene til de forrige.
- AdaBoost øker vekten på de *feilklassifiserte* punktene, ikke de riktige (H25 del 3 spørsmål 3).
- Random forest-trær trenes uavhengig og kan trenes parallelt. Boosting må trenes ett tre av gangen.
- Hyperparametre som `n_estimators` og `max_depth` velges med validering eller kryssvalidering, ikke med testdata.

## Gradient boosting skrevet ut {#gradient-boosting}

*Pensum: 4.5 · Kilder: notater 1.5.2, eksamen 2024 oppgave 17, eksamen 2025 del 3 spørsmål 4*

```python
F = np.full(len(y), y.mean())                 # start: konstant prediksjon
trær = []
for m in range(M):
    r = y - F                                 # pseudo-residualer (negativ gradient av MSE)
    tre = DecisionTreeRegressor(max_depth=2).fit(X, r)
    F = F + eta * tre.predict(X)              # lite steg i retning av residualene
    trær.append(tre)
```

#### Hva koden gjør

Hvert nytt tre lærer det ensemblet så langt ikke klarte å forklare: forskjellen mellom target og nåværende prediksjon. Notatene skriver læringsregelen som

$$
\text{nytt ensemble} = \text{forrige ensemble} - \eta \cdot \text{nytt tre},
$$

der det nye treet tilpasses gradienten $-(y - \hat{y})$. Det er det samme som koden over: å trekke fra $\eta$ ganger et tre som predikerer $\hat{y} - y$, er å legge til $\eta$ ganger et tre som predikerer $y - \hat{y}$. Navnet kommer av at dette er gradient descent i rommet av mulige trær i stedet for i parameterrommet.

Ved prediksjon på nye data summeres startverdien og alle trærne, ganget med $\eta$.

#### Fallgruver

- Hvert tre trenes på residualene, ikke på de opprinnelige targetene. Bruker du `y` i stedet for `r`, lærer alle trærne det samme.
- Alle trærne trenes ikke samtidig (feilalternativ på H24).
- Læringsraten $\eta$ er en hyperparameter. Lav $\eta$ krever flere trær, men gir ofte bedre generalisering.
- Gradientens verdi sier ingenting om hvor mange trær som skal legges til (feilalternativ på H24).
