---
kapittel: 5
tittel: Nevrale nettverk i Keras og PyTorch
ingress: 'Perceptronregelen, hvordan et nett bygges, kompileres og trenes, og hvordan du teller parametre og leser shapes. Øving 3 og prosjekt 4 brukte både Keras og PyTorch.'
---

## Perceptronet {#perceptron}

*Pensum: 5.1 · Kilder: notater 2.1, eksamen 2025 del 5*

```python
activation = np.dot(w, x) + b
prediction = 1.0 if activation >= 0.0 else 0.0          # Heaviside
w = w + learning_rate * (expected - prediction) * x     # Rosenblatts regel

perceptron = Perceptron().fit(X_train, y_train)          # sklearn
print(perceptron.coef_.shape, perceptron.intercept_.shape)
```

#### Hva koden gjør

Perceptronet er en lineær modell med en trappefunksjon (Heaviside) som aktivering. Heaviside har derivert 0 overalt unntatt i 0, der den ikke er definert, så vanlig gradient descent virker ikke. Rosenblatts regel utelater derfor den deriverte:

$$
w_i \leftarrow w_i + \eta\,(y - \hat{y})\,x_i.
$$

Er prediksjonen riktig, er $y - \hat{y} = 0$ og ingenting endres. Predikerer den 0 når svaret er 1, flyttes vektene *mot* $\mathbf{x}$, slik at aktiveringen for dette punktet øker.

Med flere klasser har perceptronet én output-node per klasse. To features og tre klasser gir `coef_` med form `(3, 2)`, altså seks vekter, og `intercept_` med form `(3,)`.

#### Fallgruver

- Et enkelt perceptron kan bare skille lineært separerbare klasser. XOR kan det ikke lære (H25 del 5 spørsmål 2), men en kombinasjon av AND, OR og NOT kan.
- Heaviside er uegnet for gradientbasert læring fordi den ikke er deriverbar overalt og har derivert 0 nesten overalt (H25 del 5 spørsmål 1). Med sigmoid blir nevronet deriverbart.
- I kode legges ofte et ekstra element 1 til i $\mathbf{x}$, slik at biasen blir en vanlig vekt.

## Bygge et nett og telle parametre {#keras-modell}

*Pensum: 5.3, 5.6 · Kilder: notater 2.6, øving 3*

```python
model = keras.Sequential([
    keras.Input(shape=(3,)),                        # 3 input-features
    Dense(6, activation="relu", name="layer1"),     # (3 + 1) * 6 = 24 parametre
    Dense(7, activation="relu", name="layer2"),     # (6 + 1) * 7 = 49 parametre
    Dense(2, activation="softmax", name="output"),  # (7 + 1) * 2 = 16 parametre
])
model.summary()                                  # 89 parametre totalt
model(ops.ones((10, 3))).shape                   # (10, 2)
```

#### Hva koden gjør

Et `Dense`-lag kobler hver node til alle nodene i laget før. Med $n_{\text{inn}}$ input og $n_{\text{ut}}$ noder har laget én vekt per kobling og én bias per node:

$$
\text{parametre} = (n_{\text{inn}} + 1) \cdot n_{\text{ut}}.
$$

Output-shapen er alltid (antall datapunkter, antall noder i siste lag). Valget av siste lag og tap henger sammen med oppgaven:

| Oppgave | Siste lag | Tap i `compile` |
|---|---|---|
| Binær klassifisering | `Dense(1, activation="sigmoid")` | `"binary_crossentropy"` |
| $K$ klasser, labels som heltall | `Dense(K, activation="softmax")` | `"sparse_categorical_crossentropy"` |
| $K$ klasser, one-hot-labels | `Dense(K, activation="softmax")` | `"categorical_crossentropy"` |
| Regresjon | `Dense(1)` (lineær, ingen aktivering) | `"mse"` |

#### Fallgruver

- Uten `keras.Input` vet ikke modellen input-dimensjonen før den kalles første gang. Da er `model.weights` en tom liste, og `summary()` viser `Output shape=?` (notatene 2.6).
- Input-laget har ingen parametre og vises ikke som et eget lag.
- Sigmoid eller softmax i siste lag på en regresjonsoppgave begrenser output til $(0, 1)$, så modellen kan ikke predikere targets som $-20$ eller $40$.
- Softmax over 10 noder krever 10 klasser. `Dense(1, activation="softmax")` gir alltid 1.

#### Fra øvingene

- Øving 3, problem 1: binær klassifisering med ett sigmoid-nevron og `binary_crossentropy`, regresjon med lineær output og MSE. Klassifiseringsdataene var XOR med støy, så nettet trengte skjulte lag.
- Beslutningsgrensen fra `plot_decision_boundary` viste at god testskår ikke betyr god ekstrapolasjon: utenfor området nettet har sett data, er prediksjonene ikke til å stole på.

## Kompilere, trene og evaluere {#keras-trening}

*Pensum: 5.5, 5.6 · Kilder: notater 2.5 og 2.6, øving 3*

```python
model.compile(optimizer=keras.optimizers.SGD(learning_rate=0.01),
              loss="sparse_categorical_crossentropy", metrics=["accuracy"])
stopp = keras.callbacks.EarlyStopping(monitor="val_loss", patience=5,
                                      restore_best_weights=True)
history = model.fit(x_train, y_train, batch_size=64, epochs=50,
                    validation_data=(x_val, y_val), callbacks=[stopp])
plt.plot(history.history["loss"]); plt.plot(history.history["val_loss"])
model.evaluate(x_test, y_test)
proba = model.predict(x_new)                    # sannsynligheter, ikke klasser
klasse = proba.argmax(axis=1)
```

#### Hva koden gjør

`compile` bestemmer optimizer, tap og metrikker. `fit` trener: med $N$ treningspunkter og batch size $B$ blir det $N / B$ oppdateringer per epoke (rundet opp), og en epoke er alltid én runde gjennom alle treningsdataene. `history.history` inneholder tapet og metrikkene per epoke for trening og validering. Early stopping følger med på `val_loss` og stopper når den ikke har blitt bedre på `patience` epoker. `restore_best_weights=True` gir deg vektene fra den beste epoken, ikke den siste.

Arbeidsflyten i notatene er `compile`, `fit`, `predict`, `evaluate` og til slutt `save` og `load_model`.

#### Fallgruver

- Full-batch gradient descent gir 1 oppdatering per epoke, SGD med ett punkt gir $N$, og mini-batch gir $N/B$. Med 10 000 punkter og batch size 500 er det 20 iterasjoner per epoke (H24 oppgave 14).
- `model.predict` på en klassifiseringsmodell gir sannsynligheter. Klassen får du med `argmax` (flere klasser) eller en terskel (binær).
- `validation_split=0.2` holder av de *siste* 20 % av treningsdataene, uten å stokke. Er dataene sortert, gir det en skjev validering.
- Testdata skal ikke brukes som `validation_data`. Da styrer de early stopping.

#### Fra øvingene

- Øving 3: tapskurvene for trening og validering viser overtilpasning når gapet øker. Det endelige tapet er ikke et godt mål på modellen. Rapporter metrikken oppgaven spør etter (accuracy, RMSE) på testdata.
- Mini-batch-trening, læringsrate-scheduling, early stopping og valg av optimizer og aktivering var teknikkene som skulle prøves. De velges med valideringsdata.

## Treningsløkke i PyTorch {#pytorch}

*Pensum: 5.4, 5.6 · Kilder: prosjekt 4 XAI (`SimpleNN`), notater 4.6.3 (DQN)*

```python
class SimpleNN(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = torch.nn.Linear(28 * 28, 128)
        self.fc2 = torch.nn.Linear(128, 10)
    def forward(self, x):
        return self.fc2(torch.relu(self.fc1(x)))      # logits, ingen softmax

loss_fn = torch.nn.CrossEntropyLoss()
for X_batch, y_batch in train_loader:
    optimizer.zero_grad()                 # nullstill gradientene fra forrige steg
    loss = loss_fn(model(X_batch), y_batch)
    loss.backward()                       # backpropagation: regn ut alle gradientene
    optimizer.step()                      # oppdater vektene
```

#### Hva koden gjør

I PyTorch skriver du treningsløkka selv. De fire stegene går igjen overalt, også i DQN-koden i notatene: nullstill gradientene, regn ut tapet med en forward pass, regn ut gradientene bakover med kjerneregelen (`backward`), og la optimizeren ta ett steg. `CrossEntropyLoss` tar imot logits (rå output før softmax) og heltallslabels, og gjør softmax selv.

#### Fallgruver

- Uten `optimizer.zero_grad()` legges gradientene fra hver batch oppå hverandre, og stegene blir feil.
- `backward()` regner bare ut gradientene. Vektene endres ikke før `optimizer.step()`.
- Legger du softmax i `forward` og bruker `CrossEntropyLoss`, blir softmax brukt to ganger.
- Konverterer du tensorer til NumPy midt i beregningen, mister PyTorch oversikten, og gradientene kan ikke regnes ut (notatene 4.6.3).

## Reproduserbarhet {#reproduserbarhet}

*Pensum: 5.6 · Kilder: øving 3 («Results must be reproducible … fix random seeds»), prosjekt 4*

```python
keras.utils.set_random_seed(42)      # setter seed for Python, NumPy og backend
torch.manual_seed(42)                # PyTorch
rng = np.random.default_rng(0)       # egen NumPy-generator
train_test_split(X, y, random_state=0)
KMeans(n_clusters=4, random_state=0)
```

#### Hva koden gjør

Mye i maskinlæring er tilfeldig: oppdelingen i trening og test, startvektene i et nett, stokkingen av mini-batcher, startsentroidene i k-means og trekningene i et bootstrap-utvalg. Med faste seeds blir resultatene like hver gang notebooken kjøres, slik at du kan sammenligne endringer og andre kan gjenskape tallene.

#### Fallgruver

- En seed må settes *før* de tilfeldige operasjonene. Setter du den etter at modellen er laget, er startvektene allerede trukket.
- Gi sklearn-funksjonene en fast `random_state`. Uten den bruker de NumPys globale tilstand, og resultatet avhenger da av hva som er trukket tidligere i notebooken.
- Selv med faste seeds kan GPU-beregninger gi små forskjeller (standardkunnskap, ikke fra kursmaterialet).
