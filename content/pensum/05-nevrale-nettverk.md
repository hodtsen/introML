---
kapittel: 5
tittel: Nevrale nettverk
kilder: Forelesningsnotater 2, F5 andre del og F6 (perceptronet, aktiveringsfunksjoner, lag av noder), F7 (Nevrale nettverk), eksamen 2024 oppg. 12–14, 19–20 og 2025 del 5, øving 3 og 4
---

# Kapittel 5 – Nevrale nettverk

Så langt har vi hatt to typer modeller. I lineær og logistisk regresjon er funksjonsformen gitt, og vi tilpasser parametrene (*parametrisk* modellering). I beslutningstrær er formen ikke gitt, og treningen bygger treet (*ikke-parametrisk* modellering). Begge har begrensninger: regresjonsmodellen er fortsatt lineær i parametrene uansett hvor mye feature engineering vi gjør, og hver splitt i et tre er bare en akseparallell oppdeling. Nevrale nettverk er modeller som *transformerer* dataene ikke-lineært, lag for lag.

> **Avgrensning:** MLP (fully connected feed-forward) er den eneste arkitekturen i kurset. For backpropagation forventes det at du har en intuisjon for hvordan den virker, ikke at du kan utlede den (F7, notater 2.4).

---

## 5.1 Perceptronet {#perceptron}

*Kilder: notater 2.1, F5/F6, eksamen 2025 5.1–5.2.*

### Introduksjon

Perceptronet er forgjengeren til moderne nevrale nettverk. Det er en lineær klassifikator med en hard terskel, og både styrkene og svakhetene forklarer hvorfor moderne nett ser ut som de gjør. Etter denne delen skal du kunne beskrive en TLU, perceptronets læringsregel, og hvorfor perceptronet ikke kan lære XOR.

### Begreper

- **Perceptron:** læringsalgoritme for binær klassifisering, introdusert av McCulloch og Pitts (1943). Den første implementasjonen ble bygget i hardware av Rosenblatt (1957). Tanken var at perceptronet skulle være en *maskin*, ikke et program.
- **Node (nevron):** én beregningsenhet.
- **TLU (threshold logic unit):** en node som regner en vektet sum og sender den gjennom en stegfunksjon. Output er 1 (aktiv) eller 0 (ikke aktiv).
- **Heaviside-funksjonen $H$:** stegfunksjonen, perceptronets aktiveringsfunksjon.
- **Aktiveringsfunksjon:** funksjonen som bestemmer nodens output ut fra den vektede summen.
- **Lineært separerbar:** klassene kan skilles med en rett linje (et hyperplan).

### Forklaring

**Modellen.** En TLU er logistisk regresjon med Heaviside i stedet for sigmoid. Hvilke data som aktiverer noden, avgjøres av vektene $\mathbf{w}$ og $b$. Vektene læres med veiledet læring: treningspunktene sendes gjennom modellen ett og ett, tapet regnes ut, og parametrene oppdateres. Én runde gjennom alle treningspunktene er én epoke.

```python
activation = sum(weight_i * x_i) + bias
prediction = 1.0 if activation >= 0.0 else 0.0
```

**Problemet med gradient descent.** For å bruke gradient descent må vi derivere tapsfunksjonen, og den inneholder prediksjonen, altså Heaviside. Heaviside er ikke deriverbar i hoppet, og den deriverte er 0 overalt ellers. Gradienten sier altså ingenting om hvilken vei vektene bør endres. I Rosenblatts opprinnelige formulering er leddet med den deriverte rett og slett utelatt, og oppdateringen blir feil ganger input.

**Regneeksempel.** $\mathbf{w} = (0, 0)$, $b = 0$, $\mathbf{x} = (1, 2)$, $y = 0$ og $\eta = 0{,}1$. Aktiveringen er 0, så prediksjonen blir 1 (fordi $\geq 0$). Feilen er $y - \hat{y} = -1$. Da blir $b \leftarrow -0{,}1$ og $\mathbf{w} \leftarrow (0 - 0{,}1,\ 0 - 0{,}2) = (-0{,}1;\ -0{,}2)$. Neste gang gir samme punkt negativ aktivering og riktig prediksjon 0.

**Flere klasser.** Har vi flere klasser, setter vi sammen flere TLU-er, én per klasse. To features og tre klasser gir to input-noder koblet til tre output-noder: seks vekter og tre bias-verdier. I sklearn er `Perceptron` en innpakning rundt `SGDClassifier` med `loss="perceptron"` og konstant læringsrate.

**Logiske porter.** Med input $\{0, 1\}$ kan ett perceptron lage:

| Port | Parametre | Sjekk |
|---|---|---|
| AND | $(w_1, w_2, b) = (1, 1, -1{,}5)$ | Bare $(1, 1)$ gir $0{,}5 \geq 0$ |
| OR | $(w_1, w_2, b) = (1, 1, -0{,}5)$ | Bare $(0, 0)$ gir $-0{,}5 < 0$ |
| NOT | $(w_1, b) = (-1;\ 0{,}5)$ | $x = 0$ gir 1, $x = 1$ gir 0 |

**XOR.** Kan ett perceptron lage XOR (1 når nøyaktig én input er 1)? Nei, fordi XOR ikke er lineært separerbart: punktene $(0, 1)$ og $(1, 0)$ ligger på hver sin side av $(0, 0)$ og $(1, 1)$, og ingen rett linje skiller dem. Men flere perceptroner satt sammen klarer det:

$$
\text{XOR}(x_1, x_2) = \text{AND}\bigl(\text{NOT}(\text{AND}(x_1, x_2)),\ \text{OR}(x_1, x_2)\bigr)
$$

To grep tar oss videre: bytte ut aktiveringsfunksjonen (5.2) og sette noder sammen i lag (5.3).

### Formler

TLU-en:

$$
f_{\mathbf{w}, b}(\mathbf{x}) = H(\mathbf{w}^{T}\mathbf{x} + b), \qquad H(z) = \begin{cases}1 & z \geq 0\\ 0 & z < 0\end{cases}
$$

Perceptronets læringsregel, med feilen $y - \hat{y}$:

$$
w_i \leftarrow w_i + \eta\,(y - \hat{y})\,x_i, \qquad b \leftarrow b + \eta\,(y - \hat{y})
$$

For flere klasser, der $w_{i,j}$ er vekten fra input $i$ til node $j$:

$$
w_{i,j} \leftarrow w_{i,j} + \eta\,(y_j - \hat{y}_j)\,x_i
$$

I kode er det vanlig å utvide $\mathbf{x}$ med en konstant 1 først, slik at $b$ blir den første vekten: `w = w + learning_rate * (expected - predicted) * x`.

### Sammenhenger

- Perceptronet er logistisk regresjon med hard terskel. Begge gir lineære beslutningsflater.
- XOR-problemet er det samme som i øving 1: en lineær modell klarer det ikke uten nye features.
- At Heaviside ikke gir brukbare gradienter, er grunnen til at moderne nett bruker deriverbare aktiveringsfunksjoner.

### Vanlige misforståelser

- «Heaviside er uegnet fordi den gir negative verdier eller verdier utenfor $[0, 1]$.» Den gir bare 0 og 1. Problemet er at den ikke er deriverbar overalt og har derivert 0 nesten overalt.
- «Perceptronet kan ikke lære XOR fordi det bare tåler mer enn to features, eller fordi bias må være null.» Grunnen er at XOR ikke er lineært separerbart.
- «Perceptroner krever kontinuerlige labels.» Perceptronet er laget for binære labels.

### Eksamensoppsummering

- Kunne TLU-modellen $H(\mathbf{w}^T\mathbf{x} + b)$ og Rosenblatts læringsregel.
- Forklare hvorfor Heaviside er uegnet for gradientbasert optimering.
- Kunne vekter for AND, OR og NOT, og vite at XOR krever flere perceptroner fordi XOR ikke er lineært separerbart.
- Regne antall vekter og bias-verdier i et perceptron med flere klasser.

---

## 5.2 Aktiveringsfunksjoner {#aktiveringsfunksjoner}

*Kilder: notater 2.2, F5/F6, eksamen 2025 5.3.*

### Introduksjon

En liten endring i input kan få perceptronet til å hoppe fra 0 til 1. Løsningen er å la nodene returnere kontinuerlige verdier. Bytter vi ut Heaviside med en kontinuerlig, ikke-lineær funksjon, har vi laget nodene i et moderne nevralt nettverk. Verre er det ikke. Etter denne delen skal du kunne navn, uttrykk og bruksområde for sigmoid, softmax og ReLU.

> F5: «Disse må dere kjenne til, både matematisk uttrykk og navn.»

### Begreper

- **Sigmoid $\sigma$:** mapper til $(0, 1)$. Brukes i output-laget for *binær* klassifisering.
- **Softmax:** gjør en vektor av tall om til sannsynligheter som summerer til 1. Brukes i output-laget for klassifisering med *flere klasser*, med én output-node per klasse.
- **ReLU (rectified linear unit):** $\max(0, z)$. Kursets standardvalg i skjulte lag.
- **Lineær (ingen) aktivering:** brukes i output-laget for *regresjon*, slik at outputen ikke begrenses til et intervall.

### Forklaring

**Hvorfor kontinuerlig?** Med en kontinuerlig aktiveringsfunksjon fører små endringer i vektene til små endringer i output. Da finnes en gradient, og nettet kan trenes med gradient descent. Den viktigste konsekvensen av å bytte Heaviside med sigmoid er altså at nevronet blir deriverbart.

**Hvorfor ikke-lineær?** Var alle aktiveringene lineære, ville flere lag bare blitt én stor lineær transformasjon (en matrise ganget med en matrise er en matrise). Ikke-lineariteten er det som lar nettet lage kurvede beslutningsflater og lære XOR.

**Hvilken funksjon hvor?**

| Lag og oppgave | Aktivering | Hvorfor |
|---|---|---|
| Skjulte lag | ReLU | Enkel, ikke-lineær og kursets standard |
| Output, binær klassifisering | Sigmoid (én node) | Gir en sannsynlighet i $(0, 1)$ |
| Output, flere klasser | Softmax (én node per klasse) | Sannsynlighetene summerer til 1 |
| Output, regresjon | Ingen (lineær) | Outputen må kunne bli et hvilket som helst tall |

**Regneeksempel (softmax).** Output-laget gir $\mathbf{z} = (2, 1, 0)$. Da er $e^2 \approx 7{,}39$, $e^1 \approx 2{,}72$ og $e^0 = 1$, med sum $11{,}11$, så

$$
\text{softmax}(\mathbf{z}) \approx (0{,}665;\ 0{,}245;\ 0{,}090)
$$

Den største $z$ får størst sannsynlighet, og alle tre summerer til 1. Predikert klasse er den med høyest verdi.

### Formler

$$
\sigma(z) = \frac{1}{1 + e^{-z}}
$$

$$
\text{softmax}(\mathbf{z})_i = \frac{e^{z_i}}{\sum_j e^{z_j}}
$$

$$
\text{ReLU}(z) = \max(0, z)
$$

- $z$ er den vektede summen inn i noden, $\mathbf{w}\mathbf{a} + b$.
- I softmax går summen i nevneren over alle output-nodene $j$.

### Sammenhenger

- Sigmoid i ett nevron er nøyaktig logistisk regresjon (kapittel 1.2).
- Softmax med cross-entropy er tapet for flere klasser, $-\sum_i y_i \log \hat{y}_i$ (kapittel 1.7).
- Regresjon med lineær output og MSE er lineær regresjon i siste lag, på features som de skjulte lagene har laget.

### Vanlige misforståelser

- «Sigmoid gjør modellen ute av stand til binær klassifisering.» Den gir en sannsynlighet som tresholdes til en klasse.
- «Sigmoid gjør nevronet lineært.» Sigmoid er ikke-lineær.
- «Sigmoid gir alltid 0 eller 1.» Den gir verdier i $(0, 1)$.
- «Regresjonsnett trenger sigmoid i output.» Da ville outputen vært låst til $(0, 1)$.

### Eksamensoppsummering

- Kunne navn og uttrykk for sigmoid, softmax og ReLU, og hvor hver brukes.
- Vite at regresjon bruker lineær (ingen) aktivering i output.
- Forklare at kontinuerlige aktiveringer gjør nettet deriverbart og trenbart med gradient descent, og at ikke-linearitet trengs for å lære ikke-lineære sammenhenger.

---

## 5.3 Arkitektur {#arkitektur}

*Kilder: notater 2.3, F5/F6, F7, øving 3 og 4.*

### Introduksjon

Hvordan nodene settes sammen, kalles nettverkets arkitektur. Kurset bruker bare én: MLP, der alle noder i ett lag er koblet til alle noder i neste. Etter denne delen skal du kunne beskrive lagene, skrive aktiveringen til en node, regne ut antall parametre og forklare hvorfor skjulte lag er automatisk feature engineering.

### Begreper

- **Lag:** noder «stablet i høyden», som ikke sender informasjon til hverandre. Informasjon går bare mellom lag.
- **Input-lag:** like mange noder som dataene har features. Henter dataene inn i nettet.
- **Output-lag:** like mange noder som targets (én per klasse eller regresjonsverdi). Er modellens prediksjon.
- **Skjulte (indre) lag:** alle lag mellom input og output. Så mange lag og noder som vi vil.
- **Dypt nevralt nettverk:** mer enn ett skjult lag. Da gjør vi dyp læring. Verre er det ikke.
- **MLP (multi-layer perceptron), fully connected feed-forward:** alle noder i nabolag er koblet (fully connected), og informasjon går bare fremover fra input til output (feed-forward).
- **Forward pass:** å sende data fra input til prediksjon gjennom lagene.

### Forklaring

**Aktiveringen til én node.** Node $j$ i lag $l$ tar alle aktiveringene fra forrige lag, ganger dem med hver sin vekt, legger til bias og sender summen gjennom aktiveringsfunksjonen. Input-laget er lag 0, med $a^{(0)}_i = x_i$.

**Eksempel med to features og tre noder i første skjulte lag.** Skrevet ut blir det tre likninger, én per node, eller én matriselikning. Matrisen er $3 \times 2$, inputvektoren $2 \times 1$, og resultatet $3 \times 1$, altså tre nye verdier.

**Hva de skjulte lagene gjør.** Et lag med $m$ noder gjør en transformasjon fra $n$ verdier inn til $m$ verdier ut. På grunn av aktiveringsfunksjonen er transformasjonen ikke-lineær. Hvert lag lager altså *nye features* av de forrige. Det er automatisk, innebygget feature engineering som utvikler seg mens nettet lærer. Sammenlign med kapittel 3, der vi måtte gjette at $x^2$ var riktig feature.

**Antall parametre.** Hvert lag har én vekt per kobling ($n_{\text{inn}} \cdot n_{\text{ut}}$) og én bias per node ($n_{\text{ut}}$).

| Nett | Utregning | Parametre |
|---|---|---|
| Keras-eksempelet: 3 → 6 → 7 → 2 | $(3\cdot 6 + 6) + (6\cdot 7 + 7) + (7\cdot 2 + 2) = 24 + 49 + 16$ | 89 |
| Øving 4 XAI: 784 → 128 → 64 → 10 | $100\,480 + 8\,256 + 650$ | 109 386 |

Til sammenligning har store språkmodeller hundrevis av milliarder parametre. F7 nevner 175 milliarder.

**Andre arkitekturer.** Konvolusjonslag er vanlige i bildegjenkjenning og transformer-blokker for sekvensielle data som språk, men de er ikke del av kurset.

### Formler

Aktiveringen til node $j$ i lag $l$:

$$
a_j^{(l)} = g\!\left(\sum_{i} w_{ij}^{(l)}\, a_i^{(l-1)} + b_j^{(l)}\right)
$$

- $l$ er lagindeks (0 er input-laget), $i$ er node i forrige lag og $j$ node i dette laget.
- $a_i^{(l-1)}$ er aktiveringen til node $i$ i forrige lag.
- $g$ er aktiveringsfunksjonen i laget.

To features og tre noder på matriseform:

$$
\begin{pmatrix} a_1^{(1)} \\ a_2^{(1)} \\ a_3^{(1)} \end{pmatrix}
= g\!\left(
\begin{pmatrix} w_{11}^{(1)} & w_{21}^{(1)} \\ w_{12}^{(1)} & w_{22}^{(1)} \\ w_{13}^{(1)} & w_{23}^{(1)} \end{pmatrix}
\begin{pmatrix} x_1 \\ x_2 \end{pmatrix}
+ \begin{pmatrix} b_1^{(1)} \\ b_2^{(1)} \\ b_3^{(1)} \end{pmatrix}
\right)
$$

Antall parametre i et Dense-lag:

$$
\text{parametre} = n_{\text{inn}} \cdot n_{\text{ut}} + n_{\text{ut}}
$$

### Sammenhenger

- Skjulte lag erstatter feature engineering for hånd (kapittel 3.2).
- Mange parametre gir lav bias, men høy varians (kapittel 3.5). Nevrale nett er F4s eksempel på modeller som lett overtilpasser.
- Nevrale nett er ikke tolkbare slik regresjonsmodeller og trær er. Det er motivasjonen for forklarbar KI (kapittel 8).

### Vanlige misforståelser

- «Input-laget har vekter og aktiveringsfunksjon.» Input-laget er bare dataene.
- «Noder i samme lag snakker med hverandre.» Informasjon går bare mellom lag.
- «Antall output-noder velger vi fritt.» Det må passe target: én per klasse, eller én per regresjonsverdi.
- «Glem bias når du teller parametre.» Hver node i hvert lag har en bias.

### Eksamensoppsummering

- Kunne beskrive input-, skjulte og output-lag, og hva som bestemmer størrelsen på input og output.
- Kunne skrive $a_j^{(l)}$ og matriseformen, og kontrollere dimensjonene.
- Regne ut antall parametre i et MLP.
- Forklare at skjulte lag gjør ikke-lineære transformasjoner og lager nye features.

---

## 5.4 Backpropagation {#backpropagation}

*Kilder: notater 2.4, F7, eksamen 2024 oppg. 19 og 2025 5.4.*

### Introduksjon

For å trene et nevralt nett med gradient descent trenger vi gradienten av tapet med hensyn på *alle* parametrene. Problemet er at vi ikke vet hva den «riktige» aktiveringen er for nodene i de skjulte lagene. Backpropagation løser dette ved å sende feilen bakover gjennom nettet. Kurset krever en intuisjon for hvordan dette virker, ikke matematikken.

### Begreper

- **Backpropagation (tilbakepropagering):** metode for å regne ut gradienten av tapet med hensyn på alle vekter, ved å jobbe seg bakover fra output med kjerneregelen. F7 siterer den opprinnelige formuleringen: algoritmen justerer gjentatte ganger vektene i nettet for å minimere forskjellen mellom faktisk og ønsket output.
- **Gradientvektor:** like mange elementer som parametre i nettet. Størrelsen på hvert element sier hvor følsomt tapet er for den parameteren.

### Forklaring

**Utgangspunktet (F7 og notatene).** Et nett med tre output-noder predikerer $\hat{\mathbf{y}} = (0{,}1;\ 0{,}1;\ 0{,}8)$ for et punkt med target $\mathbf{y} = (1, 0, 0)$. $\hat{y}_1$ er svært feil (bør opp), $\hat{y}_2$ er nesten riktig, og $\hat{y}_3$ er svært feil (bør ned). Å øke $\hat{y}_1$ er viktigere enn å endre $\hat{y}_2$. Vi kan ikke endre $\hat{\mathbf{y}}$ direkte, bare vektene og bias-verdiene.

**Se på én output-node.** $\hat{y}_1 = g\bigl(w^{(3)}_{11}a^{(2)}_1 + w^{(3)}_{21}a^{(2)}_2 + w^{(3)}_{31}a^{(2)}_3 + w^{(3)}_{41}a^{(2)}_4 + b\bigr)$. To ting kan få $\hat{y}_1$ opp:

1. **Endre vektene $w^{(3)}_{i1}$ direkte,** proporsjonalt med aktiveringene $a^{(2)}_i$. Vi styrker koblingene til de aktive nevronene i lag 2. Jo større $a$-ene er, jo større effekt har $w$-ene.
2. **Endre aktiveringene $a^{(2)}_i$:** gjør nevroner med positiv vekt sterkere og nevroner med negativ vekt svakere. Jo større $w$-ene er, jo større effekt har $a$-ene. Men aktiveringene i lag 2 kan vi bare endre *indirekte*, gjennom vektene i laget før.

**Samle ønskene og gå bakover.**

1. $\hat{y}_1$, $\hat{y}_2$ og $\hat{y}_3$ har hver sine ønsker for vektene og aktiveringene i lag 2, og de er ikke nødvendigvis enige. Vi legger sammen alle ønskene til én liste.
2. Listen over ønskede endringer for $a^{(2)}$ behandles nå som om lag 2 var output, og vi gjentar analysen for vektene inn til lag 2.
3. Slik fortsetter vi bakover til input-laget. Der kan vi endre vektene, men ikke aktiveringene (de er bare dataene), så vi er ferdige.

Vi har propagert feilen bakover fra output til input og fått en liste over hvordan alle parametre bør endres. Det er gradienten.

**Alle datapunktene.** Stopper vi etter ett punkt, lærer nettet bare å predikere $(1, 0, 0)$. Vi gjør det for alle treningspunktene og tar gjennomsnittet av de ønskede endringene. Det gjennomsnittet er (proporsjonalt med) estimatet av gradienten. Siden dette tar svært lang tid, gjør vi det i praksis på mini-batcher (5.5).

**Følsomhet (F7).** En vekt med gradient 50 ganger større enn en annen påvirker tapet 50 ganger mer. Gradienten forteller hvilke vekter det lønner seg å endre.

### Formler

Gradient descent for alle parametrene i nettet, akkurat som før:

$$
\theta_{t+1} = \theta_t - \eta\,\frac{\partial \mathcal{L}}{\partial \theta}
$$

For den som vil se matematikken bak intuisjonen (ikke pensum å utlede): med $z_j^{(l)} = \sum_i w_{ij}^{(l)}a_i^{(l-1)} + b_j^{(l)}$ og $a_j^{(l)} = g(z_j^{(l)})$ gir kjerneregelen

$$
\frac{\partial \mathcal{L}}{\partial w_{ij}^{(l)}} = \underbrace{\frac{\partial \mathcal{L}}{\partial a_j^{(l)}}}_{\text{ønsket endring av } a_j}\cdot\, g'\!\left(z_j^{(l)}\right)\cdot\, a_i^{(l-1)}
$$

Siste faktor er «jo større $a$-ene, jo større effekt har $w$-ene». Den første faktoren regnes ut fra laget etter, og det er derfor vi må gå bakover.

### Sammenhenger

- Backprop er gradient descent for nett med mange lag, og bruker kjerneregelen som vi brukte for logistisk regresjon (kapittel 1.4).
- Aktiveringsfunksjonen må være deriverbar, ellers blir $g'$ meningsløs (5.1).
- Tapet for nevrale nett er ikke konvekst, så gradient descent kan havne i lokale minima.
- Gradientene vi bruker til trening, brukes også til å forklare modeller (gradient-baserte SHAP-metoder og TCAV, kapittel 8).

### Vanlige misforståelser

- «Backprop søker tilfeldig etter gode vekter.» Den regner ut gradienten systematisk.
- «Backprop fjerner skjulte lag som ikke hjelper.» Den endrer vektene, ikke arkitekturen.
- «Backprop gjør alle nevroner like.» Hver vekt får sin egen oppdatering.
- «Vi kan sette aktiveringene i skjulte lag direkte.» De kan bare endres gjennom vektene.

### Eksamensoppsummering

- Forklare at backprop beregner hvordan endringer i hver vekt påvirker tapet, ved hjelp av kjerneregelen bakover gjennom nettet.
- Kunne intuisjonen: «jo større $a$, jo større effekt av $w$», og omvendt, og at ønskede endringer samles og sendes bakover lag for lag.
- Vite at gradienten er et snitt over alle (eller en batch av) treningspunkter.

---

## 5.5 Stochastic gradient descent, batch size og epoker {#sgd}

*Kilder: notater 2.5, F7, eksamen 2024 oppg. 13–14 og 20, notater kap. 8 (eksempeloppgave).*

### Introduksjon

Å regne ut gradienten over hele treningssettet for hvert steg er tregt, særlig med backprop gjennom mange lag. Stochastic gradient descent bruker et tilfeldig utvalg i stedet. Etter denne delen skal du kunne forskjellen på full-batch, SGD og mini-batch SGD, regne ut antall oppdateringer per epoke og forklare hvordan batch size påvirker treningen.

### Begreper

- **Gradient descent (full batch):** gradienten regnes ut fra gjennomsnittlig tap over hele treningssettet. Én oppdatering per epoke. Presis, men tung.
- **Stochastic gradient descent (SGD) på ett punkt:** gradienten fra ett tilfeldig punkt. $N$ oppdateringer per epoke. Et støyete, men forventningsrett (unbiased) estimat av den fulle gradienten. Går tilbake til Robbins og Monro (1951).
- **Mini-batch SGD:** gradienten fra et lite tilfeldig utvalg (en mini-batch). Det er dette folk i dyp læring mener med «SGD».
- **Batch size $B$:** antall punkter per oppdatering. En hyperparameter, ofte en toerpotens som 32, 64 eller 128.
- **Epoke:** alltid én full runde gjennom alle treningspunktene, slik at alle har bidratt til gradienten én gang.

### Forklaring

**Intuisjon (F7).** Gradient descent finner en kort, rett vei ned i dalen. SGD finner også bunnen, men ser mer ut som en full person som snubler ned dalen. Vi trenger ikke en perfekt gradient: så lenge stegene er nesten riktige, kommer vi frem.

**Sammenligning.**

| Variant | Data per oppdatering | Oppdateringer per epoke | Gradient |
|---|---|---|---|
| Gradient descent | Alle $N$ | 1 | Presis, men hver iterasjon er treg |
| SGD | 1 | $N$ | Svært støyete, raske iterasjoner, men mange totalt |
| Mini-batch SGD | $B$ | $N/B$ | Mindre støy enn SGD, mye billigere enn full GD |

**Regneeksempel.** MNIST har 60 000 treningsbilder. F7 setter av 10 000 til validering, så 50 000 blir igjen. Med batch size 64 blir det $50\,000/64 \approx 781$, altså 782 oppdateringer per epoke (den siste batchen er mindre). Med 10 epoker blir det omtrent 7 800 oppdateringer.

**Batch size og støy.**

- Liten batch: mer støy i gradienten, flere og raskere oppdateringer per epoke.
- Stor batch: mer presis gradient, færre oppdateringer per epoke, mer minne og tid per steg.
- Notatene spør om en støyete gradient bør ha høy eller lav læringsrate. Med mye støy peker hvert steg litt feil, og store steg forsterker det. En støyete gradient passer derfor best med en lavere læringsrate.

### Formler

Antall oppdateringer per epoke med $N$ treningspunkter og batch size $B$:

$$
\text{GD: } 1, \qquad \text{SGD: } N, \qquad \text{mini-batch: } \frac{N}{B}
$$

Mini-batch-gradienten for batch $\mathcal{B}$:

$$
\nabla_\theta \mathcal{L} \approx \frac{1}{B}\sum_{i \in \mathcal{B}} \nabla_\theta\, \mathcal{L}\!\left(f(\mathbf{x}^{(i)}; \theta),\, y^{(i)}\right)
$$

### Sammenhenger

- Batch size, læringsrate og antall epoker er hyperparametre og velges med valideringsdata (kapittel 3.3).
- Treningsløkken fra logistisk regresjon i kapittel 1 var full-batch gradient descent.
- `SGDRegressor` i kapittel 3 og `SGDClassifier` bak sklearns `Perceptron` er SGD-varianter.
- Optimizere som Adam og RMSprop (nevnt i øving 3 og brukt i øving 4 og DQN) er videreutviklinger av SGD med tilpasset steglengde. Kurset bruker selv `keras.optimizers.SGD()`.

### Vanlige misforståelser

- «En epoke er én batch.» En epoke er alle treningspunktene én gang.
- «Mindre batch gir mindre støy.» Mindre batch gir *mer* støy.
- «Mindre batch gir overtilpasning.» Det er ikke den typiske konsekvensen. Den typiske er støyete gradienter.
- «SGD gir en skjev gradient.» Den er støyete, men forventningsrett.

### Eksamensoppsummering

- Kunne de tre variantene og antall oppdateringer per epoke: 1, $N$ og $N/B$.
- Regne ut antall iterasjoner per epoke for gitt datasettstørrelse og batch size.
- Vite at batch size er en hyperparameter, og at liten batch gir mer støy i gradientene.

---

## 5.6 Bygge, trene og bruke nevrale nett i Keras {#keras}

*Kilder: notater 2.6, F7, øving 3 og 4.*

### Introduksjon

Kurset bruker Keras og TensorFlow (PyTorch er også tillatt i øvingene). Etter denne delen skal du kunne lese og forstå Keras-kode for å bygge, kompilere, trene, evaluere og lagre en modell, og vite hvorfor en modell uten input-form ikke har vekter.

### Begreper

- **Tensor:** flerdimensjonal array, for eksempel `ops.ones((10, 3))`: 10 datapunkter med 3 features.
- **`Sequential`:** modell der lagene kommer i en lineær sekvens og dataene flyter fra input til output.
- **`Dense`:** fullt koblet lag, der alle noder er koblet til alle noder i forrige og neste lag.
- **`compile`:** velg optimizer, tapsfunksjon og metrikker.
- **`fit`, `predict`, `evaluate`:** trene, gjøre inferens, evaluere.
- **Early stopping:** stopp treningen når en overvåket størrelse, vanligvis `val_loss`, slutter å bli bedre, med en viss tålmodighet.

### Forklaring

**Tre måter å bygge samme nett på (notatene og F7).**

```python
model = Sequential()
model.add(Dense(6, activation="relu", name="layer1"))
model.add(Dense(7, activation="relu", name="layer2"))
model.add(Dense(2, activation="softmax", name="output"))
```

Det samme kan gjøres ved å gi `Sequential` en liste med lag, eller ved å kalle lagene på hverandre, `layer3(layer2(layer1(x)))`. Det siste gir ikke et modellobjekt. Lagene oppfører seg som elementer i en liste (`model.layers`), og et godt mentalt bilde er lag stablet oppå hverandre.

**Ingen vekter før input-formen er kjent.** Bygger vi modellen uten å si noe om input og uten å kalle den på data, gir `model.weights` en tom liste og `model.summary()` viser `Output shape=?`. Keras vet ikke hvor mange inputs det første laget får, så vektmatrisen kan ikke lages. Vektene lages når modellen evalueres på data, eller når vi oppgir input-formen:

```python
model = keras.Sequential()
model.add(keras.Input(shape=(3,)))
model.add(Dense(6, activation="relu"))   # 3·6 + 6 = 24 parametre
model(x).shape                           # (10, 6): 10 datapunkter, 6 noder i siste lag
```

`Input` er et objekt, ikke et lag, så det vises ikke i lagoversikten. Output-formen er alltid antall datapunkter ganger antall noder i siste lag. Et lag med 5 noder på data med 3 features har vektmatrise $(3, 5)$ og bias $(5,)$.

**MNIST-eksempelet (F7).** Bildene er $28 \times 28$ gråtonepiksler med verdier 0–255. De flates ut til 784 verdier (flattening) og deles på 255 for å skalere til $[0, 1]$. Input er 784, output er 10 (sifrene 0–9).

```python
model.compile(optimizer=keras.optimizers.SGD(),
              loss=keras.losses.SparseCategoricalCrossentropy(),
              metrics=["accuracy"])
history = model.fit(x_train, y_train, batch_size=64, epochs=10,
                    validation_data=(x_val, y_val))
```

`SparseCategoricalCrossentropy` er cross-entropy for flere klasser der labels er gitt som heltall (0, 1, 2, …) i stedet for one-hot-vektorer som $[1, 0, \dots, 0]$. Ett tall per kategori kalles en sparse representasjon. Etter 10 epoker hadde F7-modellen fortsatt å forbedre seg, så den kunne med fordel trent lenger.

**Prediksjon.** `model.predict` forventer en liste av datapunkter, så ett bilde må pakkes inn i en liste. Outputen har ett tall per klasse, og predikert klasse er den med høyest verdi.

**Følg med og stopp i tide.** Plott `history.history["loss"]` og `history.history["val_loss"]`. Stopp når begge flater ut, men før treningstapet blir mye lavere enn valideringstapet, som er et typisk tegn på overtilpasning. Keras har early stopping med `monitor="val_loss"` og en tålmodighet.

**Arbeidsflyten.**

| Steg | Kall |
|---|---|
| Bygg og kompiler (optimizer, tap, early stopping) | `model.compile()` |
| Tren | `model.fit()` |
| Prediker (inferens) | `model.predict()` |
| Evaluer på testdata med en metrikk (metrikk ≠ tap) | `model.evaluate()` |
| Lagre og last inn | `model.save("navn.keras")`, `keras.models.load_model("navn.keras")` |

**Kobling til øving 3.** Problem 1 krever nevrale nett for XOR-klassifisering (minst 90 %) og regresjon på $x^3 - 3xy^2$ (RMSE høyst 0,25), minst tre teknikker blant batch-størrelse, læringsrateplan, tuning, optimizere, aktiveringsfunksjoner og early stopping, og reproduserbare resultater (faste random seeds). Du skal kunne forklare arkitekturen (antall parametre, aktiveringer), lese trenings- og valideringskurvene, og vurdere om modellen generaliserer til større featureverdier enn den er trent på. Et ReLU-nett er stykkevis lineært, så utenfor treningsområdet fortsetter det bare lineært og treffer ikke $x^3$-formen.

**Kobling til øving 4 XAI.** MLP-en 784 → 128 → 64 → 10 med ReLU, cross-entropy og Adam på MNIST forklares med SHAP (kapittel 8).

### Formler

Form på output fra et Dense-lag med $m$ noder på en batch med $B$ datapunkter og $n$ features:

$$
\underbrace{(B \times n)}_{\text{input}}\cdot\underbrace{(n \times m)}_{\text{vekter}} + \underbrace{(m)}_{\text{bias}} \;\longrightarrow\; (B \times m)
$$

### Sammenhenger

- `fit`, `predict` og `evaluate` er de samme navnene som i sklearn og i egen logistisk regresjon (kapittel 1.4).
- Valideringsdata og early stopping er de samme verktøyene som i kapittel 3.3.
- Metrikk og tapsfunksjon er fortsatt ikke det samme (kapittel 1.5).

### Vanlige misforståelser

- «En modell har vekter så snart lagene er lagt til.» Ikke før input-formen er kjent.
- «`Input` er et lag.» Det er et objekt og vises ikke som lag.
- «Sparse categorical cross-entropy er en annen tapsfunksjon enn cross-entropy.» Det er cross-entropy med labels som heltall.
- «Trenings-accuracy er resultatet vi rapporterer.» Vi rapporterer `evaluate` på testdata.

### Eksamensoppsummering

- Kunne lese Keras-kode: `Sequential`, `Dense`, aktiveringer, `compile`, `fit` med `batch_size` og `epochs`, `predict`, `evaluate`, `save` og `load_model`.
- Regne ut parametre og output-form for et lag.
- Forklare hvorfor en modell uten input-form ikke har vekter.
- Kjenne early stopping med `monitor="val_loss"`.
