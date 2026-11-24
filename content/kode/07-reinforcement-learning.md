---
kapittel: 7
tittel: Reinforcement learning – Q-tabell, epsilon-greedy og DQN
ingress: 'RL-løkka, Q-tabellen fra prosjekt 4, valg av handling, Q-oppdateringen og hovedtrekkene i DQN. Notatene sier at bare konseptuelle spørsmål om DQN er relevante på eksamen, så for DQN holder det å forstå hva linjene gjør.'
---

## RL-løkka {#rl-loop}

*Pensum: 7.1, 7.4 · Kilder: notater 4.3 og 4.6.3, prosjekt 4 RL (`TrondheimEnv`)*

```python
for episode in range(num_episodes):
    state, info = env.reset()                       # tilbake til start
    for step in range(max_steps):
        action = velg_handling(state)
        next_state, reward, terminated, truncated, info = env.step(action)
        oppdater(state, action, reward, next_state, terminated)
        state = next_state                          # gå videre
        if terminated or truncated:
            break
```

#### Hva koden gjør

Et miljø trenger i praksis to funksjoner: `reset`, som setter det i starttilstanden, og `step`, som tar en handling og returnerer ny tilstand, belønning og om episoden er ferdig. Agenten velger handling, miljøet svarer, agenten lærer av overgangen og går videre til neste tilstand. Episoden stopper når den er ferdig eller når maks antall steg er nådd.

Antall returverdier fra `step` avhenger av miljøet. Notatene beskriver Gym-standarden med fire verdier (`state, reward, done, info`), Gymnasium-miljøet Frozen Lake gir fem (med `truncated`), og `TrondheimEnv` i prosjekt 4 gir fire.

#### Fallgruver

- `env.reset()` må kalles i starten av *hver* episode, ellers fortsetter agenten der forrige episode sluttet (eller i en terminal tilstand).
- Glemmer du `state = next_state`, lærer agenten hele tiden fra samme tilstand.
- `terminated` betyr at miljøet er ferdig (mål eller hull). `truncated` betyr at episoden ble avbrutt, for eksempel på grunn av steggrensen.
- Reward kommer fra miljøet. Q-verdiene må agenten lære selv.

#### Fra øvingene

- Prosjekt 4, problem 2: plottet av steg per episode viser om treningen har konvergert. Antallet faller og flater ut nær lengden på korteste vei.

## Q-tabellen {#q-tabell}

*Pensum: 7.3, 7.4 · Kilder: prosjekt 4 RL (`get_state_id`, «Why does the Q-table have 144 states?»), notater 4.5*

```python
rows, cols = env.observation.shape                  # 12 x 12 rutenett
q_table = np.zeros((rows * cols, env.action_space.n))   # (144, 4)

def get_state_id(row, col):
    return row * cols + col                         # rute -> radindeks i tabellen

beste_handling = q_table[state].argmax()            # greedy handling i én tilstand
policy = q_table.argmax(axis=1).reshape(rows, cols) # beste handling i hver rute
```

#### Hva koden gjør

Q-tabellen har én rad per tilstand og én kolonne per handling. I prosjekt 4 er tilstanden posisjonen til agenten på et $12 \times 12$-rutenett, så det er $144$ tilstander, og handlingene er opp, venstre, ned og høyre. `get_state_id` gjør en (rad, kolonne)-posisjon om til et radnummer. Tabellen starter med nuller: agenten vet ingenting.

I tre-på-rad-eksempelet i notatene er tabellen i stedet en nøstet dictionary med tilstanden som nøkkel, og nye tilstander legges til med Q-verdi 0 første gang de dukker opp.

#### Fallgruver

- Formen er (antall tilstander, antall handlinger), ikke omvendt.
- `argmax(axis=1)` gir beste handling *per tilstand*. `argmax(axis=0)` gir beste tilstand per handling, som sjelden er det du vil.
- Med `start_random=True` eller `dead_allowed=True` endres miljøet, men ikke antall tilstander, siden tilstanden bare er posisjonen.

#### Fra øvingene

- Prosjekt 4: heatmaps av `q_table.max(axis=1).reshape(12, 12)` viser at verdien faller med avstanden til målet (omtrent som $\gamma^k$), og `q_table.argmax(axis=1)` gir policyen.
- Busstoppene er en snarvei. Agenten bruker dem bare hvis den har utforsket dem, og de verdsettes høyere fordi færre steg betyr mindre diskontering.
- `dead_allowed=True` gir reward $-1$ og avslutter episoden i vann. `start_random=True` gjør at agenten må lære gode handlinger fra flere starttilstander.

## Epsilon-greedy og epsilon decay {#epsilon-greedy}

*Pensum: 7.5 · Kilder: notater 4.4 (`choose_action`, `update_exp_factor`), prosjekt 4 RL (`update_action`, `update_explore_rate`)*

```python
def velg_handling(state, epsilon, q_table):
    if np.random.uniform(0, 1) < epsilon:
        return env.action_space.sample()            # utforsk: tilfeldig handling
    return int(np.argmax(q_table[state]))          # utnytt: beste kjente handling

epsilon = max(epsilon_min, epsilon * epsilon_decay) # etter hver episode
```

#### Hva koden gjør

Med sannsynlighet $\epsilon$ tar agenten en tilfeldig handling (exploration), ellers den med høyest Q-verdi (exploitation). Uten utforsking prøver agenten aldri handlinger den ikke allerede tror er gode, og finner kanskje aldri målet. Med epsilon decay starter $\epsilon$ høyt og krymper hver episode, ned til en minsteverdi. Etter $n$ episoder er

$$
\epsilon_n = \max\!\left(\epsilon_{\min},\ \epsilon_0 \cdot d^{\,n}\right).
$$

Når den ferdige agenten vises fram i prosjekt 4, kalles `update_action` med `explore_rate = 0`, slik at den alltid velger beste kjente handling.

#### Fallgruver

- Sammenligningen er `< epsilon` for å utforske. Med `> epsilon` utforsker agenten nesten alltid når $\epsilon$ er liten.
- Med $\epsilon = 0$ fra start finner agenten ofte aldri en belønning i et miljø der alle andre steg gir 0, og Q-tabellen forblir null.
- Notatene anbefaler å beholde en liten $\epsilon$ også etter treningen, fordi en godt trent agent kan kjøre seg fast. Prosjekt 4 setter den til 0 bare for å vise fram den lærte policyen.
- Har agenten ikke lært noe før $\epsilon$ når minimum, hjelper det sjelden å trene lenger (notatene 4.4).

## Q-oppdateringen {#q-oppdatering}

*Pensum: 7.3 · Kilder: notater 4.2 og 4.5 (likning 117, `learn`), prosjekt 4 RL, eksamen 2024 oppgave 32, eksamen 2025 del 8 spørsmål 4*

```python
def oppdater(q_table, s, a, r, s_neste, ferdig, alpha, gamma):
    fremtid = 0.0 if ferdig else np.max(q_table[s_neste])     # beste verdi i neste tilstand
    td_target = r + gamma * fremtid
    q_table[s, a] += alpha * (td_target - q_table[s, a])      # lite steg mot målet
```

#### Hva koden gjør

Dette er Q-læringsregelen

$$
Q(s, a) \leftarrow Q(s, a) + \alpha\left[r + \gamma \max_{a'} Q(s', a') - Q(s, a)\right],
$$

som er det samme som notatenes $Q_{\text{ny}} = (1-\alpha)\,Q(s, a) + \alpha\,[r + \gamma \max_{a'} Q(s', a')]$. `td_target` er det vi nå tror Q-verdien burde være: belønningen vi fikk pluss den diskonterte beste verdien fra neste tilstand. Forskjellen mellom målet og gammel verdi er TD-feilen, og $\alpha$ bestemmer hvor stor del av den vi tar med.

Selv om alle steg gir reward 0, lærer agenten korteste vei: belønningen ved målet sprer seg bakover én tilstand av gangen, og ganges med $\gamma$ for hvert steg, så tilstander nær målet får høyere verdi.

#### Fallgruver

- `max` tas over handlingene i *neste* tilstand $s'$, ikke i $s$.
- Er episoden ferdig, finnes det ingen fremtid, og fremtidig verdi skal være 0.
- $\gamma = 0$ gjør agenten kortsiktig: bare umiddelbar reward teller. $\gamma = 1$ diskonterer ikke, og da gir korte og lange veier til målet samme verdi. Høy $\gamma$ betyr at læringen domineres av estimatet av fremtidige verdier (H24 oppgave 32).
- $\alpha$ er læringsraten. Prosjekt 4 lar den synke over episodene: store steg tidlig, når tabellen er langt fra riktig, og små steg sent, slik at verdiene stabiliserer seg.

## DQN: target network og replay buffer {#dqn}

*Pensum: 7.6 · Kilder: notater 4.6.2 og 4.6.3 (`learn`, RL-løkka for Frozen Lake), eksamen 2025 del 9 og del 10 spørsmål 4*

```python
batch = random.sample(replay_buffer, k=32)              # tilfeldig minibatch uten tilbakelegging
states, actions, rewards, next_states, dones = batch_til_tensorer(batch)
with torch.no_grad():                                   # target network trenes ikke
    neste_q = target_network(next_states).max(dim=1, keepdim=True).values
    neste_q = torch.where(dones, torch.zeros_like(neste_q), neste_q)
y_train = rewards + discount * neste_q                  # Bellman-målet
y_pred = torch.gather(q_network(states), 1, actions)    # Q for handlingene som ble tatt
loss = mse_loss(y_pred, y_train)
optimizer.zero_grad(); loss.backward(); optimizer.step()
# hvert target_update_frequency steg:
target_network.load_state_dict(q_network.state_dict())
```

#### Hva koden gjør

Et DQN erstatter Q-tabellen med et nevralt nett som gir én Q-verdi per handling for en (one-hot-kodet) tilstand. Siden én oppdatering endrer *alle* vektene, endrer den også Q-verdiene i neste tilstand, og målet flytter seg mens nettet trenes. To grep stabiliserer treningen:

- **Target network:** en kopi av Q-nettet som oppdateres sjeldnere (vektene kopieres over med jevne mellomrom). Den regner ut $\max_{a'} Q(s', a')$, slik at målet holder seg i ro.
- **Replay buffer:** overganger lagres og trekkes tilfeldig i minibatcher. Det gjør treningseksemplene mindre korrelerte enn om vi trente på dem i rekkefølgen de skjedde.

`torch.gather` plukker ut Q-verdien for handlingen agenten faktisk tok, fordi vi bare har et mål for den ene handlingen. `torch.where` setter fremtidig verdi til 0 for terminale overganger.

#### Fallgruver

- Target network handler om stabile mål, ikke om utforsking (H25 del 9 spørsmål 1).
- `random.sample` trekker uten tilbakelegging. `buffer.sort()` eller `np.take(buffer, 32)` trekker ingen tilfeldig minibatch (H25 del 10).
- Tapet regnes bare for handlingen som ble tatt. Du har ikke noe mål for de andre handlingene.
- Lavt tap betyr ikke høy reward. Tapet måler hvor godt nettet treffer sine egne mål, ikke hvor godt agenten gjør det (H24 oppgave 33).
