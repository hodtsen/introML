---
kapittel: 2
tittel: Bayes, ubalanserte data og beslutningstrær
ingress: 'Telling av sannsynligheter med pandas, balansering av klasser og beslutningstrær i sklearn. Øving 2 brukte alt dette.'
---

## Naiv Bayes ved telling {#naiv-bayes}

*Pensum: 2.1, 2.2 · Kilder: notater 1.2.7 og 1.2.8, øving 2 problem 2 (vikingdataene, «do not import libraries»)*

```python
p_c = df["survived"].value_counts(normalize=True)              # p(C)
s1 = df[df["survived"] == 1]                                    # bare de som overlevde
p_sex_1 = s1["sex"].value_counts(normalize=True)                # p(sex | C = 1)
p_role_1 = s1["role"].value_counts(normalize=True)              # p(role | C = 1)

score_1 = p_c[1] * p_sex_1["Male"] * p_role_1["Hirdman"]        # osv. for alle features
score_0 = p_c[0] * p_sex_0["Male"] * p_role_0["Hirdman"]
overlever = score_1 > score_0
```

#### Hva koden gjør

Bayes' teorem gir $p(C_k \mid \mathbf{x}) = p(\mathbf{x} \mid C_k)\,p(C_k) / p(\mathbf{x})$. Naiv Bayes antar at featurene er betinget uavhengige gitt klassen, slik at likelihooden blir et produkt:

$$
p(C_k \mid \mathbf{x}) \propto p(C_k) \prod_i p(x_i \mid C_k).
$$

`value_counts(normalize=True)` gir relative frekvenser, altså estimater av sannsynlighetene. Ved å filtrere på klassen først får vi de betingede sannsynlighetene. Vi trenger ikke $p(\mathbf{x})$ for å avgjøre hvilken klasse som er mest sannsynlig, fordi den er lik for begge klassene og forsvinner når vi sammenligner `score_1` med `score_0`.

#### Fallgruver

- Uten `normalize=True` får du antall, ikke sannsynligheter.
- $p(x_i \mid C)$ estimeres fra datapunktene *i klassen*, ikke fra hele datasettet.
- Har en kombinasjon aldri forekommet i en klasse, blir sannsynligheten 0, og hele produktet blir 0.
- Kontinuerlige features som alder må deles inn i intervaller først, for eksempel med `np.histogram(data, bins=10)` (notatene 1.2.8).
- `score_1` og `score_0` er ikke sannsynligheter før du deler på summen av dem. Det er bare forholdet som avgjør klassen.

#### Fra øvingene

- Øving 2, problem 2: $p(C)$ er lett å telle, men $p(\mathbf{x} \mid C)$ og $p(\mathbf{x})$ for alle featurene samtidig er simultanfordelinger med for få punkter per kombinasjon. Derfor naiv Bayes, og derfor sammenligner man bare `score_1` og `score_0`.
- En god første analyse er å sammenligne overlevelsesraten per kategori (for eksempel `df.groupby("sex")["survived"].mean()`) med basisraten. Features som skiller seg tydelig ut, predikerer bedre enn gjetting.

## Sjekke om features er uavhengige {#crosstab}

*Pensum: 2.2 · Kilder: notater 1.2.8*

```python
p_cond = pd.crosstab(df.Pclass, df.Sex, normalize="index")   # p(Sex | Pclass), hver rad summerer til 1
p_marg = df.Sex.value_counts(normalize=True)                  # p(Sex)
p_cond.plot.bar(rot=0)
```

#### Hva koden gjør

`pd.crosstab` lager en krysstabell over to kategoriske variabler. Med `normalize="index"` deles hver rad på radsummen, så tabellen viser fordelingen av kjønn *innen* hver passasjerklasse. Hvis `Pclass` og `Sex` var uavhengige, ville hver rad vært lik den marginale fordelingen `p_marg`. Er radene ulike, er featurene avhengige, og antakelsen i naiv Bayes holder ikke helt.

#### Fallgruver

- `normalize="index"` normaliserer radene, `normalize="columns"` kolonnene og `normalize=True` hele tabellen. Det gir tre ulike betingede eller simultane fordelinger.
- At to features er avhengige, gjør ikke naiv Bayes ubrukelig. Den kan fortsatt klassifisere godt, men sannsynlighetene den gir er ikke til å stole på.

## Under- og oversampling {#sampling}

*Pensum: 2.4 · Kilder: notater 1.2.10, eksamen 2024 oppgave 8, eksamen 2025 del 2 spørsmål 3*

```python
rng = np.random.default_rng(0)
idx_maj = np.where(y_train == 0)[0]
idx_min = np.where(y_train == 1)[0]

# Undersampling: behold like mange fra majoriteten som minoriteten har
idx_u = np.concatenate([rng.choice(idx_maj, size=len(idx_min), replace=False), idx_min])
# Oversampling: trekk fra minoriteten med tilbakelegging til den er like stor
idx_o = np.concatenate([idx_maj, rng.choice(idx_min, size=len(idx_maj), replace=True)])
X_bal, y_bal = X_train[idx_o], y_train[idx_o]
```

#### Hva koden gjør

Med svært ubalanserte klasser lærer modellen lett å bare predikere majoritetsklassen. Undersampling kaster punkter fra majoriteten, oversampling dupliserer punkter fra minoriteten, slik at klassene blir like store. Alternativet er å vekte tapsfunksjonen (se cross-entropy i kapittel 1).

Med 2000 punkter der 90 % er klasse A (H24 oppgave 8): undersampling beholder 200 av A, og oversampling legger til $1800 - 200 = 1600$ punkter i B.

#### Fallgruver

- Oversampling må trekke med tilbakelegging (`replace=True`), ellers kan du ikke trekke 1800 punkter fra 200.
- Dupliserte minoritetspunkter kan gi overtilpasning, fordi modellen ser nøyaktig de samme punktene mange ganger (H25 del 2 spørsmål 3). Oversampling endrer ikke fordelingen til minoritetsklassen, den gjentar bare punktene.
- Balanser bare treningsdataene. Testdataene skal ha den virkelige fordelingen, og duplikater som havner både i trening og test gir et for godt testresultat.
- Undersampling kaster informasjon. Med lite data kan det koste mer enn det gir.

## Beslutningstrær i sklearn {#beslutningstre}

*Pensum: 2.5, 2.6 · Kilder: notater 1.3.4 (Palmer Penguins-koden), øving 2*

```python
from sklearn.tree import DecisionTreeClassifier, plot_tree
from sklearn.model_selection import cross_val_score

clf = DecisionTreeClassifier(criterion="gini", max_depth=5, random_state=0)
scores = cross_val_score(clf, X_train, y_train, cv=5)      # fem accuracy-verdier
print(f"CV: {scores.mean():.3f} ± {scores.std():.3f}")
clf.fit(X_train, y_train)
acc = accuracy_score(y_test, clf.predict(X_test))
plot_tree(clf)
```

#### Hva koden gjør

`criterion` velger urenhetsmålet treet bruker for å velge splitt: `"gini"` (standard), `"entropy"` eller `"log_loss"`. Gini og entropi gir i hovedsak de samme splittene, men Gini er raskere fordi den ikke trenger en logaritme. `max_depth` er en hyperparameter som stopper treet før det blir for dypt. `cross_val_score` trener og evaluerer modellen fem ganger på ulike deler av treningsdataene og gir et mer stabilt estimat enn én valideringssplitt. I hver node i `plot_tree` ser du splittregelen, urenheten (`gini`), antall punkter og fordelingen per klasse.

#### Fallgruver

- Uten `max_depth` (eller andre stoppkriterier) vokser treet til alle løvnoder er rene, og det overtilpasser.
- Trær trenger ikke skalerte features. En splitt er en terskel på én feature, og skalering flytter bare terskelen. Det var et av spørsmålene i øving 2.
- `cross_val_score` gjøres på treningsdataene. Testdataene brukes én gang til slutt.
- En løvnode med punkter fra begge klassene predikerer majoritetsklassen i noden.

#### Fra øvingene

- Øving 2, problem 1: beslutningsgrensen til et tre består av akseparallelle rektangler. Med ubalanserte data ble plottet nesten ensfarget, fordi treet predikerte majoritetsklassen nesten overalt.
- Lav dybde ga høy bias, stor dybde ga overtilpasning. Gini, entropi og log loss ga omtrent samme resultat, og valget gjøres med kryssvalidering, ikke testdata.
- AdaBoost (`AdaBoostClassifier`) på samme data reduserer bias ved å trene svake modeller etter hverandre og vekte opp feilene.

## Pseudokode for å bygge et beslutningstre {#pseudokode-tre}

*Pensum: 2.6 · Kilder: notater 1.3.4 («dere bør kunne angi pseudokode for å bygge et beslutningstre»)*

```python
def build_decision_tree(data, features, depth):
    if all data in same class:
        return class label
    elif no features left or depth >= max_depth:
        return majority class in data
    elif no data left:
        return majority class in parent node
    else:
        f = feature with largest information gain (or Gini reduction)
        for each partition of data split on f:
            build_decision_tree(partition, features - f, depth + 1)
```

#### Hva koden gjør

Treet bygges rekursivt ovenfra. I hver node velges featuren som reduserer usikkerheten mest, dataene deles etter verdiene til featuren, og samme prosedyre kalles på hver del med featuren fjernet og dybden økt. Rekursjonen stopper i tre tilfeller: alle punktene har samme klasse, det er ingen features igjen (eller maks dybde er nådd), eller det er ingen data igjen.

Informasjonsgevinsten er entropien før splitten minus vektet entropi etter:

$$
\Delta I = I_{\text{før}} - \sum_i \frac{p_i + n_i}{p + n}\, I\!\left(\frac{p_i}{p_i + n_i}, \frac{n_i}{p_i + n_i}\right).
$$

#### Fallgruver

- Featuren velges for å *maksimere* reduksjonen i urenhet, ikke for å minimere antall verdier eller tilfeldig (H24 oppgave 15).
- Maks dybde er en hyperparameter som velges før treet bygges.
- «Ingen data igjen» og «ingen features igjen» gir ulike svar: i det første tilfellet finnes det ingen punkter å telle, så man bruker forelderen.
