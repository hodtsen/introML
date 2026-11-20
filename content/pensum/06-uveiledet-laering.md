---
kapittel: 6
tittel: Uveiledet læring – klynging, dimensjonsreduksjon og anomalideteksjon
kilder: Forelesningsnotater 3, F8 (Start unsupervised learning), F9 (Dimensjonsreduksjon og anomalideteksjon), eksamen 2024 oppg. 21–30 og 2025 del 6–7, notater kap. 8, øving 3 Problem 2
---

# Kapittel 6 – Uveiledet læring

Vi vil fortsatt lage modeller som oppnår et mål basert på data, men nå har dataene ikke noe «riktig svar». Data uten targets kalles *unlabeled data*, og uveiledet læring handler om å finne mønstre i slike data. Kurset dekker tre typer: klynging, dimensjonsreduksjon og anomalideteksjon. Dette er det tyngste enkeltområdet på begge tidligere eksamener (10 av 39 oppgaver i 2024, 8 av 40 i 2025).

---

## 6.1 Klynging og k-means {#k-means}

*Kilder: notater 3.1.1, F8, eksamen 2025 6.1–6.2.*

### Introduksjon

Klynging er å finne grupper av like datapunkter, strengt tatt klassifisering uten labels. For å optimere trenger vi et likhetsmål og et læringssignal, altså et tap å minimere. k-means definerer likhet som liten avstand. Etter denne delen skal du kunne algoritmen, hva den minimerer, hvorfor tilfeldig initialisering feiler, og hvordan k-means++ løser det.

### Begreper

- **Klynging (clustering):** gruppering av like datapunkter uten labels.
- **Likhetsmål:** for eksempel avstand (k-means) eller tetthet (DBSCAN).
- **k-means:** deler $n$ datapunkter i $k$ klynger. Hvert punkt tilordnes klyngen med nærmest klyngesentrum.
- **Sentroide:** midten av en klynge. Ikke nødvendigvis et datapunkt, selv om den kan falle sammen med ett.
- **Euklidsk avstand:** kvadratroten av summen av kvadrerte koordinatforskjeller.
- **Inertia:** summen av kvadrerte avstander fra hvert punkt til sin sentroide. Det k-means minimerer.
- **k-means++:** initialisering der neste sentroide trekkes med sannsynlighet proporsjonal med kvadrert avstand til nærmeste eksisterende sentroide.

### Forklaring

**Algoritmen (notatene og F8).**

1. Velg $k$, antall klynger (typisk brukeren eller en algoritmisk gjetning).
2. Velg $k$ klyngesentroider.
3. Tildel hvert datapunkt en tilfeldig klynge.
4. Beregn euklidsk avstand mellom hvert datapunkt og alle sentroidene.
5. Tildel hvert punkt nærmeste sentroide.
6. Flytt hver sentroide til middelverdien (`np.mean`) av punktene i klyngen.
7. Gjenta 4–6 til klyngene ikke endrer seg.

Steg 5 og 6 senker inertia hver gang, så algoritmen stopper alltid, men ikke nødvendigvis i den beste løsningen.

**Hvorfor tilfeldig initialisering feiler.** Plasseres sentroidene tilfeldig, kan to havne i samme sanne klynge og ingen i en annen. Da blir algoritmen sittende fast («epic fail» i F8). Anta riktig $k$ og like store klynger. Trekk sentroidene én etter én:

- Den første kan havne hvor som helst: sannsynlighet 1.
- Den andre må unngå klyngen som er tatt: $(k-1)/k$.
- Den tredje må unngå to: $(k-2)/k$, og så videre til den siste: $1/k$.

Produktet er $k!/k^k$. For $k = 3$ er det 0,22, for $k = 5$ 0,038 og for $k = 10$ bare 0,00036. Med Stirlings tilnærming går sannsynligheten som $\sqrt{k}\,e^{-k}$, altså eksponentielt avtagende i $k$.

**Bedre initialisering.** Første sentroide tilfeldig, neste på datapunktet som er lengst unna, og generelt: sentroide $j$ plasseres på punktet der minste avstand til de eksisterende sentroidene er størst. Svakheten er at punktet lengst unna som oftest ligger i *utkanten* av en klynge.

**k-means++.** I stedet for alltid å ta punktet lengst unna trekkes neste sentroide tilfeldig, med sannsynlighet proporsjonal med kvadrert avstand til nærmeste sentroide. Fjerne punkter er fortsatt mest sannsynlige, men tilfeldigheten gjør at sentroiden oftere havner nær midten av den faktiske klyngen. Sentroidene spres, og tilfeldigheten beholdes. At k-means++ i forventning er høyst en faktor $\log k$ fra optimum, er «fun fact, ikke eksamensspørsmål» (F8).

**I praksis.** `sklearn.cluster.MiniBatchKMeans` er anbefalt for store datasett: i stedet for hele datasettet brukes en liten tilfeldig trekning per iterasjon (som mini-batch SGD). `n_clusters` er $k$, og `init` velger initialisering (standard er k-means++). Lar vi algoritmen velge $k$ selv, fungerer det ofte dårlig (F8: «Not wow»).

### Formler

Euklidsk avstand i $n$ dimensjoner:

$$
d^2(\mathbf{p}, \mathbf{q}) = (p_1 - q_1)^2 + (p_2 - q_2)^2 + \dots + (p_n - q_n)^2
$$

Det k-means minimerer, med $\boldsymbol{\mu}_c$ som sentroiden til klynge $C_c$:

$$
\text{Inertia} = \sum_{c=1}^{k}\sum_{\mathbf{x} \in C_c}\lVert \mathbf{x} - \boldsymbol{\mu}_c \rVert^2, \qquad \boldsymbol{\mu}_c = \frac{1}{|C_c|}\sum_{\mathbf{x} \in C_c}\mathbf{x}
$$

Sannsynligheten for én sentroide per klynge ved tilfeldig initialisering:

$$
P = \frac{k!}{k^k} = \frac{1}{k}\cdot\frac{2}{k}\cdots\frac{k}{k}, \qquad k! \approx \sqrt{2\pi k}\,e^{-k}k^k \;\Rightarrow\; P \approx \sqrt{2\pi k}\,e^{-k}
$$

k-means++: neste sentroide er punkt $\mathbf{x}$ med sannsynlighet

$$
P(\mathbf{x}) = \frac{D(\mathbf{x})^2}{\sum_{\mathbf{x}'} D(\mathbf{x}')^2}
$$

der $D(\mathbf{x})$ er avstanden til nærmeste allerede valgte sentroide.

### Sammenhenger

- Klynging er «klassifisering uten labels», og det samme XOR-aktige problemet oppstår: en avstandsbasert metode antar en bestemt form på klyngene.
- MiniBatchKMeans er samme idé som mini-batch SGD (kapittel 5.5).
- k-means med én klynge og avstand til sentroiden kan brukes til anomalideteksjon (6.7).

### Vanlige misforståelser

- «k-means minimerer avstanden mellom sentroidene.» Den minimerer summen av kvadrerte avstander fra punkt til egen sentroide.
- «k-means minimerer silhouette eller Calinski–Harabasz.» Det er evalueringsmetrikker, ikke det algoritmen optimerer.
- «En sentroide er et datapunkt.» Den er et gjennomsnitt.
- «k-means++ velger alltid punktet lengst unna.» Det er den deterministiske varianten. k-means++ trekker tilfeldig, vektet med kvadrert avstand.
- «k-means++ foretrekker punkter nær eksisterende sentroider.» Den foretrekker punkter *langt* unna.

### Eksamensoppsummering

- Kunne de sju stegene i k-means og at den minimerer inertia.
- Forklare hvorfor tilfeldig initialisering feiler, og at sannsynligheten $k!/k^k$ synker eksponentielt med $k$.
- Forklare k-means++ (trekking proporsjonal med kvadrert avstand) og hvorfor den er bedre enn å ta punktet lengst unna.

---

## 6.2 Velge k og antakelsene bak k-means {#velge-k}

*Kilder: notater 3.1.1, F8, eksamen 2024 oppg. 29 og 2025 6.3.*

### Introduksjon

Å bestemme $k$ er en av de store utfordringene i klynging. Uten labels må vi bruke metrikker som måler hvor gode klyngene er. Etter denne delen skal du kunne de tre metrikkene kurset krever, forklare hvorfor de kan foreslå ulik $k$, og kjenne den implisitte antakelsen i k-means.

> F8: «Dere skal kunne tre av dem.»

### Begreper

- **Inertia:** summen av kvadrerte avstander fra punktene til sin sentroide. Hvor tette klyngene er. Lav er bra.
- **Silhouette coefficient:** per datapunkt, hvor nært punktet er sin egen klynge sammenlignet med nærmeste andre klynge. Fra $-1$ til $1$, og 1 er best.
- **Calinski–Harabasz-score:** forholdet mellom spredningen *mellom* klynger og spredningen *innad i* klyngene. Høy er bra.
- **$a$:** gjennomsnittlig avstand fra punktet til de andre punktene i egen klynge (mean intra-cluster distance).
- **$b$:** gjennomsnittlig avstand fra punktet til punktene i nærmeste andre klynge (mean nearest-cluster distance).

### Forklaring

**De tre metrikkene.**

| Metrikk | Måler | Bra verdi | Svakhet |
|---|---|---|---|
| Inertia | Hvor kompakte klyngene er | Lav | Minimeres trivielt med $k = n$ (én sentroide per punkt) |
| Silhouette | Hvor godt hvert punkt passer i egen klynge vs nærmeste andre | Nær 1 | 0 betyr overlapp eller at punktet ligger på grensen, negativ betyr trolig feil klynge |
| Calinski–Harabasz | Avstand mellom klynger normalisert med klyngestørrelse | Høy | Fungerer best der k-means fungerer: godt separerte, veldefinerte klynger |

**Regneeksempel (silhouette).** Et punkt har snittavstand $a = 2$ til egen klynge og $b = 5$ til nærmeste andre. Da er $s = (5-2)/\max(2, 5) = 0{,}6$: punktet passer godt. Er $a = b$, er $s = 0$.

**Søk over $k$.** Tren k-means for flere verdier av $k$ og plott alle tre metrikkene. $k$ er en *hyperparameter*, så valget gjøres på valideringsdata. Ulike metrikker kan foreslå ulik $k$, så det finnes ingen enkelt metrikk som alltid gir riktig svar. Inertia synker alltid med økende $k$, så der ser vi etter et knekkpunkt der forbedringen flater ut. I F8 pekte metrikkene samlet på $k = 5$.

**Den implisitte antakelsen.** k-means bruker avstand som likhetsmål og antar dermed at avstanden innad i en klynge er mindre enn avstanden mellom klynger. Klyngene antas omtrent runde og like store. F8 viser data der k-means feiler selv med riktig $k$: ringer inni hverandre og langstrakte former, der avstanden innad i klyngen er større enn til naboklyngen. Det kan ikke fikses, fordi det er innebygd i metoden. Generelt gjelder: alle læringsalgoritmer har implisitte antakelser, og du må kjenne det teoretiske grunnlaget før du bruker dem.

**Fordeler og ulemper.**

| Fordeler | Ulemper |
|---|---|
| Lett å forstå og implementere | Følsom for valg av $k$. Automatisk valg fungerer ofte dårlig, og manuelt valg er bare så godt som metoden for å velge. |
| Fungerer godt på store datasett (stor $n$) | Svak med outliers, som trekker sentroidene vekk fra de faktiske klyngene |
| | Fungerer dårlig i høye dimensjoner, fordi euklidsk avstand blir nesten konstant (6.4), og blir treg |

### Formler

Silhouette for punkt $i$:

$$
s(i) = \frac{b(i) - a(i)}{\max\bigl(a(i), b(i)\bigr)} \in [-1, 1]
$$

Calinski–Harabasz (prinsipp, med $N$ punkter og $k$ klynger):

$$
\text{CH} = \frac{\text{spredning mellom klynger}}{\text{spredning innad i klynger}}\cdot\frac{N - k}{k - 1}
$$

Kursmaterialet beskriver CH som forholdet mellom kvadrert avstand mellom og innad i klynger. Normaliseringsfaktoren $\frac{N-k}{k-1}$ er standardformen i sklearn og trengs ikke på eksamen.

### Sammenhenger

- At $k$ er en hyperparameter som velges på valideringsdata, er samme prinsipp som for polynomgrad og tredybde (kapittel 3).
- Inertia som synker monotont med $k$, er analogt med treningsfeil som synker med modellkompleksitet: lavest er ikke best.
- DBSCAN (6.3) gjør en annen antakelse og trenger ikke $k$.

### Vanlige misforståelser

- «Lavest inertia er best.» Da hadde $k = n$ vunnet.
- «k-means velger beste $k$ selv under trening.» $k$ må velges på forhånd.
- «Optimal $k$ er alltid antall klasser i dataene.» Det finnes ofte ingen fasit, og klyngene trenger ikke svare til klasser.
- «Silhouette gir én verdi for hele datasettet.» Den regnes per punkt (og kan så snittes).
- «Riktig $k$ garanterer at k-means finner klyngene.» Ikke når avstanden innad i klyngene er større enn mellom dem.

### Eksamensoppsummering

- Kunne inertia, silhouette (formelen) og Calinski–Harabasz: hva de måler og hva som er en god verdi.
- Forklare hvorfor valg av $k$ er vanskelig: ulike metrikker kan foreslå ulik $k$, og inertia favoriserer stor $k$.
- Kunne den implisitte antakelsen i k-means og fordeler og ulemper.

---

## 6.3 DBSCAN og typer klyngealgoritmer {#dbscan}

*Kilder: notater 3.1.2–3.1.3, F8, eksamen 2024 oppg. 30 og 2025 6.4.*

### Introduksjon

DBSCAN (Density-Based Spatial Clustering of Applications with Noise) definerer likhet som *tetthet* i stedet for avstand til et sentrum. Den finner klynger av vilkårlig form, trenger ikke $k$, og merker punkter som ikke hører hjemme noe sted, som outliers. Etter denne delen skal du kunne de tre punkttypene, prosedyren, hyperparametrene og fordeler og ulemper.

### Begreper

- **DBSCAN:** utviklet av Martin Ester, Hans-Peter Kriegel, Jörg Sander og Xiaowei Xu (1996).
- **$\varepsilon$ (eps):** maksimal avstand mellom to punkter som regnes som naboer.
- **`min_samples`:** minimum antall naboer innen $\varepsilon$ for at et punkt skal være et kjernepunkt.
- **Kjernepunkt:** har minst `min_samples` naboer innen $\varepsilon$. Ligger nær midten av en klynge og brukes til å utvide den.
- **Ikke-kjernepunkt (randpunkt):** har færre enn `min_samples` naboer, men ligger innen $\varepsilon$ fra et kjernepunkt. Hører til klyngen, men utvider den ikke.
- **Outlier (støy):** har færre enn `min_samples` naboer og ligger ikke innen $\varepsilon$ fra noe kjernepunkt. Tilhører ingen klynge og får label $-1$.

### Forklaring

**Prosedyren.**

1. Finn kjernepunktene ved å telle naboer innen $\varepsilon$. Det er kjent fra start.
2. Gå gjennom kjernepunktene og spre klyngen til punkter i nærheten. Er punktet et kjernepunkt, brukes det til å utvide klyngen videre. Er det ikke det, blir det et ikke-kjernepunkt.
3. Når det ikke er flere kjernepunkter å utvide fra, er klyngen ferdig. Et nytt, ubrukt kjernepunkt starter en ny klynge.
4. Alle punkter som ikke ble tilordnet noen klynge, er outliers.

To punkter havner altså i samme klynge når det ene kan nås fra det andre gjennom en kjede av punkter der hvert steg er høyst $\varepsilon$ langt (og kjeden går via kjernepunkter). Slidene og notatene veksler mellom «minst» og «flere enn» `min_samples` naboer. I sklearn teller punktet selv med, og kravet er minst `min_samples`.

**Eksempel (F8).** Med $\varepsilon = 1$ og `min_samples` = 3: et punkt med tre naboer tett inntil er et kjernepunkt, et punkt i utkanten med én nabo som er kjernepunkt, er et ikke-kjernepunkt, og et punkt langt unna alle er en outlier.

**Hyperparametrene.** For liten $\varepsilon$ gir mange små klynger og mange outliers. For stor $\varepsilon$ slår klynger sammen.

**Fordeler og ulemper.**

| Fordeler | Ulemper |
|---|---|
| Trenger ikke antall klynger, og antar ingenting om det | Følsom for $\varepsilon$ og `min_samples` |
| Robust for outliers, som den identifiserer i stedet for å presse inn i klynger | $\varepsilon$ og `min_samples` er globale, så DBSCAN sliter når tettheten varierer mellom klynger |
| Finner klynger med vilkårlig og ulik form, også ikke-lineære strukturer | Treg for store datasett, fordi avstander mellom alle punkter må beregnes |
| | Svak i høye dimensjoner, fordi den bygger på avstand (6.4) |

**Fire hovedkategorier av klyngealgoritmer.**

| Kategori | Idé | Eksempel | Pensum? |
|---|---|---|---|
| Sentroidebasert | Start med sentroider, knytt punkter til dem, juster til konvergens | k-means | Ja |
| Tetthetsbasert | Klynger er tette områder, isolerte punkter er outliers | DBSCAN | Ja |
| Fordelingsbasert | Hver klynge er punkter fra en fordeling, vanligvis en gauss. Finn parametrene. | | Bør ha hørt om |
| Hierarkibasert | Start med hvert punkt som egen klynge, slå sammen til alle er én, og velg et nivå i hierarkiet | | Bør ha hørt om |

### Formler

Nabolaget og kjernepunktkravet:

$$
N_\varepsilon(\mathbf{x}) = \{\mathbf{x}' : \lVert \mathbf{x}' - \mathbf{x}\rVert \leq \varepsilon\}, \qquad \mathbf{x} \text{ er kjernepunkt hvis } |N_\varepsilon(\mathbf{x})| \geq \texttt{min\_samples}
$$

### Sammenhenger

- k-means: likhet som avstand til sentrum, trenger $k$, sliter med outliers og rare former. DBSCAN: likhet som tetthet, trenger $\varepsilon$ og `min_samples`, håndterer outliers og former, men sliter med varierende tetthet.
- DBSCAN er ikke-parametrisk og må tilpasses på alle dataene samtidig. Det får betydning for anomalideteksjon (6.7).
- Øving 3 ber deg sammenligne KMeans og DBSCAN på samme data.

### Vanlige misforståelser

- «Punkter i samme klynge må ha identiske feature-vektorer eller ligge i samme Voronoi-region.» Det avgjørende er en kjede av $\varepsilon$-steg.
- «Ikke-kjernepunkter utvider klyngen.» Bare kjernepunkter gjør det.
- «DBSCAN tvinger alle punkter inn i en klynge.» Outliers får label $-1$.
- «Høyere $\varepsilon$ gir flere klynger.» Lavere $\varepsilon$ gir flere, mindre klynger.

### Eksamensoppsummering

- Kunne definere kjernepunkt, ikke-kjernepunkt og outlier ut fra $\varepsilon$ og `min_samples`.
- Kunne prosedyren og kriteriet for at to punkter er i samme klynge.
- Forklare effekten av å endre $\varepsilon$.
- Kunne fordeler og ulemper, og de fire kategoriene (og at to av dem ikke er pensum).

---

## 6.4 Dimensjonsforbannelsen igjen og hvorfor redusere dimensjonen {#concentration}

*Kilder: notater 3.1.4 og 3.2, F8, F9.*

### Introduksjon

Klynging i to dimensjoner er enkelt. Men problemene der maskinlæring er nyttig, har ofte mange features. Da oppfører avstander seg merkelig, og avstandsbaserte metoder slutter å virke. Etter denne delen skal du kunne forklare *concentration of distances* og hvorfor dimensjonsreduksjon er løsningen.

### Begreper

- **Concentration of distances:** i høye dimensjoner blir avstandene store, mens de *relative* forskjellene mellom dem blir små. Alle punkter havner omtrent like langt fra hverandre.
- **Dimensjonsreduksjon:** å gå fra $n$ features til færre, $n'$, og bevare mest mulig av informasjonen.

### Forklaring

**Eksperimentet i notatene.** Trekk to tilfeldige punkter i enhetskuben $[0, 1]^d$ og mål avstanden. Gjenta 1000 ganger for $d = 2, 3, 10, 100, 1000, 10\,000$. Snittavstanden vokser med $d$, mens spredningen blir liten sammenlignet med snittet. I høye dimensjoner er «nær» og «langt unna» nesten det samme.

**Konsekvensen for klynging.** Punkter i samme klynge skal være nærmere hverandre enn punkter i andre klynger. Når alle avstander er omtrent like, klarer klyngealgoritmene ikke å tildele punktene riktig. F8: dette er ikke et problem, men en egenskap ved høydimensjonale rom.

**Flere data hjelper ikke.** Problemet kommer av hvordan avstander oppfører seg, ikke av størrelsen på datasettet. Løsningen er å redusere dimensjonen og beholde retningene som representerer strukturen i dataene.

**Hvorfor redusere dimensjonen (notatene og F9).**

1. **Visualisering:** vi kan ikke plotte mer enn 2–3 dimensjoner, og mønstre som klynger og anomalier er ofte usynlige i høye dimensjoner.
2. **Støyfjerning:** features som fanger variansen eller strukturen best, kan filtrere bort støy og gi mer robuste (og tolkbare) modeller.
3. **Feature discovery:** færre, sammensatte features som representerer det viktigste. Det hjelper oss å forstå dataene og gjør dem billigere å lagre og analysere.

Dimensjonsreduksjon kan være en analysemetode i seg selv, eller preprosessering, for eksempel før klynging.

### Formler

Euklidsk avstand er en sum av $d$ kvadrater. Med uavhengige, like fordelte koordinater vokser snittavstanden omtrent som $\sqrt{d}$, mens den relative spredningen krymper:

$$
\frac{\text{std}(d_{\text{avstand}})}{\text{snitt}(d_{\text{avstand}})} \;\xrightarrow{d \to \infty}\; 0
$$

(Skaleringen er standard sannsynlighetsregning. Kurset viser fenomenet med histogrammer.)

### Sammenhenger

- Samme forbannelse som i kapittel 2.3: rommet blir tomt når antall features passerer omtrent 10, og nå ser vi at også avstandene mister mening.
- Både k-means og DBSCAN bygger på avstand og rammes.

### Vanlige misforståelser

- «Avstander blir små i høye dimensjoner.» De blir store. Det er de *relative* forskjellene som blir små.
- «Mer data løser problemet.» Det gjør det ikke.

### Eksamensoppsummering

- Forklare concentration of distances og hvorfor avstandsbasert klynging feiler i høye dimensjoner.
- Kunne de tre grunnene til dimensjonsreduksjon: visualisering, støyfjerning og feature discovery.

---

## 6.5 PCA – prinsipalkomponentanalyse {#pca}

*Kilder: notater 3.2.1, F9, eksamen 2024 og 2025 7.1, notater kap. 8 (eksempeloppgave), øving 3.*

### Introduksjon

PCA (Karl Pearson, 1901) finner nye akser som fanger mest mulig av variansen i dataene, og projiserer dataene på de viktigste av dem. Det er en lineær, rask og gjenbrukbar metode, og på eksamen må du kunne regne den for hånd for små matriser. Etter denne delen skal du kunne kovariansmatrisen, egenverdier og egenvektorer, tolkningen av dem, og når PCA fungerer dårlig.

### Begreper

- **Prinsipalkomponent (PC):** en ny akse som er en lineær kombinasjon av de opprinnelige featurene. PC-ene er ortogonale.
- **PC1:** retningen der dataene varierer mest. PC2 er retningen med nest mest varians, ortogonal på PC1, og så videre.
- **Kovarians:** hvor mye to variabler varierer sammen. Positiv når de øker sammen, negativ når den ene øker mens den andre synker.
- **Kovariansmatrise $S$:** varianser på diagonalen, kovarianser utenfor.
- **Egenvektor og egenverdi:** $S\mathbf{e} = \lambda\mathbf{e}$. PC-ene er egenvektorene til kovariansmatrisen, og egenverdien er variansen langs den retningen.
- **Projeksjon:** å uttrykke dataene i de nye aksene og beholde bare de $d'$ første.

### Forklaring

**Intuisjon.** Høyde, vekt og alder er korrelerte: høye folk veier mer, og små barn er både lette og lave. PCA finner de uavhengige retningene der dataene varierer mest. Fordi PC-ene er ortogonale, inneholder hver av dem ny informasjon uten å gjenta de andre.

**Fremgangsmåten.**

1. Trekk fra gjennomsnittet i hver feature.
2. Regn ut kovariansmatrisen.
3. Finn egenverdiene ved å løse $\det(S - \lambda I) = 0$.
4. Finn egenvektorene ved å løse $S\mathbf{e} = \lambda\mathbf{e}$, og normaliser dem til lengde 1.
5. Sorter etter egenverdi, størst først. Behold de $d'$ første og projiser dataene på dem.

**Regneeksempel 1 (notatene og F9).** $\mathbf{x}_1 = (1, 2, 3)$ og $\mathbf{x}_2 = (2, 1, 0)$. Snittene er 2 og 1, og de sentrerte dataene er $(-1, 0, 1)$ og $(1, 0, -1)$. Det gir

$$
\text{cov}(x_1, x_1) = \tfrac{1}{2}(1 + 0 + 1) = 1, \quad \text{cov}(x_2, x_2) = 1, \quad \text{cov}(x_1, x_2) = \tfrac{1}{2}(-1 + 0 - 1) = -1
$$

$$
S = \begin{pmatrix} 1 & -1 \\ -1 & 1 \end{pmatrix}, \qquad \det(S - \lambda I) = (1-\lambda)^2 - 1 = \lambda^2 - 2\lambda = 0
$$

Egenverdiene er $\lambda_1 = 0$ og $\lambda_2 = 2$.

- $\lambda_1 = 0$ gir $v_1 = v_2$, altså $\mathbf{e}_1 = \tfrac{1}{\sqrt{2}}(1, 1)$.
- $\lambda_2 = 2$ gir $v_1 = -v_2$, altså $\mathbf{e}_2 = \tfrac{1}{\sqrt{2}}(1, -1)$.

Notatene nummererer egenverdiene stigende. PC1 (mest varians) er derfor $\mathbf{e}_2$, retningen $(1, -1)$. Egenverdien 0 betyr at én komponent rommer all variansen: $x_1 + x_2 = 3$ for alle punktene, så dataene ligger på en linje. Egenvektorene har origo i snittet $(2, 1)$.

**Regneeksempel 2 (notatene og F9).** Fem punkter med $\bar{x}_1 = 3$ og $\bar{x}_2 = 5{,}82$ gir $S = \begin{pmatrix} 2{,}5 & 4{,}85 \\ 4{,}85 & 9{,}63\end{pmatrix}$, med egenverdier $\lambda_1 \approx 12{,}08$ og $\lambda_2 \approx 0{,}05$. PC1 er omtrent $(0{,}45;\ 0{,}89)$ og forklarer 99,6 % av variansen. Én komponent holder.

**Regneeksempel 3 (eksempeloppgave i notatene).** $S = \begin{pmatrix} 5 & 2 \\ 2 & 2\end{pmatrix}$ har egenverdiene 6 og 1.

- $\lambda = 6$: $(5-6)v_1 + 2v_2 = 0$ gir $v_2 = v_1/2$, altså $\tfrac{1}{\sqrt{5}}(2, 1)$.
- $\lambda = 1$: $4v_1 + 2v_2 = 0$ gir $v_2 = -2v_1$, altså $\tfrac{1}{\sqrt{5}}(1, -2)$.

Sjekk alltid at egenvektorene er ortogonale: $(2, 1)\cdot(1, -2) = 0$.

**Øvingsoppgave (F11s «vanskelige eksamensspørsmål»).** Finn prinsipalkomponentene til $S = \begin{pmatrix} 4 & -\sqrt{2} \\ -\sqrt{2} & 3\end{pmatrix}$. (Fasit: egenverdiene er 5 og 2, med egenvektorer proporsjonale med $(1, -1/\sqrt{2})$ og $(1, \sqrt{2})$. Sjekk ved å regne $S\mathbf{e}$.)

**I sklearn.**

```python
pca = PCA(n_components=2)
pca.fit(X_train)                 # finn PC-ene på treningsdata
X_pca = pca.transform(X_test)    # projiser testdata
```

Med `n_components=1` får vi én feature fra to. PCA er parametrisk: når PC-ene er funnet, kan transformasjonen brukes på nye data.

**Når fungerer PCA?**

- **S-kurven (3D → 2D):** fungerer godt, fordi variansen i dybderetningen er liten. PCA kan altså fungere på ikke-lineære data så lenge variansen kan representeres langs lineære kombinasjoner av aksene.
- **MNIST (784 → 2):** fungerer dårlig. PCA rangerer retninger etter varians, ikke etter relevans. Mye av variasjonen i håndskrevne tall er *hvordan* de er skrevet (tykk eller tynn strek, kursiv), ikke *hvilket* tall det er. To lineære retninger er altfor lite. En lineær metode kan bare ta vare på nyttig struktur hvis strukturen er lineært separerbar og faller sammen med variansen.

### Formler

Kovarians mellom feature $i$ og $j$ over $N$ datapunkter:

$$
\text{cov}(x_i, x_j) = \frac{1}{N-1}\sum_{k=1}^{N}(x_{i,k} - \bar{x}_i)(x_{j,k} - \bar{x}_j)
$$

Kovariansmatrisen for to features:

$$
S = \begin{pmatrix} \text{cov}(x_1, x_1) & \text{cov}(x_1, x_2) \\ \text{cov}(x_2, x_1) & \text{cov}(x_2, x_2) \end{pmatrix}
$$

Egenverdier og egenvektorer:

$$
\det(S - \lambda I) = 0, \qquad S\mathbf{e}_i = \lambda_i\mathbf{e}_i, \qquad \lVert\mathbf{e}_i\rVert = 1
$$

Andel varians forklart av komponent $i$:

$$
\frac{\lambda_i}{\sum_j \lambda_j}
$$

### Sammenhenger

- PCA er lineær. Den lager nye features som lineære kombinasjoner, samme idé som et lag i et nevralt nett uten aktiveringsfunksjon.
- Ortogonale PC-er gir uavhengig informasjon, og det er derfor de er nyttige som features.
- I øving 3 hjelper dimensjonsreduksjon med å velge $k$ og å visualisere klyngene. Sammenlign PCA og t-SNE i 2D.

### Vanlige misforståelser

- «Ortogonalitet sørger for at hver komponent fanger like mye varians.» Den sørger for at hver komponent fanger en *ulik* del av variansen uten overlapp.
- «Egenverdien sier hvilken retning PC-en har.» Egenvektoren gir retningen, egenverdien gir variansen langs den.
- «PC1 er alltid $\mathbf{e}_1$.» PC1 er egenvektoren med *størst* egenverdi, uansett nummerering.
- «Retningene med mest varians er de mest nyttige for klassifisering.» Ikke nødvendigvis (MNIST).
- «PCA bruker labels.» PCA er uveiledet.

### Eksamensoppsummering

- Kunne regne kovariansmatrise, egenverdier og normaliserte egenvektorer for en $2\times 2$-matrise.
- Vite at PC-ene er egenvektorene til kovariansmatrisen, sortert etter egenverdi, og at de er ortogonale.
- Tolke en egenverdi på 0 og andel forklart varians.
- Forklare hvorfor PCA fungerer for S-kurven, men ikke for MNIST i 2D.
- `.fit` på trening, `.transform` på test.

---

## 6.6 SNE, t-SNE og KL-divergens {#tsne}

*Kilder: notater 3.2.2, F9, eksamen 2024 og 2025 7.2–7.3, notater kap. 8 (eksempeloppgave).*

### Introduksjon

PCA bevarer varians langs lineære retninger. SNE og t-SNE bevarer i stedet *naboskap*: punkter som er naboer i det høydimensjonale rommet, skal være naboer i det lavdimensjonale. På MNIST gir t-SNE tydelige klynger der PCA gir grøt. Etter denne delen skal du kunne forklare hvordan SNE virker, hva KL-divergensen måler, hva perplexity er, hvorfor t-SNE ikke kan brukes på nye data, og hvordan PCA og t-SNE skiller seg.

### Begreper

- **SNE (stochastic neighbor embedding):** dimensjonsreduksjon som matcher naboskapssannsynligheter i høy og lav dimensjon.
- **$p_{j|i}$:** betinget sannsynlighet for naboskap mellom $\mathbf{x}_i$ og $\mathbf{x}_j$, regnet med en gauss sentrert i $\mathbf{x}_i$. Kurset formulerer det som sannsynligheten for at $\mathbf{x}_j$ ville valgt $\mathbf{x}_i$ som nabo.
- **$P$ og $Q$:** naboskapsfordelingene i det høydimensjonale og det lavdimensjonale rommet.
- **KL-divergens (relativ entropi):** mål på forskjellen mellom en referansefordeling $P$ og en annen fordeling $Q$.
- **Embedding:** avbildningen fra høydimensjonal til lavdimensjonal plassering av punktene.
- **t-SNE:** SNE med t-fordeling i stedet for gauss i det lavdimensjonale rommet. Laget av Laurens van der Maaten og Geoffrey Hinton (2008).
- **Perplexity:** hyperparameter som styrer variansen til gaussene. Den angir entropien til den betingede gaussiske fordelingen, og intuitivt er den det effektive antallet naboer hvert punkt bryr seg om.
- **Ikke-parametrisk:** lærer ikke parametre som kan brukes på nye data.

### Forklaring

**Steg 0: naboskap i det opprinnelige rommet.** For hvert punkt $\mathbf{x}_i$ legges en gauss sentrert i punktet, og sannsynligheten for alle andre punkter regnes ut under den. Nære punkter får høy sannsynlighet for å være naboer, fjerne punkter lav. Variansen til hver gauss tilpasses slik at perplexity blir som valgt. Resultatet er fordelingen $P$.

**Steg 1–2: dimensjonsreduksjonen.**

1. Plasser alle punktene tilfeldig i et lavdimensjonalt rom (for eksempel 2D).
2. Flytt punktene stegvis med gradient descent slik at naboskapsfordelingen $Q$ i det lave rommet matcher $P$ best mulig. Tapsfunksjonen er KL-divergensen.

**KL-divergens, intuitivt.** Hvor overraskende resultater du får hvis du bruker fordelingen $Q$ når dataene faktisk kommer fra $P$. Den er forventningen (over $P$) av den logaritmiske forskjellen mellom $P$ og $Q$. Den er alltid $\geq 0$, er 0 bare når $P = Q$, og er *ikke symmetrisk*. Eksempel: $P = (0{,}5;\ 0{,}3;\ 0{,}2)$ og $Q = (0{,}4;\ 0{,}4;\ 0{,}2)$ gir $D_{KL}(P\|Q) \approx 0{,}0253$, men $D_{KL}(Q\|P) \approx 0{,}0258$.

Å minimere KL betyr å *bevare nabolagsrelasjonene*: like punkter forblir nære. Er KL fortsatt høy etter mange iterasjoner, bevarer den lavdimensjonale representasjonen ikke naboskapssannsynlighetene fra det høydimensjonale rommet (eksempeloppgave i notatene).

**Hvorfor t-fordelingen?** t-fordelingen ligner en gauss, men har lengre haler. Det hindrer at nabopunkter presses til omtrent samme sannsynlighet i det lave rommet, slik at klyngene skilles bedre.

**Hvorfor t-SNE ikke kan brukes på nye data.** t-SNE optimerer *posisjonene* til datapunktene direkte, basert på parvise forhold mellom alle punktene. Den lærer ingen transformasjon. Legger vi til nye punkter (for eksempel testdata), endres de relative forholdene, og hele embeddingen må regnes på nytt. Derfor kalles `fit_transform` på de samme dataene, og F9 spør om noen vil «kjefte på» henne for det. Det er ikke god praksis, men vi har ikke noe valg. t-SNE omtales derfor ofte som en visualiseringsmetode.

**PCA og t-SNE sammenlignet (F9 og notatene).**

| | PCA | t-SNE |
|---|---|---|
| Mål | Bevare varians | Minimere KL-divergensen mellom to naboskapsfordelinger |
| Gjenbruk | Parametrisk, kan brukes igjen etter `.fit()` | Ikke-parametrisk, må tilpasses og brukes samtidig |
| Nye features | Kan lage nye features for nye data | Kan ikke lage features for nye data |
| Linearitet | Trenger lineært separerbar struktur | Ingen antakelse om linearitet |
| Outliers | Fungerer dårlig | Fungerer godt, takket være gauss og t-fordeling |
| Beregning | Rask og lett | Tung og treg på store datasett |

**Med nevrale nett.** Dimensjonsreduksjon kan også gjøres med et nevralt nett som har en tapsfunksjon som måler likheten mellom høy- og lavdimensjonal representasjon. Da får vi en *parametrisk* modell som kan brukes på nye data. Dette er krevende å få til, kommer ikke på prosjektene og skal bare nevnes.

### Formler

KL-divergens (kursets form):

$$
D_{KL}(P\,\|\,Q) = \sum_{x \in X} P(x)\log\frac{P(x)}{Q(x)} \geq 0
$$

Naboskapssannsynlighet i det høydimensjonale rommet. Verken slidene eller notatene skriver ut formelen. Dette er standardformen fra van der Maaten og Hinton:

$$
p_{j|i} = \frac{\exp\!\left(-\lVert\mathbf{x}_i - \mathbf{x}_j\rVert^2 / 2\sigma_i^2\right)}{\sum_{k \neq i}\exp\!\left(-\lVert\mathbf{x}_i - \mathbf{x}_k\rVert^2 / 2\sigma_i^2\right)}
$$

- $\sigma_i$ er variansen til gaussen rundt $\mathbf{x}_i$, valgt slik at perplexity blir som ønsket.
- I t-SNE erstattes gaussen i det lavdimensjonale rommet av en t-fordeling.

KL-divergensen og cross-entropy (kapittel 1.7) henger sammen:

$$
D_{KL}(P\,\|\,Q) = H(P, Q) - H(P)
$$

### Sammenhenger

- KL-divergens er cross-entropy minus entropi. Når $P$ er fast, er det å minimere KL det samme som å minimere cross-entropy.
- t-SNE trenes med gradient descent, men parametrene er punktenes posisjoner, ikke vekter i en modell.
- Ikke-parametriske metoder (t-SNE, DBSCAN) må se alle dataene samtidig. Parametriske metoder (PCA, k-means, nevrale nett) kan brukes på nye data.

### Vanlige misforståelser

- «t-SNE lærer en global lineær avbildning.» Den lærer ingen avbildning, bare posisjoner.
- «t-SNE kan ikke brukes på nye data fordi projeksjonsmatrisen er for stor.» Det finnes ingen projeksjonsmatrise.
- «t-SNE bevarer globale avstander.» Den bevarer lokale naboskap. Avstander mellom klynger i et t-SNE-plott sier lite.
- «Minimering av KL plasserer fjerne punkter nær hverandre.» Den bevarer naboskap, så nære forblir nære.
- «KL er symmetrisk.» Den er det ikke.
- «Høy KL betyr optimal embedding.» Lav KL er bra.

### Eksamensoppsummering

- Forklare SNE: gausser i høy dimensjon, tilfeldig plassering i lav dimensjon, gradient descent på KL.
- Kunne KL-formelen, at den er ikke-negativ og ikke-symmetrisk, og tolke høy KL.
- Vite hva t-en betyr (t-fordeling i lav dimensjon) og hva perplexity gjør.
- Forklare hvorfor t-SNE ikke kan brukes på nye data.
- Kunne sammenligningstabellen PCA vs t-SNE.

---

## 6.7 Anomalideteksjon {#anomalier}

*Kilder: notater 3.3, F9, eksamen 2024 og 2025 7.4, øving 3.*

### Introduksjon

Anomalideteksjon (outlier detection) handler om å finne datapunkter som ikke ligner majoriteten: hvitvasking, kortsvindel, serverangrep, avvik hvor som helst. Vi har mange normale eksempler og få eller ingen anomalier, og vi vet ikke på forhånd hvordan avvikene ser ut. Det kan ses som klassifisering uten labels med ekstrem skjevfordeling, og behandles derfor oftest som uveiledet læring. Etter denne delen skal du kunne tre metoder og hvordan de skiller seg.

### Begreper

- **Anomali (outlier):** et datapunkt som skiller seg fra majoriteten.
- **Prosentil:** verdien som en gitt andel av dataene er mindre enn eller lik. Den 50. prosentilen er medianen.
- **Isolation forest:** en skog av isolasjonstrær som finner punkter som er lette å isolere.
- **Isolasjonstre (itree):** tre som splitter på tilfeldige features og tilfeldige verdier til hvert punkt havner i sin egen løvnode.
- **Stilengde:** antall splitter fra rotnoden til løvnoden for et punkt.
- **`contamination`:** antatt andel anomalier i dataene.

### Forklaring

**1. k-means.** Tilpass k-means på treningsdata med passende $k$. Regn ut avstanden fra hvert testpunkt til nærmeste sentroide, og bruk en prosentil som terskel:

```python
distances = kmeans.transform(X_test).min(axis=1)
threshold = np.percentile(distances, 95)
outliers = distances > threshold          # True for punktene lengst unna
```

Terskelen må velges. I F9 fant 95. prosentil to av tre outliers. Avhengig av dataene kan den gi for mange eller for få, og det finnes ingen generelt riktig terskel. I 2D kan vi se på plottet, men det går ikke i høye dimensjoner.

**2. DBSCAN.** Tilpass DBSCAN med valgte $\varepsilon$ og `min_samples`. Outliers er rett og slett punktene med label $-1$:

```python
outliers = dbscan.labels_ == -1
```

DBSCAN er laget for å finne støy (det er «with Noise» i navnet), så vi slipper å lage en terskelregel. Men DBSCAN er ikke-parametrisk og kan ikke `fit`-es på trening og brukes på test. Den må se alle dataene på én gang, derfor måtte trenings- og testdata slås sammen i F9.

**3. Isolation forest.**

1. Tren mange isolasjonstrær, hvert på en tilfeldig delmengde av treningsdataene trukket *uten* tilbakelegging.
2. Hvert tre splitter på tilfeldige features og tilfeldige verdier til hvert punkt er alene i en løvnode.
3. Anomalier er få og annerledes, så de isoleres tidlig og havner nær rotnoden. De har *kort* stilengde.
4. Kombiner stilengdene over alle trærne. Kort gjennomsnittlig stilengde betyr høy anomaliskår.

Skogen gir robusthet til tross for tilfeldigheten i hvert tre («skoger er som demokratier for trær», F9). Utfordringen den løser, er å bygge trær uten labels: splittene er tilfeldige, og det er stilengden, ikke en klasse, som er resultatet. Metoden brukes mye i næringslivet.

```python
iso_forest = IsolationForest(n_estimators=100, contamination=0.05)
iso_forest.fit(X_train)
outliers = iso_forest.predict(X_test) == -1
```

**Sammenligning.**

| Metode | Idé | Anomali er | Må velge | Ny data? |
|---|---|---|---|---|
| k-means | Avstand til nærmeste sentroide | Langt fra alle sentroider | $k$ og terskel (prosentil) | Ja |
| DBSCAN | Tetthet | Punkt i lavtetthetsområde (label $-1$) | $\varepsilon$, `min_samples` | Nei, må se alle data |
| Isolation forest | Hvor lett punktet isoleres | Kort gjennomsnittlig stilengde | Antall trær, `contamination` | Ja |

**Kobling til øving 3.** Problem 2 ber deg finne radene som ikke hører hjemme i bildedatasettet, vise hva de er og forklare hvordan de ble funnet.

### Formler

Terskel med prosentil $q$ (for eksempel $q = 95$):

$$
\text{anomali hvis } \min_c \lVert\mathbf{x} - \boldsymbol{\mu}_c\rVert > \text{persentil}_q\bigl(\{\min_c \lVert\mathbf{x}' - \boldsymbol{\mu}_c\rVert\}\bigr)
$$

Isolation forest, prinsipp: anomaliskåren vokser når gjennomsnittlig stilengde $\mathbb{E}[h(\mathbf{x})]$ over trærne synker.

### Sammenhenger

- Anomalideteksjon er ubalansert klassifisering (kapittel 2.4) uten labels.
- Isolation forest er et ensemble av trær (kapittel 4) med tilfeldige splitter og trekking uten tilbakelegging, i motsetning til random forest som bruker bootstrapping (med tilbakelegging) og informerte splitter.
- k-means og DBSCAN gjenbrukes fra klynging.

### Vanlige misforståelser

- «Anomalier krever dypere trær.» De isoleres *tidligere* og får kortere stier.
- «Isolation forest trekker med tilbakelegging som bagging.» Notatene og F9 sier uten tilbakelegging.
- «95. prosentil er alltid riktig terskel.» Terskelen må tilpasses dataene.
- «DBSCAN kan trenes på treningsdata og brukes på testdata.» Den er ikke-parametrisk.
- Begrunnelser som «anomalier ligger i områder med lav tetthet» eller «har få naboer» kan være sanne, men hovedpoenget i isolation forest er at de isoleres med få splitter.

### Eksamensoppsummering

- Kunne de tre metodene og hvordan hver definerer en anomali.
- Forklare isolation forest: tilfeldige splitter, kort stilengde betyr anomali, skogen gir robusthet.
- Vite at DBSCAN gir outliers label $-1$ uten terskel, men må se alle data, og at k-means trenger en terskel.
- Kunne parametrene `n_estimators` og `contamination`.
