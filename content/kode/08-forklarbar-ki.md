---
kapittel: 8
tittel: Forklarbar KI – SHAP og LIME
ingress: 'Hvordan SHAP-verdier regnes ut og plottes, hva bakgrunnsdataene gjør, og hvordan LIME brukes. Prosjekt 4 XAI og notatene bruker de samme kallene.'
---

## SHAP for tabelldata {#shap}

*Pensum: 8.4 · Kilder: notater 5.2.2 (California housing med XGBoost), prosjekt 4 XAI problem 1, eksamen 2024 oppgave 35*

```python
background = X_train.sample(100, random_state=0)          # bakgrunnsdatasett
explainer = shap.Explainer(model, background)             # TreeExplainer for trær
shap_values = explainer(X_test)                           # én verdi per feature per punkt

shap.plots.beeswarm(shap_values)                          # globalt bilde
shap.plots.waterfall(shap_values[0])                      # ett punkt forklart
shap.plots.bar(shap_values)                               # snitt av |SHAP| per feature

pred = shap_values.base_values[0] + shap_values.values[0].sum()   # = model.predict(X_test)[0]
```

#### Hva koden gjør

SHAP fordeler én prediksjon på featurene med Shapley-verdier. For en feature som «mangler» i en koalisjon, settes verdien inn fra bakgrunnsdatasettet, og prediksjonene snittes. Resultatet er additivt:

$$
f(\mathbf{x}^*) = \phi_0 + \sum_{j=1}^{M} \phi_j^*, \qquad \phi_0 = E[f(\mathbf{x})],
$$

der $\phi_0$ (`base_values`, `expected_value`) er snittprediksjonen over bakgrunnsdataene. Siste linje i koden sjekker dette.

| Plott | Hva det viser |
|---|---|
| Force plot / waterfall | Ett datapunkt: hvordan hver feature drar prediksjonen fra $\phi_0$ til $f(\mathbf{x}^*)$. Rødt drar opp, blått drar ned. |
| Beeswarm | Alle testpunktene: ett punkt per datapunkt og feature. x-aksen er SHAP-verdien, fargen er *featureverdien* (rød høy, blå lav). Featurene er sortert etter snitt av $\lvert\phi\rvert$. |
| Bar | Snitt av $\lvert\phi\rvert$ per feature, en global viktighet. |

`TreeExplainer` regner eksakte verdier for trær og skoger, `KernelExplainer` er helt modellagnostisk, og `DeepExplainer`/`GradientExplainer` er laget for nevrale nett.

#### Fallgruver

- SHAP-verdier er lokale: de forklarer én prediksjon. Beeswarm og bar setter mange lokale forklaringer sammen, men beskriver modellen bare i de punktene.
- Fargen i beeswarm er featureverdien, ikke retningen på effekten. Retningen leser du av x-aksen. Er høye verdier (røde) til venstre, trekker høye verdier prediksjonen ned (H24 oppgave 35 om `Pclass`).
- Valget av bakgrunnsdata endrer $\phi_0$ og dermed alle SHAP-verdiene. Å trekke inn verdier fra andre punkter antar også uavhengige features, så korrelerte features kan gi kombinasjoner modellen aldri har sett.
- En stor koeffisient i en lineær modell betyr ikke stor betydning hvis featuren nesten ikke varierer. SHAP tar med spredningen i dataene, koeffisientene gjør ikke (prosjekt 4 XAI).

#### Fra øvingene

- Prosjekt 4: for den lineære modellen var koeffisientene og SHAP uenige om hvilke features som var viktigst. Koeffisientene avhenger av skalaen, mens SHAP-verdien $\beta_j (x_j - \bar{x}_j)$ tar med hvor mye featuren faktisk varierer.
- For boosting-modellen hadde noen features (typisk breddegrad og lengdegrad) ikke-monoton sammenheng med SHAP-verdien, noe en lineær modell aldri kan få. Se med `shap.plots.scatter`.
- «Blind for MedInc»: trekk fra featurens bidrag, $f(\mathbf{x}) - \phi_{\text{MedInc}}$. Det er ikke det samme som å trene en ny modell uten featuren.

## SHAP for nevrale nett og bilder {#shap-deep}

*Pensum: 8.4 · Kilder: notater 5.2.3, prosjekt 4 XAI problem 2 (MNIST og `encrypted_image`)*

```python
background = X_train[rng.choice(len(X_train), 1000, replace=False)]
explainer = shap.DeepExplainer(model, background)
shap_values = explainer.shap_values(X_test[:4])    # én verdi per piksel og per klasse
shap.image_plot(shap_numpy, -X_test_bilder)
```

#### Hva koden gjør

`DeepExplainer` bruker backpropagation gjennom nettet til å anslå SHAP-verdier effektivt, og er derfor laget for nevrale nett. For et bilde får hver piksel én SHAP-verdi *per klasse*. I `image_plot` er hver rad et bilde og hver kolonne en klasse: røde piksler øker sannsynligheten for den klassen, blå minsker den. For store bilder grupperes piksler i superpiksler, som behandles som én feature hver.

I prosjekt 4 var de første 28 pikslene (øverste rad) i 1000 treningsbilder satt til 1, og alle disse bildene hadde fått label 5. Modellen kan da lære snarveien «linje øverst betyr 5». `encrypted_image` er en 2-er med den samme linja, og poenget med oppgaven var å se at modellen gir den høy sannsynlighet for 5, og at SHAP-plottet viser at det er linja, ikke sifferet, som driver prediksjonen.

#### Fallgruver

- `DeepExplainer` er ikke modellagnostisk, den krever et nevralt nett med gradienter. SHAP som metode regnes likevel som modellagnostisk, fordi størrelsen som estimeres ikke avhenger av modellen (notatene 5.2.2).
- Høy sikkerhet i en prediksjon betyr ikke at modellen har rett grunn. Det er nettopp det forklaringen skal avsløre.
- Det er ikke meningsfullt å forklare hver av millioner av piksler hver for seg. Derfor superpiksler.

## LIME {#lime}

*Pensum: 8.5 · Kilder: notater 5.3 (Titanic, Jack og Rose), eksamen 2024 oppgave 34*

```python
from lime.lime_tabular import LimeTabularExplainer

lime_clf = LimeTabularExplainer(X_train, feature_names=features, mode="classification")
X_jack = np.array([3, 1, 21])                       # Pclass, Sex, Age
exp = lime_clf.explain_instance(X_jack, classifier.predict_proba, num_features=3)
exp.as_list()                                       # vektene i den lokale lineære modellen

lime_reg = LimeTabularExplainer(X_train, feature_names=features, mode="regression")
exp = lime_reg.explain_instance(X_jack, regressor.predict, num_features=3)
```

#### Hva koden gjør

LIME forklarer én prediksjon ved å tilpasse en enkel, tolkbar modell $g$ (typisk lineær) til den kompliserte modellen $f$ i et lite nabolag rundt punktet. Den trekker tilfeldige punkter rundt $\mathbf{x}$ basert på statistikken i treningsdataene, lar $f$ predikere på dem, vekter punktene etter nærhet $\pi_{\mathbf{x}}$, og tilpasser $g$:

$$
\arg\min_{g \in G}\ L(f, g, \pi_{\mathbf{x}}) + \Omega(g).
$$

`num_features` begrenser hvor mange features forklaringen får bruke, og holder dermed kompleksiteten $\Omega(g)$ nede. For klassifisering trenger LIME sannsynlighetene fra `predict_proba`, for regresjon den vanlige `predict`.

#### Fallgruver

- LIME gir lokale forklaringer, ikke globale feature importances, og den erstatter ikke modellen (H24 oppgave 34).
- Labelene til nabopunktene er *modellens* prediksjoner, ikke targets fra data. Poenget er at $g$ skal etterligne $f$.
- I klassifiseringsmodus gir `classifier.predict` bare klasser, og LIME trenger sannsynligheter for å tilpasse $g$. Bruk `predict_proba`.
- Nabopunktene trekkes tilfeldig, så to kjøringer på samme punkt kan gi litt ulike forklaringer. Hvor godt $g$ etterligner $f$, må sjekkes.
