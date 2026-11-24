---
tittel: Oversikt
---

## Hvordan kode testes på eksamen

Eksamen er digital og uten hjelpemidler, og du skriver aldri kode selv. Kodespørsmålene er korte: du får noen få linjer og skal velge riktig implementasjon, si hva koden returnerer, eller finne feilen. Det du må kunne, er altså å *lese* kode og kjenne igjen typiske feil, ikke å huske lange programmer.

| Eksamen | Kodespørsmål | Hva som ble testet |
|---|---|---|
| H24 (Inga Strümke) | 3 av 39 oppgaver | Hvilken `Scaler`-linje du bruker på testdata, hvilken NumPy-linje som er binær cross-entropy, og hvilken som er vektet cross-entropy. Alternativene skilte seg på hvor `y` og `y_pred` sto og hvilken vekt som hørte til hvilket ledd. |
| H25 | Del 10, fire av 40 spørsmål | `scaler.transform(X_test)` mot `fit` på testdata, hva `1 / (1 + np.exp(-z))` gir, hvilken funksjon som splitter data, og hvordan du trekker en minibatch fra en replay buffer. |

H24 er nærmest denne eksamenen i stil, siden samme foreleser har kurset nå. Der var kodespørsmålene én linje lange, og feilalternativene var nesten like den riktige: byttet om `y` og `y_pred`, byttet fortegn, eller byttet vekter. Les derfor hver linje tegn for tegn.

Kunngjøringene for 2026 sier at eksamen bare har flervalg, at regneoppgaver gis som svaralternativer, og at feil svar gir minuspoeng, slik at ren gjetting i snitt gir 0. For kode betyr det at det lønner seg å utelukke alternativer: klarer du å se at to av linjene har feil fortegn eller bytter om `y` og `y_pred`, er det verdt å svare. Klarer du ikke å skille noen av dem, gir det ingenting i snitt å gjette.

## Slik bruker du fanen

Kodekortene er sortert etter kapitlene i pensum. Hvert kort har en kort kodesnutt, en forklaring av hva den gjør og hvorfor, og fallgruvene som typisk blir brukt som feilalternativer. Kodesnuttene er hentet fra forelesningsnotatene der det finnes kode der, og ellers fra øvingene og prosjekt 4. Der et kort bruker noe som ikke står i kursmaterialet, står det.

Kodequizen samler alle oppgavene i oppgavebanken som handler om kode. De samme oppgavene dukker også opp i eksamenssimuleringen og teller med i mestringskartet.

## Mønstrene som går igjen

Nesten alle kodespørsmål på tvers av pensum handler om de samme få mønstrene. Kan du disse, er du godt dekket:

1. **`fit` på treningsdata, `transform` eller `predict` på testdata.** Gjelder scalere, `PolynomialFeatures`, PCA og alle modeller. Testdata skal ikke påvirke noe som er lært.
2. **Unntakene er ikke-parametriske metoder.** t-SNE og DBSCAN har ingen `transform` eller `predict` for nye punkter, så de må tilpasses og brukes på samme data (`fit_transform`, `fit_predict`, `labels_`).
3. **Logaritmen tas av prediksjonen, ikke av target.** I cross-entropy er `y` vekten foran logaritmen og `y_pred` står inne i den.
4. **Minus gradienten.** `w = w - lr * grad`. Med pluss går tapet opp.
5. **Shapes.** `X` har form `(n_datapunkter, n_features)`. `X @ w` gir én verdi per datapunkt. Et `Dense`-lag med $n_{\text{inn}}$ inn og $n_{\text{ut}}$ ut har $(n_{\text{inn}} + 1) \cdot n_{\text{ut}}$ parametre.
6. **Sannsynlighet eller klasse?** `sigmoid` og `predict_proba` gir sannsynligheter. Klasser får du først når du bruker en terskel. ROC og LIME for klassifisering trenger sannsynlighetene.
7. **Labelen `-1` betyr outlier.** Både `DBSCAN.labels_` og `IsolationForest.predict` bruker `-1` for avvik.
8. **Q-oppdateringen bruker neste tilstand.** `max` tas over handlingene i $s'$, og fremtidig verdi settes til 0 når episoden er ferdig.

## Huskeliste: funksjoner og hva de returnerer

| Kall | Returnerer | Merk |
|---|---|---|
| `train_test_split(X, y, test_size=0.2)` | `X_train, X_test, y_train, y_test` | Rekkefølgen: alle X først, så alle y. |
| `scaler.fit(X_train)` | selve scaler-objektet | Gir ikke skalerte data. |
| `scaler.transform(X)` / `fit_transform(X)` | skalert array | `fit_transform` bare på treningsdata. |
| `np.matmul(X, w)` eller `X @ w` | form `(n,)` når `w` har form `(d,)` | `X * w` er elementvis og gir `(n, d)`. |
| `model.predict(X)` (sklearn) | klasser (klassifisering) eller tall (regresjon) | Keras' `model.predict` gir sannsynligheter for klassifisering. |
| `model.predict_proba(X)` | form `(n, antall klasser)` | Sannsynlighet for klasse 1: `[:, 1]`. |
| `cross_val_score(model, X, y, cv=5)` | array med 5 skårer | Rapporter snitt ± standardavvik. |
| `KMeans(...).fit(X)` | modellen, med `labels_`, `cluster_centers_`, `inertia_` | `inertia_` minker alltid når $k$ øker. |
| `kmeans.transform(X)` | avstand fra hvert punkt til hver sentroide, form `(n, k)` | `.min(axis=1)` gir avstand til nærmeste. |
| `DBSCAN(eps, min_samples).fit(X).labels_` | én klyngelabel per punkt | `-1` er støy/outlier. Ingen `predict`. |
| `PCA(n_components=2).fit(X_train).transform(X_test)` | form `(n_test, 2)` | |
| `TSNE(...).fit_transform(X)` | form `(n, 2)` | Ingen `transform` for nye punkter. |
| `IsolationForest().fit(X_train).predict(X_test)` | `1` (normal) eller `-1` (anomali) | |
| `env.reset()` | starttilstand (og info) | |
| `env.step(action)` | ny tilstand, reward, done/terminated, (truncated), info | Antall returverdier avhenger av miljøet. |
| `random.sample(buffer, k=32)` | liste med 32 ulike elementer | Uten tilbakelegging. |
| `explainer(X_test)` (SHAP) | SHAP-verdier, én per feature per datapunkt | `.base_values` er gjennomsnittsprediksjonen. |
