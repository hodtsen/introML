---
kapittel: 7
tittel: Reinforcement learning
kilder: Forelesningsnotater 4, F10 (Reinforcement learning), F11 (Reinforcement learning del 2), eksamen 2024 oppg. 31–33 og 2025 del 8–9 og 10.4, notater kap. 8, øving 4 RL (Project4_RL)
---

# Kapittel 7 – Reinforcement learning

Reinforcement learning (RL) er den tredje læringsformen: en agent lærer å ta beslutninger i et miljø ved å prøve seg frem og få belønning. Teorien er stor, og kurset studerer bare én læringsform, Q-læring, først med en tabell og så med et nevralt nett (DQN).

> **Avgrensning:** Overgangssannsynligheter trenger dere ikke tenke på i år, og miljøene er deterministiske (F10, F11, notater 4.1). DRL er ikke del av prosjektene, og «på eksamen vil kun konseptuelle spørsmål om DRL være relevante» (notater 4.6).
>
> **F10:** «Bli for guds skyld komfortabel med Bellman-likningen.»

---

## 7.1 RL-loopen, MDP og Markov-egenskapen {#mdp}

*Kilder: notater 4.1, F10, eksamen 2025 8.1, notater kap. 8 (eksempeloppgave).*

### Introduksjon

RL ser helt annerledes ut enn veiledet læring: det finnes ikke et datasett med riktige svar. Agenten genererer sine egne data ved å handle, og får bare tilbakemelding i form av belønning. Etter denne delen skal du kunne tegne og forklare RL-loopen, definere en MDP og forklare Markov-egenskapen.

### Begreper

- **Agent:** hva som helst som tar inn en tilstand og returnerer en handling, fra en tabell til et nevralt nett. Begrepet er eldre enn dagens «AI-agenter» i forbrukerteknologi (en språkmodell i en loop), som er noe annet.
- **Environment (miljø):** det agenten handler i. Gir tilstander og belønning.
- **State (tilstand) $S_t$:** situasjonen ved steg $t$.
- **Action (handling) $A_t$:** det agenten velger å gjøre.
- **Reward (belønning) $R_{t+1}$:** tilbakemelding fra miljøet etter handlingen.
- **Episode:** én kjøring fra starttilstand til miljøet er ferdig (`done`).
- **Markov-egenskapen:** fremtiden er uavhengig av fortiden gitt nåtiden. Neste tilstand avhenger bare av nåværende tilstand og valgt handling, ikke av hvordan vi kom dit. Slike prosesser kalles også *memoryless*.
- **MDP (Markov decision process):** en sekvensiell beslutningsprosess med Markov-egenskapen.

### Forklaring

<!-- figur: rl-lokke -->

**RL-loopen.**

1. Miljøet gir agenten en tilstand $S_t$.
2. Basert på $S_t$ velger agenten en handling $A_t$.
3. Handlingen gir en belønning $R_{t+1}$ og setter miljøet i en ny tilstand $S_{t+1}$.
4. Basert på $S_{t+1}$ velger agenten en ny handling, og så videre.

**Antakelsen i loopen.** Agenten velger handling bare ut fra $S_t$ og får ikke vite noe om tidligere tilstander. Det svarer til antakelsen om at fremtiden bare avhenger av nåtiden og valgt handling. Det er Markov-egenskapen. (En slide i F10 skriver «basert på $R_{t+t}$»; det skal være $S_{t+1}$.)

**Eksempel: AlphaZero.** Et nevralt nett som bare har lært ved å spille mot seg selv («zero» annen kunnskap). Brettets tilstand er state, valg av trekk (via søk i et spilltre) er action, og spillets slutt gir reward $1$ (seier), $-1$ (tap) eller $0$ (remis).

**MDP formelt.** En MDP er en 4-tuppel $(S, A, P_A, R_A)$: tilstandsrommet, handlingsrommet, overgangssannsynlighetene og belønningene. Overgangssannsynlighetene er ikke pensum i år.

**Hvordan Markov-egenskapen påvirker verdien.** Siden fremtiden bare avhenger av nåværende tilstand, kan verdien av en tilstand skrives som en funksjon av tilstanden alene: den avhenger av fremtidige belønninger gitt nåværende tilstand og handlingene som følger, ikke av hele historien.

### Formler

MDP:

$$
(S, A, P_A, R_A), \qquad P_A(S_t, S_{t+1}) = P(S_{t+1} \mid S_t, A_t)
$$

Markov-egenskapen:

$$
P(S_{t+1} \mid S_t, A_t, S_{t-1}, A_{t-1}, \dots) = P(S_{t+1} \mid S_t, A_t)
$$

- $S$ er mengden tilstander (state space), og $A$ er mengden handlinger (action space).
- $R_A(S_t, S_{t+1})$ er den umiddelbare belønningen for overgangen.

### Sammenhenger

- Veiledet læring: data med riktige svar. Uveiledet læring: data uten svar. RL: ingen fast data, agenten lager dataene selv gjennom handlinger, og tilbakemeldingen er en belønning, ikke et riktig svar.
- Markov-egenskapen er en antakelse, akkurat som uavhengige features i naiv Bayes. Holder den ikke, må tilstanden utvides til å inneholde den historien som trengs.

### Vanlige misforståelser

- «Neste tilstand avhenger av hele historien.» Det er det motsatte av Markov-egenskapen.
- «Neste tilstand avhenger bare av belønningen.» Den avhenger av tilstanden og handlingen.
- «En RL-agent er en språkmodell.» I RL er en agent alt som mapper tilstand til handling.
- «Verdien av en tilstand avhenger bare av belønningen i tilstanden.» Den inkluderer forventet fremtidig belønning.

### Eksamensoppsummering

- Kunne tegne RL-loopen med $S_t$, $A_t$, $R_{t+1}$ og $S_{t+1}$.
- Formulere Markov-egenskapen («fremtiden er uavhengig av fortiden gitt nåtiden») og koble den til loopen.
- Kunne en MDP som 4-tuppel og vite at overgangssannsynligheter ikke er pensum i år.

---

## 7.2 Policy, reward og verdi {#policy}

*Kilder: notater 4.1–4.2, F10, eksamen 2025 8.2.*

### Introduksjon

Hva skal agenten lære? En regel for hvilken handling den skal velge i hver tilstand. For å lære en god regel må den kunne vurdere langsiktige konsekvenser, ikke bare umiddelbar belønning. Etter denne delen skal du kunne forskjellen på policy, reward og verdi.

### Begreper

- **Policy $\pi$:** måten agenten velger handling fra tilstand på. Deterministisk: én handling per tilstand. Stokastisk: $\pi(A_t \mid S_t)$ gir sannsynligheten for hver handling.
- **Optimal policy $\pi^*$:** policyen som maksimerer total (kumulativ) belønning fra miljøet.
- **Kumulativ reward:** summen av belønninger over tid.
- **Verdifunksjon (utility, value function):** hvor verdifull en tilstand og handling er på lang sikt under en policy. Den kvantifiserer forventet verdi av å være i en tilstand, gjøre en handling, og så følge policyen videre.
- **Q-funksjonen:** verdifunksjonen kurset bruker, som gir verdien av et tilstand–handling-par.

### Forklaring

**Tre ting som lett blandes.**

| Begrep | Hva det er | Hvor det kommer fra |
|---|---|---|
| Reward | Umiddelbar tilbakemelding på en handling | Gis av miljøet |
| Verdi (Q) | Forventet kumulativ fremtidig belønning av en handling i en tilstand under en policy | Må læres |
| Policy | Regelen for å velge handling gitt tilstand | Følger av verdiene, for eksempel «velg handlingen med høyest Q» |

Den springende forskjellen: reward *får* vi fra miljøet, Q *må vi lære*.

**Hvorfor verdi og ikke bare reward?** I tre på rad får agenten ingen belønning før spillet er over. Et trekk midt i spillet har reward 0, men kan likevel være avgjørende. Verdifunksjonen sprer belønningen bakover, slik at agenten kan vurdere de langsiktige konsekvensene av et trekk. Det overordnede målet i RL er å finne en optimal policy som maksimerer verdien for alle tilstander.

### Formler

Q-funksjonen er en avbildning fra tilstand–handling-par til et reelt tall:

$$
Q : S \times A \to \mathbb{R}
$$

Grådig (greedy) policy ut fra Q:

$$
\pi(s) = \arg\max_{a} Q(s, a)
$$

### Sammenhenger

- Policy i RL svarer til modellens prediksjonsregel i veiledet læring. Verdifunksjonen er det modellen lærer.
- Reward er ikke det samme som tap. Mer om det i 7.7.

### Vanlige misforståelser

- «Policyen velger handling basert på forrige belønning.» Den velger ut fra nåværende tilstand.
- «Policyen er tabellen over Q-verdier.» Q-tabellen gir verdiene. Policyen er regelen som bruker dem.
- «En policy oppdaterer Q-verdier.» Det er læringsalgoritmen som oppdaterer.
- «Verdien av en tilstand er rewarden der.» Verdien inkluderer fremtidige belønninger.

### Eksamensoppsummering

- Definere policy (deterministisk og stokastisk) og optimal policy.
- Forklare forskjellen på reward og verdi: reward gis av miljøet, verdi (Q) læres og inkluderer fremtiden.
- Vite at målet er å finne en policy som maksimerer kumulativ belønning.

---

## 7.3 Q-læring og Bellman-oppdateringen {#q-laering}

*Kilder: notater 4.2 og 4.5, F10, eksamen 2024 oppg. 31–32 og 2025 8.4, øving 4 RL.*

### Introduksjon

Q-læring lærer Q-verdiene iterativt fra erfaring med Bellman-oppdateringen. Formelen er kjernen i hele RL-delen av kurset. Etter denne delen skal du kunne skrive den, forklare hvert ledd, forstå effekten av $\alpha$ og $\gamma$, og regne en oppdatering for hånd.

### Begreper

- **Q-læring (Q-learning):** å oppdatere Q-verdiene ut fra erfaring.
- **Bellman-oppdateringen:** regelen som gir ny Q-verdi fra gammel verdi, belønning og beste fremtidige verdi.
- **Læringsrate $\alpha$:** hvor mye ny informasjon påvirker Q-verdien, altså hvor mye av den gamle verdien som beholdes.
- **Diskonteringsfaktor $\gamma$ (discount factor):** hvor mye fremtidige verdier teller sammenlignet med umiddelbar belønning.
- **TD-target:** $R_{t+1} + \gamma \max_A Q(S_{t+1}, A)$, den nye estimerte verdien. Null fremtidig verdi når episoden er ferdig.

### Forklaring

**Leddene i Bellman-oppdateringen.**

| Ledd | Betydning |
|---|---|
| $Q^{\text{new}}(S_t, A_t)$ | Oppdatert verdi av å være i $S_t$ og gjøre $A_t$ |
| $Q(S_t, A_t)$ | Gammel verdi. 0 i starten for en tabell, tilfeldig for et nevralt nett. |
| $R_{t+1}$ | Belønningen for å gjøre $A_t$ i $S_t$ |
| $\max_A Q(S_{t+1}, A)$ | Estimat av optimal fremtidig verdi: den beste Q-verdien i neste tilstand, over alle handlinger |
| $\alpha$ | Læringsraten |
| $\gamma$ | Diskonteringsfaktoren |

**Prosessen.**

1. Initialiser Q (for eksempel med nuller).
2. For hvert steg: agenten er i $S_t$, velger $A_t$, observerer $R_{t+1}$ og havner i $S_{t+1}$.
3. Oppdater $Q(S_t, A_t)$ med Bellman. Gjenta til loopen er ferdig.

Er episoden ferdig, finnes det ingen fremtid, og $\max_A Q(S_{t+1}, A)$ settes til 0.

**Effekten av $\alpha$ (F10).**

- $\alpha = 0$: Q endres aldri, så ingenting læres.
- $\alpha = 1$: den gamle verdien glemmes helt og erstattes av det nye estimatet.
- For lav $\alpha$: ny belønning og nye verdier klarer ikke å påvirke Q.
- For høy $\alpha$: agenten glemmer det den kan, og treningen blir ustabil.

**Effekten av $\gamma$ (F10).**

- $\gamma = 0$: bare umiddelbar belønning teller, agenten er kortsiktig.
- $\gamma$ nær 1: fremtidige belønninger teller nesten like mye som umiddelbare.
- For lav $\gamma$: informasjon om fremtidige tilstander forplanter seg ikke effektivt bakover.
- For høy $\gamma$: beste mulige fremtidige utfall kan dominere over den faktiske verdien av nåværende tilstand.
- $\gamma < 1$ betyr at belønning nå er mer verdt enn samme belønning senere.

**Regneeksempel.** $\alpha = 0{,}5$, $\gamma = 0{,}9$, gammel $Q(S_t, A_t) = 2$, belønning $R_{t+1} = 1$ og beste Q i neste tilstand lik 4:

$$
Q^{\text{new}} = 0{,}5 \cdot 2 + 0{,}5\,(1 + 0{,}9 \cdot 4) = 1 + 0{,}5 \cdot 4{,}6 = 3{,}3
$$

**Hvorfor agenten finner korteste vei selv om hvert steg gir 0 (øving 4).** I TrondheimEnv gir hvert steg 0 og målet +10. Med $\gamma = 0{,}9$ forplanter verdien seg bakover og krymper med en faktor 0,9 per steg: ett steg fra mål er verdien 10, to steg unna 9, tre steg unna 8,1, og så videre. Kortere veier har høyere Q-verdi, så den grådige policyen velger dem. Med $\gamma = 1$ forsvinner denne preferansen (alle veier til målet er like mye verdt), og med $\gamma = 0$ når informasjonen om målet aldri lenger enn ett steg bakover.

### Formler

Bellman-oppdateringen (kursets form):

$$
Q^{\text{new}}(S_t, A_t) \leftarrow (1 - \alpha)\, Q(S_t, A_t) + \alpha\left(R_{t+1} + \gamma \max_{A} Q(S_{t+1}, A)\right)
$$

Samme formel skrevet med TD-feilen, slik koden i notatene gjør (`td_target`, `td_delta`):

$$
Q(S_t, A_t) \leftarrow Q(S_t, A_t) + \alpha\Bigl(\underbrace{R_{t+1} + \gamma \max_{A} Q(S_{t+1}, A)}_{\text{TD-target}} - Q(S_t, A_t)\Bigr)
$$

Multipliser ut den første formen, så får du den andre. Den andre viser at Q flyttes en andel $\alpha$ av veien mot target, akkurat som gradient descent flytter parametre en andel $\eta$ i retning av lavere tap.

Q-verdien som forventet diskontert fremtidig belønning:

$$
Q^{\pi}(s, a) = \mathbb{E}\!\left[R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \dots \;\middle|\; S_t = s, A_t = a, \text{følg } \pi\right]
$$

(Den siste formelen er standarddefinisjonen. Notatene sier det samme i ord: «forventet kumulativ fremtidig reward av å gjøre action A i state S og følge policyen deretter».)

### Sammenhenger

- $\alpha$ spiller samme rolle som læringsraten $\eta$ i gradient descent.
- I DQN blir TD-target treningsmålet $y$, og avviket blir tapet (7.6).

### Vanlige misforståelser

- «$\gamma$ styrer hvor ofte agenten utforsker.» Det er $\varepsilon$.
- «$\gamma$ avgjør om policyen er deterministisk eller stokastisk.» Den vekter fremtidige belønninger.
- «$\alpha = 1$ gir raskest læring.» Det kaster all gammel kunnskap og kan gi ustabil trening.
- «Max-leddet er belønningen i neste tilstand.» Det er beste *Q-verdi* i neste tilstand.
- «Ved slutten av en episode brukes max Q fra neste tilstand som vanlig.» Fremtidig verdi er 0 når episoden er ferdig.

### Eksamensoppsummering

- Kunne Bellman-oppdateringen utenat, i begge former, og forklare hvert ledd.
- Forklare effekten av $\alpha = 0$, $\alpha = 1$, $\gamma = 0$, $\gamma$ nær 1 og for høy eller lav verdi av hver.
- Regne en oppdatering for hånd.
- Forklare hvordan diskontering gir korteste vei når hvert steg gir 0.

---

## 7.4 Environments og Q-læring i praksis {#q-tabell}

*Kilder: notater 4.3–4.5, F10, øving 4 RL.*

### Introduksjon

For å trene en agent trenger vi et miljø med et fast grensesnitt, en agent med en Q-tabell, og en læringsløkke. Etter denne delen skal du kunne Gym-grensesnittet, hva en tabellagent består av, og hvordan Q-verdier tolkes etter trening.

### Begreper

- **Gym/Gymnasium:** populært bibliotek med RL-miljøer (CartPole, MountainCar, Pendulum, FrozenLake). Grensesnittet er nærmest en standard.
- **`env.reset()`:** setter miljøet i starttilstand og returnerer tilstanden (og info).
- **`env.step(action)`:** utfører handlingen og returnerer ny tilstand, belønning, `done` og info. Gymnasium returnerer også `truncated` (for eksempel ved maks antall steg).
- **Q-tabell:** typisk en nøstet dictionary med tilstander som nøkler og en dictionary av handling → Q-verdi for hver tilstand.

### Forklaring

**Grensesnittet.** Et miljø trenger bare å ha en tilstand, ta imot en handling, gå til en ny tilstand og gi belønning. Med `reset` og `step` kan RL-loopen skrives som en `for`-løkke over maks antall steg eller en `while`-løkke til `done` er sann.

**Eksempel: tre på rad (notatene og F10).**

| Funksjon | Hva den gjør |
|---|---|
| `__init__` | Tomt brett (`'012345678'`), ingen vinner, X begynner |
| `reset` | Tilbake til tomt brett, returner starttilstand og info |
| `step` | Lag ny tilstand fra handlingen (for eksempel `'0123X5678'`), sjekk vinner, bytt tur, returner tilstand, belønning, `done` og info |
| `check_winner` | Let etter tre på rad vannrett, loddrett eller diagonalt |
| `render` | Ikke nødvendig, men nyttig for å se på spillet |

Vinneren får positiv belønning. Uavgjort gir 0. Ellers er belønningen 0 til spillet er over.

**Agenten (klassen `Player`).** Egenskaper: en tag (X eller O), en Q-tabell, og parametrene $\alpha$, $\gamma$ og $\varepsilon$. Metoder:

1. `choose_action`: finn lovlige trekk, legg til tilstanden i Q-tabellen med verdi 0 hvis den er ny, og velg tilfeldig med sannsynlighet $\varepsilon$, ellers handlingen med høyest Q (7.5).
2. `learn`: oppdater Q med Bellman etter hvert trekk. Fremtidig verdi er 0 når spillet er over.
3. `update_exp_factor`: senk $\varepsilon$ (7.5).

I begynnelsen spiller agenten som en komplett idiot. Belønningen på slutten av hvert spill fyller gradvis Q-tabellen med stadig mer treffsikre verdier.

**Tolke Q-verdiene (notatene og F10).** For det tomme brettet har en ferdig trent X-agent høyest Q-verdi for midten (rute 4). Agenten har lært at midten er best. Etter hvert som spillet går, viser Q-verdiene hvor den vil sette neste kryss, og til slutt at et bestemt trekk gir seier. Agenten får ingen belønning før spillet er over, men gjennom Q-verdiene kan vi lese dens forventede fremtidige belønning. Er flere Q-verdier like høye, velges tilfeldig blant dem.

**Kobling til øving 4 RL (TrondheimEnv).**

- Rutenett laget fra et bilde: den enkle versjonen har $12 \times 12 = 144$ tilstander, Trondheim-versjonen $32 \times 32 = 1024$. Fire handlinger (opp, venstre, ned, høyre). Q-tabellen har derfor form (tilstander × handlinger).
- Reward 0 per steg og +10 ved mål. Med `dead_allowed` gir vann −1 og avslutter episoden, ellers blokkeres trekket. Bussholdeplasser teleporterer til den andre holdeplassen. `start_random` gir tilfeldig start.
- Du skal blant annet forklare hvert ledd i oppdateringen, hva heatmapene av Q-verdier viser, hva $\gamma = 0$ og $\gamma = 1$ gjør, hvordan agenten finner korteste vei, hva som skjer med $\varepsilon = 0$ fra start, om treningen har konvergert (steg per episode flater ut), og om agenten bruker bussen.

### Formler

RL-loopen i pseudokode:

```python
state, info = env.reset()
done = False
while not done:
    action = agent.choose_action(state)
    next_state, reward, done, info = env.step(action)
    agent.learn(state, action, reward, next_state, done)
    state = next_state
agent.update_exp_factor()
```

### Sammenhenger

- Q-tabellen gir eksakte enkeltverdier per tilstand–handling-par. Det er grunnen til at tabell-Q-læring er stabil, og det er nettopp det som går tapt med et nevralt nett (7.6).
- Antall tilstander avgjør hvor stor tabellen blir. Med svært mange tilstander (for eksempel bilder) blir en tabell umulig, og vi trenger en funksjonsapproksimator.

### Vanlige misforståelser

- «Agenten får belønning for hvert trekk i tre på rad.» Belønningen kommer når spillet er over.
- «Q-tabellen må fylles ut på forhånd.» Den starter tom eller med nuller og fylles gjennom erfaring.
- «Høyeste Q-verdi er belønningen agenten får neste steg.» Den er forventet kumulativ fremtidig belønning.

### Eksamensoppsummering

- Kunne `reset` og `step` og hva de returnerer.
- Beskrive en tabellagent: tag, Q-tabell, $\alpha$, $\gamma$, $\varepsilon$, og metodene `choose_action`, `learn` og `update_exp_factor`.
- Tolke en tabell av Q-verdier: handlingen med høyest verdi er den agenten velger.

---

## 7.5 Exploration og exploitation {#exploration}

*Kilder: notater 4.4–4.5, F10, eksamen 2025 8.3, øving 4 RL.*

### Introduksjon

Agenten får bare data fra handlingene den faktisk gjør. Gjør den alltid det den tror er best, oppdager den kanskje aldri noe bedre. Etter denne delen skal du kunne forklare tradeoffen mellom utforsking og utnytting, ε-greedy og ε-decay.

### Begreper

- **Exploration (utforsking):** å ta handlinger med ukjent utfall, i praksis tilfeldige handlinger.
- **Exploitation (utnytting):** å ta handlinger med kjent utfall, altså den med høyest Q.
- **Exploration factor $\varepsilon$:** sannsynligheten for å ta en tilfeldig handling. En hyperparameter som bare gir mening i RL.
- **ε-greedy:** tilfeldig handling med sannsynlighet $\varepsilon$, ellers handlingen med høyest Q (sannsynlighet $1 - \varepsilon$).
- **ε-decay:** å starte med høy $\varepsilon$ og redusere den gradvis ned mot en minimumsverdi $\varepsilon_{\min}$.
- **Boltzmann exploration:** alternativ som trekker handlinger fra en eksponentiell fordeling over Q-verdiene (bare nevnt i F10).

### Forklaring

**Tradeoffen.** Med høy $\varepsilon$ utforsker agenten og finner kanskje tilstand–handling-kombinasjoner med stor belønning. Med lav $\varepsilon$ utnytter den det den vet og unngår handlinger som kan føre til store tap, men går kanskje glipp av belønninger Q-verdiene ikke vet om, fordi kombinasjonene aldri er besøkt. Det finnes ingen generell løsning: for å finne den optimale balansen måtte vi visst utfallet av handlingene med ukjent utfall, og da ville de per definisjon ikke vært ukjente. Det er en selvmotsigelse.

**ε-decay.** Utforsk mye tidlig i treningen og lite sent, når mange Q-verdier er lært. Når $\varepsilon$ bør synke, avhenger av størrelsen på tilstands- og handlingsrommet. I F10 starter $\varepsilon$ på 0,5, ganges med 0,995 etter hvert spill og stopper på 0,01. Det tar omtrent 780 spill å nå minimum.

**Hvorfor ikke helt null?** Det er vanlig å beholde en liten $\varepsilon$, også etter treningen. Selv en godt trent agent kan kjøre seg fast og trenge et tilfeldig dytt. Under testing brukes ofte $\varepsilon = 0$, men det gir ikke alltid best oppførsel.

**Tommelfingerregel (notatene).** Har agenten ikke lært noe i perioden der $\varepsilon > \varepsilon_{\min}$, lærer den sannsynligvis ikke noe vettugt om den trener videre. Da er det bedre å endre andre deler av oppsettet, for eksempel tapsfunksjonen.

**$\varepsilon = 0$ fra start (øving 4).** Agenten velger alltid høyest Q. I starten er alle Q-verdier 0, så den velger den samme handlingen hver gang og utforsker ikke miljøet. Den finner kanskje aldri målet, og Q-verdiene oppdateres aldri med noe nyttig.

<!-- figur: epsilon-greedy -->

### Formler

ε-greedy:

$$
A_t =
\begin{cases}
\text{tilfeldig handling} & \text{med sannsynlighet } \varepsilon \\
\arg\max_a Q(S_t, a) & \text{med sannsynlighet } 1 - \varepsilon
\end{cases}
$$

ε-decay, oppdatert etter hver episode:

$$
\varepsilon \leftarrow \max(\varepsilon_{\min},\ \varepsilon \cdot \text{decay})
$$

```python
def update_exp_factor(self):
    if self.exp_factor > self.exp_min:
        self.exp_factor *= self.epsilon_decay
```

### Sammenhenger

- $\varepsilon$ er en hyperparameter, som læringsrate og batch size. Den bestemmer hvilke data agenten samler.
- I veiledet læring bestemmer vi treningsdataene. I RL bestemmer policyen (og $\varepsilon$) dem. Det er grunnen til at RL er vanskelig å få oversikt over.

### Vanlige misforståelser

- «ε garanterer at agenten lærer optimal policy uten feil.» Den sørger bare for at agenten av og til utforsker.
- «ε tvinger agenten til alltid å velge høyest Q.» Det gjør $1 - \varepsilon$, og med $\varepsilon = 0$ alltid.
- «ε får agenten til å ignorere fremtidige belønninger.» Det er $\gamma$ som styrer fremtiden.
- «ε bør være 0 etter trening.» Ofte er en liten verdi bedre.

### Eksamensoppsummering

- Forklare exploration–exploitation-tradeoffen og hvorfor den ikke har noen generell løsning.
- Kunne ε-greedy og ε-decay.
- Forklare hvorfor høy $\varepsilon$ tidlig og lav sent, og hvorfor en liten $\varepsilon$ ofte beholdes.

---

## 7.6 Deep Q-learning (DQN) {#dqn}

*Kilder: notater 4.6, F11, eksamen 2025 9.1–9.3 og 10.4. Bare konseptuelle spørsmål på eksamen.*

### Introduksjon

En Q-tabell trenger én rad per tilstand. Med store tilstandsrom er det umulig, og tabellen kan ikke si noe om tilstander den aldri har sett. Et nevralt nett kan estimere Q-verdier også for usette tilstander. Det gir deep reinforcement learning (DRL), og med Q-læring et deep Q-network (DQN). Men et nett endrer alle verdiene samtidig, og det skaper to problemer som DQN løser med target-nettverk og replay buffer. Etter denne delen skal du forstå problemene og løsningene konseptuelt.

### Begreper

- **DQN (deep Q-network):** et nevralt nett som tar inn en tilstand og gir én Q-verdi per handling.
- **Funksjonsapproksimator:** en modell som estimerer en funksjon i stedet for å lagre eksakte verdier.
- **Moving target:** treningsmålet endrer seg hver gang nettet oppdateres, fordi målet selv er regnet ut med nettet.
- **Target-nettverk:** en kopi av Q-nettet som oppdateres sjeldnere (vektene kopieres med en gitt frekvens, en ny hyperparameter). Gir stabile treningsmål.
- **Replay buffer:** et minne med overganger (tilstand, handling, belønning, ny tilstand, done). Treningen trekker tilfeldige batcher fra det.
- **Catastrophic forgetting:** agenten lærer oppgaven, og så kollapser belønningen plutselig fordi nettet glemmer det det har lært.

### Forklaring

**Nettet for Frozen Lake (notatene og F11).** Brettet er $4 \times 4$, så 16 tilstander og 4 handlinger (venstre, ned, høyre, opp). Input er tilstanden one-hot-kodet (16 noder), og output er én Q-verdi per handling (4 noder). Episoden er ferdig ved mål (reward 1), ved fall i et hull, eller etter for mange steg. Ellers er reward 0.

**Problem 1: moving target.** Med en tabell oppdateres én Q-verdi om gangen, og resten står stille. Med et nett oppdateres *alle* vektene ved backprop, så også Q-verdiene for neste tilstand endres. Men treningsmålet $R + \gamma \max_A Q(S_{t+1}, A)$ inneholder nettopp disse. Det er som om $y$-verdiene i veiledet læring endret seg underveis i treningen. Resultatet er ofte ustabil trening.

**Løsning 1: target-nettverk.** Lag en kopi av Q-nettet og bruk den til å regne ut $\max_A Q(S_{t+1}, A)$ i treningsmålet. Kopien oppdateres bare med jevne mellomrom. Q-nettet brukes fortsatt til å velge handlinger. Target-nettet er en mer konservativ versjon som holder treningsmålene stabile.

**Problem 2: catastrophic forgetting (F11s «Alf»).** Alf lærer veien til pakken, er uheldig en periode og faller i hullene, og etter det finner han ikke tilbake. Trening på nye data endrer nettet, og oppdateringen endrer predikerte Q-verdier for *alle* tilstander, ikke bare den siste. Det er det som lar nettet anslå Q for usette tilstander, men det betyr også at gode estimater ødelegges. Nettet overtilpasser seg nylige hendelser. Syklusen fortsetter uansett hvor lenge vi trener, selv med lav læringsrate og lav $\varepsilon$.

**Løsning 2: replay buffer.** I stedet for å trene på hver overgang idet den skjer, lagres overgangene i et minne. Under trening trekkes en tilfeldig batch (størrelsen er batch size). Nettet ser samme tilstand–handling-par flere ganger (litt som epoker) og mange ulike par samtidig, og treningseksemplene blir mindre korrelerte. Det motvirker overtilpasning til de siste erfaringene. I Python trekkes en tilfeldig minibatch fra en liste med `random.sample(buffer, k=32)`.

**Hvordan nettet trenes.** Nettet gir én Q-verdi per handling, men vi har et treningsmål bare for handlingen agenten faktisk gjorde. Tapet regnes derfor bare mellom predikert Q for den valgte handlingen og treningsmålet. Det er en stor forskjell fra veiledet læring, der vi har et target per prediksjon. Læringsfunksjonen:

1. Trekk en batch fra replay buffer.
2. Regn ut $\max_A Q(S_{t+1}, A)$ med target-nettet, og sett den til 0 der episoden er ferdig.
3. Regn ut treningsmålet $y$ med Bellman.
4. Hent Q-nettets prediksjon for handlingene som faktisk ble gjort (også de som ble valgt ved utforsking).
5. Regn ut tapet (MSE) mellom $y$ og prediksjonen.
6. Backpropager og oppdater Q-nettet (notatene bruker Adam).

**Oversikt under trening.** I RL har vi ikke kontroll på hvilke data som genereres, og det er mange hyperparametre. Det er derfor lurt å plotte $\varepsilon$, belønning og steg per episode underveis (for eksempel med Weights and Biases). I notatenes eksempel faller agenten først i vannet, så bruker den mange steg uten å finne målet, og til slutt når den målet raskt i nesten hver episode.

### Formler

Treningsmålet for en overgang $(s, a, r, s', \text{done})$:

$$
y = \begin{cases} r & \text{hvis done} \\ r + \gamma \max_{a'} Q_{\text{target}}(s', a') & \text{ellers} \end{cases}
$$

Tapet over en batch $\mathcal{B}$ fra replay buffer:

$$
\mathcal{L} = \frac{1}{|\mathcal{B}|}\sum_{(s, a, r, s') \in \mathcal{B}}\bigl(y - Q(s, a)\bigr)^2
$$

Kode fra notatene (forkortet):

```python
next_target_q = target_network(next_states).max(dim=1, keepdim=True).values
next_target_q = torch.where(dones, torch.zeros_like(next_target_q), next_target_q)
y_train = rewards + discount * next_target_q
y_pred = torch.gather(q_network(states), 1, actions)
loss = mse_loss(y_train, y_pred)
```

### Sammenhenger

- DQN bruker alt fra kapittel 5: et MLP, backprop, en optimizer og batch size.
- Replay buffer ligner mini-batch SGD: tilfeldige, ukorrelerte batcher gir mer stabile gradienter.
- Catastrophic forgetting er en form for overtilpasning (kapittel 3): nettet tilpasser seg det siste den så.

### Vanlige misforståelser

- «Target-nettet legger til støy for utforsking.» Det holder treningsmålene stabile. Utforsking styres av $\varepsilon$.
- «Target-nettet hindrer overtilpasning til replay buffer.» Det er replay buffer som motvirker korrelasjon og overtilpasning til nylige data.
- «Replay buffer hindrer catastrophic forgetting ved at nettet aldri ser gamle overganger.» Den gjør det motsatte: gamle overganger trekkes igjen.
- «Replay buffer garanterer at alle par trekkes like ofte.» Trekkingen er tilfeldig.
- «Replay buffer gjør utforsking unødvendig.» Agenten må fortsatt utforske for å samle nyttige data.
- «Et nett fjerner behovet for $\gamma$.» Bellman brukes fortsatt.
- «Å oppdatere én Q-verdi i nettet påvirker bare den.» På grunn av delte vekter endres mange Q-verdier.

### Eksamensoppsummering

- Forklare hvorfor et nevralt nett erstatter tabellen (store tilstandsrom, generalisering til usette tilstander).
- Forklare moving target og hvordan target-nettverket løser det.
- Forklare catastrophic forgetting og hvordan replay buffer hjelper (mindre korrelerte eksempler, gjentatt bruk av gamle overganger).
- Vite at tapet bare regnes for den valgte handlingen, og at treningsmålet er $r + \gamma\max Q_{\text{target}}$ (0 fremtid ved done).

---

## 7.7 Loss vs reward, reward-design og reward hacking {#reward-hacking}

*Kilder: F11, eksamen 2024 oppg. 33 og 2025 9.4.*

### Introduksjon

I RL har vi to tall som lett blandes: tapet og belønningen. Og selve belønningen må designes, noe som er overraskende vanskelig. Etter denne delen skal du kunne forskjellen på loss og reward, ulike måter å gi belønning på, og hva reward hacking er.

### Begreper

- **Loss (i DQN):** hvor mye Q-nettet må oppdateres for å passe Bellman-likningen.
- **Reward:** hvor mye belønning agenten får fra miljøet.
- **Reward hacking:** agenten finner en måte å få høy belønning på som løser problemet på en annen måte enn det som var meningen.

### Forklaring

**Loss vs reward (F11).** Loss forteller hvor mye Q-nettet må endres. Reward forteller hvor godt agenten gjør det i miljøet. Reward er *ikke* en slags negativ loss, og de to trenger ikke henge sammen. En agent kan spille perfekt uten å lære noe (lavt tap betyr ikke nødvendigvis høy belønning, og omvendt).

**Når skal agenten få belønning? (F11)**

| Oppgave | Belønning |
|---|---|
| Panterobot som panter flasker døgnet rundt | Per pantet flaske (per hendelse) |
| Sjakk-AI (AlphaZero) | På slutten av hvert spill, fordi verdien av ett trekk ikke er kjent isolert |
| Selvkjørende bil som aldri skal kjøre på noen | Per sekund uten kollisjon, eller negativ belønning ved (nesten) kollisjon |
| AI-syklist som skal raskest fra sentrum til studenterhytta | Negativ belønning per tidssteg, slik at total tid minimeres |

Belønning kan altså gis per forhåndsdefinert hendelse, ved slutten av en episode, eller per tidssteg (overleve lengst mulig eller løse oppgaven raskest mulig).

**Reward hacking.** Å lage gode tapsfunksjoner og belønningsstrukturer er svært vanskelig. Det kan finnes mange løsninger som gir høy belønning, og læringen kan havne i en som gir uønsket oppførsel. Kjent eksempel fra 2016 (OpenAI): en agent i båtspillet CoastRunners fikk poeng per treff og endte opp med å kjøre i ring og krasje i stedet for å kjøre til mål. Agenten utnytter utilsiktede svakheter i hvordan belønningen er definert.

### Formler

Ingen nye formler. Husk at tapet i DQN er MSE mellom Bellman-målet og predikert Q (7.6), mens belønningen er det miljøet returnerer i `step`.

### Sammenhenger

- Reward hacking er et eksempel på at modellen optimerer akkurat det vi ber om, ikke det vi mener. Samme tanke ligger bak at evalueringsmetrikken må passe anvendelsen (kapittel 1.5), og bak de etiske prinsippene om ikke-skade (kapittel 9).
- AI Act stiller krav til robusthet og menneskelig tilsyn med nettopp slike systemer (kapittel 9).

### Vanlige misforståelser

- «Lavt tap betyr at agenten gjør det bra.» Tapet måler bare hvor godt nettet passer Bellman-målene.
- «Reward hacking skjer fordi agenten bare lærer av umiddelbar belønning eller ikke tåler flere mål.» Det skjer fordi belønningen har utilsiktede svakheter som agenten utnytter.
- «Reward hacking skyldes en feil i oppdateringsregelen.» Regelen virker som den skal. Belønningen er feil designet.

### Eksamensoppsummering

- Forklare forskjellen på loss og reward, og at de ikke trenger å henge sammen.
- Kunne gi eksempler på belønning per hendelse, per episode og per tidssteg.
- Definere reward hacking og forklare hvorfor det skjer.
