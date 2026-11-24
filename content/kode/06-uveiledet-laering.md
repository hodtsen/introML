---
kapittel: 6
tittel: Uveiledet læring – klynging, dimensjonsreduksjon og anomalier
ingress: 'k-means, DBSCAN, PCA, t-SNE og de tre anomalimetodene i sklearn. Det viktigste skillet er hvilke metoder som kan brukes på nye data og hvilke som ikke kan.'
---

## k-means i sklearn og valg av k {#kmeans}

*Pensum: 6.1, 6.2 · Kilder: notater 3.1.1, øving 3 problem 2, eksamen 2025 del 6*

```python
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

inertia, silhouette = [], []
for k in range(2, 11):
    km = KMeans(n_clusters=k, init="k-means++", n_init=10, random_state=0).fit(X)
    inertia.append(km.inertia_)                        # sum av kvadrerte avstander
    silhouette.append(silhouette_score(X, km.labels_)) # i [-1, 1], høyere er bedre

km = KMeans(n_clusters=4, random_state=0).fit(X)
labels, sentroider = km.labels_, km.cluster_centers_
```

#### Hva koden gjør

k-means tilordner hvert punkt til nærmeste sentroide og flytter sentroidene til snittet av punktene sine, til ingenting endrer seg. Tapet den minimerer, er `inertia_`: summen av kvadrerte avstander fra hvert punkt til sentroiden sin (H25 del 6 spørsmål 1). `init="k-means++"` velger startsentroider med sannsynlighet proporsjonal med kvadrert avstand til nærmeste sentroide som allerede er valgt, og `n_init` kjører algoritmen flere ganger fra ulike starter og beholder den beste.

Siden vi ikke har labels, prøver vi flere $k$ og ser på metrikkene. Notatene nevner tre: inertia, silhouette og Calinski–Harabasz.

Notatene anbefaler `MiniBatchKMeans` for store datasett. Notatene skriver `keras.cluster`, men klassen ligger i `sklearn.cluster`.

#### Fallgruver

- `inertia_` blir alltid mindre når $k$ øker, og er 0 når hvert punkt har sin egen sentroide. Du kan ikke velge $k$ ved å finne minimum, men ser etter en knekk («albuen»).
- Ulike metrikker kan foreslå ulike $k$ (H25 del 6 spørsmål 3).
- k-means bruker euklidsk avstand, så features med stor skala dominerer. Skaler først.
- `labels_` er vilkårlige tall. Klynge 0 i én kjøring kan hete klynge 2 i neste, og det er derfor øving 3 målte nøyaktighet uavhengig av hvilket tall hver klynge fikk.
- k-means antar omtrent runde klynger av lik størrelse og fungerer dårlig når avstanden innad i klyngene er større enn mellom dem.

## k-means skrevet ut {#kmeans-numpy}

*Pensum: 6.1 · Kilder: notater 3.1.1 (stegene 4–7)*

```python
C = X[rng.choice(len(X), size=k, replace=False)]                 # k tilfeldige startpunkter
for _ in range(maks_iter):
    d = np.linalg.norm(X[:, None, :] - C[None, :, :], axis=2)    # avstander, form (n, k)
    labels = d.argmin(axis=1)                                    # nærmeste sentroide
    C_ny = np.array([X[labels == j].mean(axis=0) for j in range(k)])
    if np.allclose(C_ny, C):
        break
    C = C_ny
```

#### Hva koden gjør

Dette er stegene i notatene: regn ut den euklidske avstanden fra hvert punkt til hver sentroide, gi hvert punkt den nærmeste, og regn ut nye sentroider som snittet (`np.mean`) av punktene i hver klynge. Gjenta til sentroidene ikke flytter seg. `X[:, None, :] - C[None, :, :]` bruker broadcasting til å lage alle forskjellene mellom punkter og sentroider på én gang.

#### Fallgruver

- `argmin(axis=1)` går over sentroidene for hvert punkt. Med `axis=0` får du nærmeste *punkt* for hver sentroide.
- Sentroiden er snittet over punktene (`axis=0`), ikke over featurene.
- En klynge kan bli tom, og da blir snittet `nan`. Biblioteker håndterer dette, egen kode må gjøre det selv.
- Med tilfeldig initialisering synker sannsynligheten for at alle $k$ startsentroidene havner i hver sin klynge som $k!/k^k$, altså eksponentielt med $k$. Det er grunnen til k-means++.

## DBSCAN {#dbscan}

*Pensum: 6.3, 6.7 · Kilder: notater 3.1.2 og 3.3.2, eksamen 2024 oppgave 27 og 30, eksamen 2025 del 6 spørsmål 4*

```python
from sklearn.cluster import DBSCAN

dbscan = DBSCAN(eps=0.5, min_samples=5).fit(X)
labels = dbscan.labels_                                   # én label per punkt
n_klynger = len(set(labels)) - (1 if -1 in labels else 0)
outliers = labels == -1
```

#### Hva koden gjør

DBSCAN definerer klynger som tette områder. Et punkt er et kjernepunkt hvis det har minst `min_samples` naboer innenfor avstanden `eps` (sklearn teller punktet selv med). Klyngen spres fra kjernepunkt til kjernepunkt, og to punkter havner i samme klynge hvis det går en kjede av punkter mellom dem der hvert steg er kortere enn `eps`. Punkter som ikke nås fra noen kjernepunkter, får label `-1` og er outliers.

Antall klynger bestemmes av dataene og hyperparametrene, ikke av oss.

#### Fallgruver

- `-1` er ikke en klynge. Teller du `len(set(labels))` direkte, får du én for mye når det finnes outliers.
- DBSCAN har ingen `predict` for nye punkter. Den er ikke-parametrisk og må kjøres på alle dataene samtidig, så du kan ikke tilpasse på trening og bruke på test (notatene 3.3.2).
- For liten `eps` gir mange små klynger og mange outliers. For stor `eps` slår klynger sammen (H24 oppgave 30, smilefjeset).
- `eps` og `min_samples` er globale. Har klyngene ulik tetthet, finnes det ofte ingen verdi som passer alle.

## PCA {#pca}

*Pensum: 6.5 · Kilder: notater 3.2.1 (tabell 9, S-kurven og MNIST), eksamen 2024 oppgave 24 og 25*

```python
from sklearn.decomposition import PCA

pca = PCA(n_components=2)
pca.fit(X_train)                                   # finner prinsipalkomponentene
X_test_pca = pca.transform(X_test)                 # form (n_test, 2)
print(pca.explained_variance_ratio_)               # andel varians per komponent
print(np.cumsum(pca.explained_variance_ratio_))    # samlet andel
```

#### Hva koden gjør

PCA finner nye, ortogonale akser (prinsipalkomponentene) som er egenvektorene til kovariansmatrisen til dataene, sortert etter hvor mye varians de forklarer. `n_components` sier hvor mange vi beholder. `transform` projiserer data ned på disse aksene. Siden PCA lager en fast lineær transformasjon, kan den tilpasses på treningsdata og brukes på nye data, akkurat som en scaler.

`explained_variance_ratio_` (standard i sklearn, ikke i notatene) viser hvor stor andel av variansen hver komponent bevarer. Den kumulative summen brukes ofte til å velge antall komponenter.

#### Fallgruver

- `fit` på treningsdata, `transform` på testdata. Notatene bruker `fit_transform` på hele datasettet i det første eksempelet og sier selv at resultatet da ikke kan brukes til å evaluere modellen.
- PCA er en *lineær* metode. MNIST fra 784 til 2 dimensjoner skilles dårlig av PCA, men godt av t-SNE.
- Variansen avhenger av skalaen. En feature målt i gram dominerer en målt i kilo, så skaler først.
- Komponentene er ukorrelerte og fanger ulike deler av variansen. De er ikke de opprinnelige featurene.

## t-SNE {#tsne}

*Pensum: 6.6 · Kilder: notater 3.2.2, eksamen 2024 oppgave 26 og 28, eksamen 2025 del 7 spørsmål 2*

```python
from sklearn.manifold import TSNE

tsne = TSNE(n_components=2, perplexity=30, init="random", random_state=0)
X_embedded = tsne.fit_transform(X)                 # form (n, 2), bare for disse punktene
plt.scatter(X_embedded[:, 0], X_embedded[:, 1], c=y)
```

#### Hva koden gjør

t-SNE regner ut sannsynligheter for at punkter er naboer i det høydimensjonale rommet (gaussisk) og i det lavdimensjonale (t-fordeling), og flytter punktene i det lave rommet med gradient descent slik at KL-divergensen mellom de to fordelingene blir minst mulig:

$$
D_{KL}(P \,\|\, Q) = \sum_x P(x) \log \frac{P(x)}{Q(x)}.
$$

`perplexity` er omtrent hvor mange naboer hvert punkt tar hensyn til. Notatene bruker `perplexity=3` på MNIST-eksempelet, standardverdien i sklearn er 30.

#### Fallgruver

- `TSNE` har ingen `transform`. Den optimaliserer posisjonene til punktene direkte i stedet for å lære en funksjon, så nye punkter krever en ny kjøring på hele datasettet (notatene: «Er det noe rart her?»).
- Derfor kan t-SNE ikke brukes til å lage features for en modell som skal brukes på nye data. Det kan PCA.
- t-SNE er laget for visualisering, ikke klynging eller klassifisering (H24 oppgave 26).
- t-SNE bevarer nabolag, ikke globale avstander. Avstanden mellom to klynger i plottet sier lite.
- Resultatet avhenger av `perplexity` og av tilfeldig initialisering.

## Anomalideteksjon med tre metoder {#anomalier}

*Pensum: 6.7 · Kilder: notater 3.3, eksamen 2024 oppgave 21 og 23, eksamen 2025 del 7 spørsmål 4*

```python
# k-means: avstand til nærmeste sentroide, og en terskel
distances = kmeans.transform(X_test).min(axis=1)
outliers_km = distances > np.percentile(distances, 95)

# DBSCAN: outliers har label -1
outliers_db = dbscan.labels_ == -1

# Isolation forest: predict gir 1 (normal) eller -1 (anomali)
iso = IsolationForest(n_estimators=100, contamination=0.05, random_state=0).fit(X_train)
outliers_if = iso.predict(X_test) == -1
```

#### Hva koden gjør

`kmeans.transform` gir avstanden fra hvert punkt til hver sentroide, og `.min(axis=1)` gir avstanden til den nærmeste. Med den 95. prosentilen som terskel flagges de 5 % av punktene som ligger lengst fra en sentroide. DBSCAN gir outliers direkte. En isolation forest bygger trær med tilfeldige splitter til hvert punkt er isolert. Anomalier isoleres etter få splitter og får kort sti fra roten. `contamination` er hvor stor andel anomalier vi tror datasettet har, og den bestemmer terskelen.

#### Fallgruver

- Terskelen for k-means er et valg. Den 95. prosentilen gir alltid omtrent 5 % outliers, også om datasettet ikke har noen.
- Mange falske positive betyr at modellen kaller mange normale punkter anomalier (H24 oppgave 21).
- `IsolationForest.predict` gir `-1` og `1`, ikke `1` og `0`.
- DBSCAN kan ikke tilpasses på trening og brukes på test. k-means og isolation forest kan.

## Avstander i høye dimensjoner {#dimensjonsforbannelsen}

*Pensum: 6.4 · Kilder: notater 3.1.4 (figur 22)*

```python
def get_cube_dist(dim):
    P1 = np.random.uniform(size=dim)          # tilfeldig punkt i [0, 1]^dim
    P2 = np.random.uniform(size=dim)
    return np.linalg.norm(P1 - P2)            # euklidsk avstand

for d in [2, 3, 10, 100, 1000, 10000]:
    dist = [get_cube_dist(d) for _ in range(1000)]
    print(d, np.mean(dist), np.std(dist) / np.mean(dist))
```

#### Hva koden gjør

Koden trekker 1000 par av tilfeldige punkter i enhetskuben for flere dimensjoner og ser på fordelingen av avstandene. Når $d$ vokser, øker snittavstanden, mens spredningen *relativt til snittet* krymper. Alle punktpar blir omtrent like langt fra hverandre, og avstand slutter å skille nære punkter fra fjerne. Det er grunnen til at k-means, DBSCAN og andre avstandsbaserte metoder fungerer dårligere i høye dimensjoner, og at vi gjerne reduserer dimensjonen først.

#### Fallgruver

- Det er ikke at avstandene blir små. De blir store og nesten like.
- Notatene skriver koden med en listeforståelse, `np.array([np.random.uniform() for _ in dims])`. Det gir det samme som `np.random.uniform(size=dim)`.
