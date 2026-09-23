# Lean Trade-off Game — app di supporto tavoli

App web di supporto (non sostitutiva) al Lean Trade-off Game giocato su carta.
Vedi il brief per il contesto completo. Sviluppo per step incrementali.

**Nota:** il backend è **Firebase (Firestore)**, non Supabase come nel brief iniziale
(limite di progetti gratuiti raggiunto su Supabase). L'hosting resta **Cloudflare Pages**.

## Step 1 — Setup progetto e schema dati

Cosa c'è in questo step:
- Progetto React (Vite) scaffoldato
- Client Firebase collegato via variabili d'ambiente (`src/lib/firebaseClient.js`)
- `firestore.rules`: regole di sicurezza da rivedere e incollare nella console Firebase
  (equivalente allo "script SQL da rivedere" del brief, adattato a Firestore)
- Dati iniziali (6 tavoli, 12 righe della matrice punteggi a zero, sessione) creati
  **automaticamente dall'app al primo avvio** — nessuno script da eseguire a mano
- Una pagina minimale che verifica la connessione a Firestore (nessuna UI di gioco ancora)

### Schema dati (collezioni Firestore)

- `tavoli` (doc id "1".."6"): `nome` — le 6 squadre
- `opzioni` (doc id es. "1A", "2C"): `round`, `opzione`, `nome`, `shift_q`, `shift_s`, `shift_c`, `shift_p`
  — è la matrice punteggi editabile
- `sessione` (doc singolo id "corrente"): `round_attivo`, `stato` (aperto/chiuso), `timer_avvio`
- `scelte` (doc id `${tavolo_id}_${round}`, così una scelta per tavolo per round è garantita
  dall'id stesso): `tavolo_id`, `round`, `opzione`, `inviato_at`

Nessuna autenticazione: la sicurezza è minima, basata su URL non prevedibili (coerente con l'uso
in un evento live a bassa criticità) — vedi `firestore.rules`.

## Step 2 — Vista Config

Cosa c'è in questo step:
- Routing con `react-router-dom`: `/` (verifica connessione) e `/config`
- `/config`: tabella della matrice punteggi (4 round × A/B/C) con nome opzione e i 4 shift
  Q/S/C/P editabili (select vincolata a -1/0/+1), salvataggio riga per riga
- `/config`: tabella nomi tavoli editabile, salvataggio riga per riga
- `/config`: pulsante "Reset partita" (cancella tutte le `scelte` e riporta `sessione` a Round 1/chiuso),
  con conferma prima di eseguire
- `public/_redirects` per il fallback SPA su Cloudflare Pages (senza, un refresh su `/config` darebbe 404 in produzione)

### Come testare (Step 1 + 2 insieme)

Le istruzioni per creare il progetto Firebase e collegarlo vengono guidate passo passo in chat.
In sintesi, una volta ottenuta la configurazione Firebase:

1. `cp .env.example .env.local` e incolla i valori del progetto Firebase
2. `npm install && npm run dev`
3. Apri l'URL mostrato in console: dovresti vedere ✅ per tutte e 4 le collezioni con i conteggi
   attesi (6 tavoli / 12 opzioni / 1 sessione / 0 scelte) — creati automaticamente al primo avvio
4. Vai su `/config`: modifica nome/shift di un'opzione o il nome di un tavolo, premi "Salva",
   ricarica la pagina per confermare che il valore sia persistito
5. Prova "Reset partita" (conferma il popup) e verifica su Firebase Console che `scelte` sia vuota
   e `sessione` sia tornata a `round_attivo=1`, `stato=chiuso`

## Deploy

Pubblicato su Cloudflare Workers (static assets), collegato al branch `claude/lean-tradeoff-game-app-voyyne`:
https://decision-game-board.galloni-luca.workers.dev

Ogni push su questo branch aggiorna automaticamente il sito pubblicato.

## Step 3 — Vista Tavolo, statica

Cosa c'è in questo step:
- Route `/tavolo/:id` (`src/pages/Tavolo.jsx`)
- Mostra il nome del tavolo e, se il round è aperto, le 3 opzioni A/B/C del round attivo (solo lettera
  e nome, senza mostrare gli shift ai giocatori)
- Selezione di un'opzione e invio scelta (scritta in `scelte` con id `${tavolo_id}_${round}`, quindi
  al massimo una scelta per tavolo per round — un nuovo invio nello stesso round sovrascrive il precedente)
- Se il round è chiuso, mostra un messaggio di attesa
- Nessun timer, nessun realtime: per vedere aggiornamenti serve ricaricare la pagina (pulsante "Ricarica"
  o refresh del browser) — verranno collegati negli step 5-6
- Link rapidi ai 6 tavoli aggiunti nella Home per test veloce

### Come testare

Dato che la vista Regia (Step 4) non esiste ancora, per aprire un round bisogna farlo a mano da Firebase Console:

1. Vai su Firebase Console → Firestore Database → collezione `sessione` → documento `corrente`
2. Cambia il campo `stato` da `chiuso` a `aperto` (click sul valore, modifica, salva)
3. Apri `/tavolo/1` (o dalla Home → "Tavolo 1 →"): dovresti vedere "Round 1" e le 3 opzioni A/B/C
   (i nomi saranno vuoti se non li hai ancora compilati in Config — va bene lo stesso per il test)
4. Seleziona un'opzione, premi "Invia scelta" → dovresti vedere "✅ Scelta inviata"
5. Ricarica la pagina: dovresti vedere "Hai già inviato: Opzione X"
6. Verifica su Firestore Console che sia comparso un documento in `scelte` con id `1_1` e i campi corretti
7. Prova anche a cambiare scelta e reinviare: il documento `1_1` deve aggiornarsi, non duplicarsi
8. Rimetti `stato` su `chiuso` quando hai finito (o usa "Reset partita" da `/config`)

## Step 4 — Vista Regia, statica

Cosa c'è in questo step:
- Route `/regia` (`src/pages/Regia.jsx`), linkata anche dalla Home
- Mostra round attivo e stato (aperto/chiuso)
- Pulsante "Apri Round N" (stato → aperto) / "Chiudi Round N" (stato → chiuso)
- Pulsante "Avanza al Round N+1" (visibile solo a round chiuso e se N < 4)
- Elenco tavoli con ✅/⬜ se hanno inviato la scelta nel round attivo (senza mostrare quale opzione,
  dato che questo schermo può essere proiettato)
- Contatore "X su 6 tavoli hanno inviato"
- Nessun realtime ancora: pulsante "Aggiorna" per ricaricare manualmente (arriva allo Step 5)

Con questo step non serve più aprire i round a mano da Firebase Console: tutto il flusso di un round
si testa dall'app.

### Come testare

1. Apri `/regia` (link dalla Home)
2. Premi "Apri Round 1": lo stato deve passare ad "Aperto"
3. In un'altra scheda/dispositivo apri `/tavolo/1`, `/tavolo/2` ecc. e invia una scelta per un paio di tavoli
4. Torna su `/regia` e premi "Aggiorna": dovresti vedere i tavoli che hanno inviato marcati ✅ e il contatore aggiornato
5. Premi "Chiudi Round 1": lo stato passa a "Chiuso" — su `/tavolo/:id` (dopo ricarica) dovrebbe sparire
   la possibilità di inviare e comparire "in attesa che la regia apra il Round 1"
6. Premi "Avanza al Round 2": il titolo passa a "Round 2 — Chiuso", pronto per essere riaperto
7. Ripeti fino al Round 4; a Round 4 chiuso compare il messaggio di fine partita

## Step 5 — Realtime

Cosa c'è in questo step:
- `/regia`: sessione (round/stato) e scelte del round attivo agganciate con `onSnapshot` — la board si
  aggiorna da sola quando un tavolo invia, senza pulsante "Aggiorna" (rimosso, non serve più)
- `/tavolo/:id`: sessione agganciata con `onSnapshot` — il tavolo vede l'apertura/chiusura round in
  automatico; anche la propria scelta è agganciata in tempo reale (utile ad es. dopo un "Reset partita")
- Nomi tavoli e matrice opzioni restano caricati una tantum (non cambiano durante l'evento)

### Come testare

1. Apri `/regia` in una scheda e `/tavolo/1` in un'altra (stesso browser o dispositivi diversi)
2. Su `/regia` premi "Apri Round 1": su `/tavolo/1`, **senza ricaricare**, dovrebbe apparire subito
   "Round 1" e le opzioni
3. Su `/tavolo/1` invia una scelta: su `/regia`, **senza ricaricare**, il tavolo deve comparire ✅ e il
   contatore aggiornarsi
4. Su `/regia` premi "Chiudi Round 1": su `/tavolo/1` deve tornare subito il messaggio di attesa

## Step 6 — Timer condiviso

Cosa c'è in questo step:
- `src/lib/tempo.js`: durata round fissa (`DURATA_ROUND_SECONDI`, default 5 minuti — dimmi se la vuoi
  diversa o resa configurabile da `/config`, per ora è un valore fisso nel codice) e calcolo del tempo
  rimanente a partire dal timestamp condiviso `sessione.timer_avvio`
- `src/components/Timer.jsx`: countdown mm:ss che si aggiorna ogni secondo, mostrato sia su `/regia`
  che su `/tavolo/:id` quando il round è aperto — calcolato dallo stesso timestamp per tutti i
  dispositivi (non da un timer locale), quindi resta sincronizzato anche con dispositivi diversi
- A tempo scaduto mostra "Tempo scaduto" in rosso, ma il round non si chiude da solo: resta un aiuto
  visivo, la chiusura resta un'azione esplicita della regia (coerente col brief)

### Come testare

1. Su `/regia` premi "Apri Round 1": deve comparire un countdown che parte da 5:00 e scende ogni secondo
2. Apri `/tavolo/1` in parallelo: deve mostrare lo stesso countdown, sincronizzato (stesso secondo,
   non un timer indipendente che riparte da 5:00 al caricamento)
3. Aspetta che arrivi a 0:00 (o modifica temporaneamente `DURATA_ROUND_SECONDI` a un valore basso tipo
   10 per testare più velocemente): deve comparire "Tempo scaduto" in rosso, il round resta comunque aperto
   finché non premi "Chiudi Round" dalla regia

## Step 7 — Calcolo e visualizzazione KPI

Cosa c'è in questo step:
- `src/lib/kpi.js`: calcolo dei KPI cumulativi (somma degli shift Q/S/C/P di tutte le scelte inviate da
  un tavolo, usando la matrice `opzioni` attuale) e soglie semaforo (negativo → rosso, zero → giallo,
  positivo → verde, come da brief)
- `src/components/BoardKpi.jsx`: 4 badge colorati Q/S/C/P riutilizzati sia in `/tavolo/:id` (i propri
  KPI, sempre visibili) sia in `/regia` (board con i KPI di tutti i tavoli, per il debrief)
- Tutto in tempo reale: i KPI si aggiornano da soli non appena una scelta viene inviata o un round chiuso

### Come testare

1. Prima compila almeno qualche shift diverso da zero nella matrice da `/config` (altrimenti i KPI
   restano tutti a 0/giallo, tecnicamente corretto ma poco interessante da vedere)
2. Apri `/tavolo/1`: dovresti vedere "I tuoi KPI" con 4 badge (inizialmente tutti gialli se non hai
   ancora scelto nulla)
3. Apri un round dalla regia, invia una scelta con shift diversi da zero: i badge su `/tavolo/1` devono
   aggiornarsi da soli (colore e valore) non appena la scelta è inviata — anche prima che il round chiuda,
   dato che si sommano le scelte già inviate
4. Su `/regia` scorri fino a "Board KPI": deve mostrare la stessa riga di badge per ogni tavolo, aggiornata
   in tempo reale
5. Prova "Reset partita" da `/config`: tutti i KPI (tavolo e regia) devono tornare a 0/giallo

## Step 8 — Rifinitura e test

Cosa c'è in questo step (parte automatizzabile):
- `/config` → sezione "QR tavoli": un QR code per ogni tavolo, generato interamente lato client
  (nessuna chiamata a servizi esterni) puntando all'URL pubblico corretto in automatico
  (`/tavolo/1` ... `/tavolo/6`), pronto da stampare con Ctrl/Cmd+P

Cosa manca e richiede il tuo intervento (non posso testarlo io da qui: il mio ambiente sandbox non
riesce a raggiungere né il sito pubblicato né Firebase per policy di rete):
- Stampare/scansionare i QR e verificare che aprano il tavolo giusto da telefono/tablet reali
- Giocare una partita intera a 4 round con più dispositivi reali in parallelo
- Verificare il comportamento con rete instabile (spegnere il wifi a metà round e vedere cosa succede
  quando torna: i dati non salvati localmente si perdono, ma tutto quello già inviato resta corretto —
  è il comportamento atteso "se la rete cade si continua su carta" del brief)

## Configurabile da `/config` (aggiunto dopo lo Step 8 iniziale)

- **Durata round**: campo "Durata round (minuti)" in cima a `/config` (default 5, salvato in
  `sessione.durata_round_minuti`) — cambia il countdown su tutti i dispositivi al prossimo round aperto,
  nessun redeploy necessario
- **Numero tavoli**: sezione "Tavoli" in `/config` ha ora "Aggiungi tavolo" (crea il prossimo ID libero,
  es. 7 se esistono 1-6) e "Rimuovi" per riga (con conferma; cancella anche le scelte già inviate da
  quel tavolo). La Home mostra sempre l'elenco aggiornato dei tavoli esistenti, non più un elenco fisso 1-6

### Come testare

1. Su `/config` cambia "Durata round" a un valore basso (es. 0.2 minuti = 12 secondi) e salva
2. Apri un round da `/regia`: il countdown deve partire dal nuovo valore, non più da 5:00
3. Su `/config` premi "Aggiungi tavolo": deve comparire un nuovo tavolo con ID incrementale; verifica
   che appaia anche nella lista della Home e che generi il suo QR
4. Premi "Rimuovi" su un tavolo di test: dopo conferma deve sparire da tabella, Home e QR

## Grafica professionale + matrice di esempio

- Nuovo design system (`src/index.css`): palette navy/blu, card, badge, tabelle, tema chiaro/scuro,
  applicato a tutte le viste. `Topbar` e `BoardKpi`/`Timer` riutilizzati ovunque
- `/config` → "Matrice punteggi" → pulsante **"Carica matrice di esempio"**: popola le 12 opzioni con
  nomi e shift plausibili (`src/lib/matriceEsempio.js`), utile per partire con dati reali invece che
  tutti a zero. Sovrascrive quanto già presente (con conferma) — resta comunque modificabile riga per
  riga dopo, i valori sono solo un punto di partenza da rivedere

### Come testare

1. Apri `/regia` e `/tavolo/:id`: verifica lo stile nuovo (card, badge, timer grande)
2. Su `/config` → "Matrice punteggi" premi "Carica matrice di esempio" (conferma il popup): le 12 righe
   si devono popolare con nomi e valori Q/S/C/P diversi da zero
3. Apri un round da `/regia` e invia una scelta da `/tavolo/1`: dovresti vedere il nome dell'opzione
   scelta e i KPI aggiornarsi coerentemente con i nuovi valori

## Fix feedback invio + Dashboard TV

Fix bug: sulla vista Tavolo il pulsante restava "Invia scelta" anche dopo un invio riuscito, senza un
segnale chiaro che fosse andato a buon fine.

- `/tavolo/:id`: badge "✓ Inviata" accanto a "Aperto", segno di spunta sull'opzione già inviata, e il
  pulsante ora cambia stato: **"✓ Scelta inviata"** (disabilitato) se la selezione corrente coincide con
  quanto già inviato, **"Aggiorna scelta"** se hai cambiato selezione dopo un invio precedente
- `/regia`: la lista "Scelte inviate" mostra ora anche l'orario di invio di ciascun tavolo
- Nuova vista **`/dashboard`**: pensata per una TV/proiettore visibile a tutti i tavoli. Mostra sempre
  round attivo, timer (grande) e stato di invio di ciascun tavolo (senza rivelare la scelta). Una
  sezione aggiuntiva con le scelte fatte e la board KPI compare solo quando abilitata
- `/regia`: nuovo pulsante **"Mostra/Nascondi risultati sulla dashboard"** — controlla in tempo reale
  (campo `sessione.mostra_risultati`) se la sezione risultati è visibile su `/dashboard`, utile per un
  momento di reveal a fine round invece di mostrare tutto sempre

### Come testare

1. Su `/tavolo/1` apri un round e invia una scelta: il pulsante deve diventare "✓ Scelta inviata"
   (disabilitato) e comparire il segno di spunta sull'opzione scelta
2. Cambia selezione su un'altra opzione: il pulsante deve tornare cliccabile con scritta "Aggiorna scelta"
3. Su `/regia`, accanto al tavolo che ha inviato, deve comparire l'orario (es. "✓ Tavolo 1 · 14:32:07")
4. Apri `/dashboard` su un secondo dispositivo/scheda: deve mostrare round, timer grande, e i tavoli
   che hanno inviato — senza rivelare le scelte
5. Su `/regia` premi "Mostra risultati sulla dashboard": su `/dashboard`, **senza ricaricare**, deve
   comparire la sezione con le scelte fatte e la board KPI. Premi di nuovo per nasconderla

## Dashboard TV: griglia a schede per tavolo

Riprogettata su richiesta: invece di due tabelle, una scheda per tavolo con lo storico dei round,
pensata per stare tutta su un solo schermo (niente scroll possibile su una TV).

- `src/pages/Dashboard.jsx` + `src/components/TavoloScheda.jsx` + `src/components/MiniSemaforo.jsx`
- Fascia superiore compatta, sempre visibile: round, timer, quanti tavoli hanno inviato
- Quando "Mostra risultati" è attivo: una scheda per tavolo con
  - riga R1-R4: l'opzione scelta in ogni round, con sotto 4 puntini colorati (semaforo Q/S/C/P
    cumulativo *a quel punto*, per vedere lo storico round su round, non solo il totale finale)
  - in basso, i 4 badge KPI grandi con il totale aggiornato ad oggi
- Griglia 3 colonne × 2 righe per 5-6 tavoli (si adatta automaticamente al numero di tavoli configurato
  in Config); tutto dimensionato con unità relative al viewport così si adatta a schermi diversi senza
  andare in scroll né uscire dai bordi
- `src/index.css` → nuove classi `.dashboard-tv`, `.dash-card`, `.dash-round-chip`, `.mini-semaforo`

### Come testare

1. Apri `/dashboard` su un secondo schermo/scheda a tutta finestra (F11 per il fullscreen del browser
   simula meglio l'uso reale su TV)
2. Gioca un paio di round da `/regia` + `/tavolo/:id`, poi attiva "Mostra risultati sulla dashboard"
3. Verifica che compaiano le 6 schede, tutte visibili senza dover scrollare, con i round già giocati
   che mostrano lettera scelta + puntini colorati, e i round non ancora giocati con "–"
4. Ridimensiona la finestra del browser (o prova a schermo intero su un monitor più piccolo): il
   contenuto deve restare leggibile e non uscire dai bordi

## Resa mobile (Tavolo)

`/tavolo/:id` è pensata per essere usata da smartphone/tablet dai giocatori (desktop per te/regia).
Verificato e sistemato su schermi molto stretti (~320px, i telefoni più piccoli):
- I badge KPI Q/S/C/P andavano a capo in modo scomposto → ridotti via media query sotto i 420px
- Il titolo "Round N" si spezzava a metà se i badge accanto non avevano spazio → ora vanno a capo
  in modo pulito sotto al titolo invece di forzarlo a stringersi

### Come testare

Nel browser apri gli strumenti sviluppatore (F12) → modalità dispositivo mobile → prova `/tavolo/1`
con larghezze diverse (320px, 375px, 414px): badge, titoli e pulsanti devono restare leggibili e
allineati senza spezzarsi in modo strano.

## Matrice ufficiale V1.7 + fix baseline KPI

Sostituita la matrice di esempio (inventata) con i valori reali forniti (Tabella Punteggi Lean
Trade-off Game V1.7): nomi round ("Cliente imprevedibile", "Collo di bottiglia", "Shock esterno",
"Pressione sui costi") e i 12 shift ufficiali con i nomi opzione reali (Standardizzazione,
Flessibilità, Pianificazione, Specializzazione, Polivalenza, Outsourcing, JIT, Buffer,
Diversificazione, Kaizen, VSM, Marketing).

**Fix importante**: i KPI partono da **1,1,1,1** (non da 0 come avevo assunto prima), poi si sommano
gli shift round su round. Corretto in `calcolaKpiTavolo` (`src/lib/kpi.js`, costante `KPI_BASE = 1`).
Verificato simulando tutti gli 81 percorsi possibili (3⁴): con baseline 1 e soglie ≥1 verde / =0
giallo / ≤-1 rosso, il risultato è 8 verde / 45 giallo / 25 rosso / 3 collasso — identico alla
distribuzione dichiarata nel documento ufficiale, quindi l'interpretazione è confermata corretta.

- `/config` → pulsante rinominato in **"Carica matrice ufficiale (V1.7)"**
- `/tavolo/:id`, `/regia`, `/dashboard` → l'intestazione del round mostra ora anche il nome
  narrativo (es. "Round 1 — Cliente imprevedibile")

### Come testare

1. Su `/config` premi "Carica matrice ufficiale (V1.7)" (conferma il popup)
2. Verifica che le 12 righe abbiano i nomi ufficiali e gli shift corretti (confrontabili con la
   tabella fornita)
3. Prima di scegliere qualsiasi opzione, i KPI su `/tavolo/:id` devono partire da **1/1/1/1** (tutti
   verdi, non gialli) — se vedi 0/0/0/0 il fix non è stato applicato
4. Gioca un round e verifica che i KPI finali corrispondano all'esempio del documento (Round 1,
   scelta A → Q:2 S:0 C:0 P:1)

## Storico su Tavolo + Dashboard "live" più evidente

- `/tavolo/:id`: nuova card **"Storico decisioni"** — tabella Round 1-4 con l'opzione scelta e i KPI
  (badge pieni, non solo puntini) subito dopo quel round, per vedere l'evoluzione round su round sul
  proprio dispositivo, non solo il totale attuale
- `/dashboard`: quando il round è **aperto e i risultati non sono in reveal**, la schermata ora mostra
  un timer enorme al centro e un tavolo per ciascuna squadra che **diventa verde pieno** non appena
  invia la scelta (prima erano piccoli pallini poco visibili da lontano) — pensato per essere letto
  a colpo d'occhio da tutta la sala
- La griglia con lo storico completo (Step precedente) resta invariata e compare solo quando attivi
  "Mostra risultati sulla dashboard" da `/regia`

### Come testare

1. Su `/tavolo/1` gioca un paio di round: la card "Storico decisioni" deve popolarsi riga per riga
   con l'opzione scelta e i KPI di quel momento, mentre i round futuri restano con "–"
2. Apri `/dashboard`, apri un round da `/regia`: deve comparire subito un timer enorme al centro e i
   tavoli in fila sotto, tutti grigi
3. Invia una scelta da `/tavolo/1`: la tile "Tavolo 1" sulla dashboard deve diventare verde piena
   **senza ricaricare**
4. Chiudi il round da `/regia`: la dashboard deve mostrare "In attesa che la regia apra il round..."
   finché non ne apri uno nuovo (a meno che "Mostra risultati" non sia già attivo)


## Survey evento — Passo 1: contenuto e calcolo punteggi

Questionario pubblico "Lean nell'era dell'incertezza" per l'evento del 29 settembre 2026.
Specifica completa in [`SURVEY_SPEC.md`](SURVEY_SPEC.md).

- `src/survey/content.js`: 7 dimensioni × 3 domande × 5 ancore trascritte alla lettera dalla
  specifica, più anagrafica (settori, dimensioni aziendali), testi dei consensi, costante
  `CAMPAGNA` (`2026-09-29-belforte`) e `VERSIONE_TESTO_CONSENSO`
- `src/survey/frasi.js`: 35 frasi di lettura (7 dimensioni × 5 fasce), per ora **segnaposto**
  `[[FRASE dX fascia N]]` da sostituire con i testi definitivi mantenendo la struttura
- `src/survey/scoring.js`: modulo puro (niente React/Firebase) con punteggio per dimensione
  `(media-1)/4*100`, totale (media delle 7), livello/fascia sul valore arrotondato, punti di forza e
  aree di attenzione (a parità vince l'ordine d1...d7; le attenzioni si scelgono tra le dimensioni
  non già "forza", così le due liste non si sovrappongono mai, nemmeno con molti pari merito)
- Test unitari con il test runner integrato di Node (nessuna nuova dipendenza): `npm test`
  - `scoring.test.js`: tutte 1 / tutte 5, confini 20/21, 40/41, 60/61, 80/81 (sia su valori
    diretti sia da risposte reali), pari merito
  - `content.test.js`: confronta `content.js` con il testo di `SURVEY_SPEC.md`, così un refuso
    nella trascrizione fa fallire il test

### Come testare

1. `npm test`: devono passare tutti i test

## Survey evento — Passo 2: schermate di compilazione

- Nuova route pubblica **`/survey`** (non linkata da nessuna vista del game). In `App.jsx` il game è
  stato spostato in un componente `Game` identico a prima (stesse route, stessa inizializzazione
  dei dati): `/survey` è l'unica route che **non** passa da `assicuraDatiIniziali()` e viene
  caricata a parte (lazy), così un partecipante non tocca le collezioni del game
- `src/survey/firebaseSurvey.js`: istanza Firebase dedicata `initializeApp(config, 'survey')`.
  Se è valorizzata `VITE_SURVEY_FIREBASE_PROJECT_ID` usa **tutte** le `VITE_SURVEY_FIREBASE_*`,
  altrimenti ricade in blocco sulle `VITE_FIREBASE_*` del game (vedi `.env.example`)
- Flusso: benvenuto e consenso (informativa segnaposto, 3 caselle non preselezionate, le prime 2
  obbligatorie) → anagrafica (tutti obbligatori, email validata) → 7 schermate da 3 domande con
  barra "Dimensione X di 7", 5 opzioni a tutta larghezza con badge 1-5; "Avanti" attivo solo con
  3 risposte, "Indietro" sempre disponibile
- Tutto lo stato è salvato in `localStorage` (chiave `survey:2026-09-29-belforte`) a ogni modifica:
  un ricaricamento riprende dalla stessa schermata con le stesse risposte
- Invio: **un solo documento** in `survey_risposte`, scritto alla fine con `creato_at` = timestamp
  del server. L'id è generato sul client e riusato nei tentativi, così "Riprova" non crea
  duplicati. Senza rete l'SDK non dà errore ma resta in attesa: dopo 20 secondi compare il
  messaggio di errore con "Riprova" (le risposte restano sul dispositivo)
- Stili in `src/index.css` (sezione "Survey evento", classi `.survey-*`), riusando card, bottoni e
  `.option-btn` del game. Nota: l'app ha un solo tema (scuro), il survey usa quello

### Come testare

1. Apri `/survey` da smartphone: "Inizia" resta disattivo finché non spunti i due consensi
   obbligatori
2. Anagrafica: premi "Avanti" a campi vuoti → errori sotto ogni campo; email senza `@` → "Email
   non valida"
3. Dimensioni: "Avanti" disattivo finché non rispondi alle 3 domande; "Indietro" mantiene le
   risposte date
4. A metà (es. dimensione 3) **ricarica la pagina**: devi ritrovarti sulla stessa dimensione con
   le risposte selezionate
5. Le route del game (`/`, `/config`, `/tavolo/1`, `/regia`, `/dashboard`) devono comportarsi
   esattamente come prima

## Survey evento — Passo 3: schermata del risultato

- Dopo l'invio riuscito lo stato viene segnato come completato in `localStorage`: riaprendo
  `/survey` sullo stesso dispositivo si rivede direttamente il risultato, senza ricompilare
- Schermata, dall'alto: saluto con nome e azienda; punteggio complessivo in grande con il nome
  del livello; radar a 7 assi (0-100%, una sola serie) in **SVG scritto a mano**
  (`src/survey/Radar.jsx`, nessuna libreria nuova; gli anelli della griglia sono i confini delle
  fasce 20/40/60/80/100); blocchi "Punti di forza" e "Aree di attenzione" con nome della
  dimensione e frase da `frasi.js[dimensione][fascia]`; messaggio finale esatto della specifica
  (in `content.js`, verificato da un test)
- Nessun numero per singola dimensione, nessuna risposta, nessun benchmark né data di arrivo

### Come testare

1. Completa il questionario: dopo l'invio compare il risultato con il tuo nome e l'azienda
2. Con risposte tutte "1" il totale è 0% Iniziale, tutte "5" 100% Eccellente, tutte "3" 50%
   Strutturato
3. Controlla che il radar sia leggibile da smartphone (etichette dentro la card) e da desktop
4. Chiudi e riapri `/survey` sullo stesso telefono: rivedi il risultato, non il questionario
5. Finché `frasi.js` ha i segnaposto, sotto ogni dimensione compare `[[FRASE dX fascia N]]`

## Survey evento — Passo 4: regole di sicurezza Firestore

Stato di partenza: nel `firestore.rules` del repo **non c'era** una regola generica
`match /{document=**}`, solo le 4 regole esplicite del game. Le regole però si pubblicano a mano
dalla console Firebase (il repo non ha `firebase.json`), quindi **quelle attive nel progetto
possono essere diverse dal file**: vanno controllate e sostituite (vedi sotto).

- Game (`tavoli`, `opzioni`, `sessione`, `scelte`): `allow read, write: if true`, **invariato**
- `survey_risposte`: `allow read, update, delete: if false`; `allow create` solo se il documento
  ha esattamente i campi `campagna, creato_at, consenso, anagrafica, risposte, punteggi` e:
  - `creato_at` è il timestamp del server (`request.time`)
  - `consenso` ha esattamente `privacy` e `benchmark_aggregato` a `true`, `contatto_bpr`
    booleano, `versione_testo` stringa (max 50)
  - `anagrafica` ha esattamente i 6 campi, stringhe non vuote (max 200), email in formato valido,
    `settore` e `dimensione` tra i valori ammessi
  - `risposte` ha esattamente le 21 chiavi `d1q1`...`d7q3`, interi da 1 a 5
  - `punteggi` ha esattamente `d1`...`d7` e `totale`, numeri tra 0 e 100
- Commento in testa al file: mai aggiungere una regola generica (le regole si sommano in OR)
- Il documento scritto dal browser è costruito da `src/survey/documento.js`, lo stesso modulo usato
  dal test delle regole: se le due cose divergono il test fallisce
- `npm test` controlla anche che gli elenchi di settori e dimensioni nelle regole coincidano con
  `content.js`

### Test automatico delle regole (emulatore)

`npm run test:rules` avvia l'emulatore Firestore (serve **Java**; `firebase-tools` viene scaricato
con `npx`) ed esegue `tests/firestore.rules.test.mjs`: 36 casi, tra cui il game ancora aperto,
creazione valida consentita, 25 varianti non valide rifiutate, lettura/lista/modifica/cancellazione
di `survey_risposte` vietate. **Passano tutti sull'emulatore**; l'emulatore non è il progetto
reale, per quello vale la checklist qui sotto.

### Come pubblicare e testare (da fare a mano)

1. Console Firebase → Firestore Database → **Regole**: copia da parte le regole attuali (backup)
   e controlla se contengono una regola generica `match /{document=**}`
2. Sostituisci **tutto** il contenuto con quello di `firestore.rules` e premi "Pubblica"
   (in alternativa: `npx firebase-tools deploy --only firestore:rules --project <id>`)
3. Nella stessa pagina, scheda "Rules Playground": simula una `get` su
   `/survey_risposte/qualsiasi` → deve essere **negata**; una `get` su `/tavoli/1` → consentita
4. Verifica che il game funzioni come prima: `/` (conteggi delle 4 collezioni), `/config`
   (salva), `/tavolo/1` (invia una scelta), `/regia` (apri/chiudi round), `/dashboard`
5. Se il survey usa un progetto Firebase separato (variabili `VITE_SURVEY_FIREBASE_*`), pubblica
   lo stesso file anche lì

## Survey evento — Passo 5: script di export

- `scripts/export-survey.mjs` (Node, `firebase-admin` in devDependencies), da lanciare a mano:

  ```bash
  GOOGLE_APPLICATION_CREDENTIALS=/percorso/fuori-dal-repo/service-account.json \
    npm run export:survey -- 2026-09-29-belforte
  ```

  Il service account si scarica da Console Firebase → Impostazioni progetto → Account di servizio
  → "Genera nuova chiave privata" (del progetto del survey, se separato). Tienilo **fuori dal
  repo**; per sicurezza `.gitignore` esclude comunque `*service-account*.json`,
  `*-firebase-adminsdk-*.json`, `credenziali/` e `survey_export.json`
- Legge tutti i documenti di `survey_risposte` con la `campagna` indicata e scrive
  `survey_export.json` (id, tutti i campi, timestamp in ISO) nella cartella corrente; stampa il
  numero di risposte e il conteggio per settore; segnala eventuali documenti i cui punteggi
  salvati non coincidono con quelli ricalcolati dalle risposte
- Benchmark e PDF non fanno parte dell'app: si producono a parte partendo da questo file
- Verificato sull'emulatore Firestore (2 risposte della campagna esportate, 1 di un'altra campagna
  esclusa); **non** verificato sul progetto reale

## Survey evento — Riepilogo e checklist di test manuale

Changelog del survey: passi 1-5 qui sopra. Verificato nel mio ambiente: `npm test` (20 test su
punteggi e contenuto), `npm run test:rules` (36 test delle regole sull'emulatore), build, lint,
flusso completo in Chromium headless con viewport da telefono (compilazione, ricarica a metà,
"Indietro", errore di invio con "Riprova" senza Firestore raggiungibile) e rendering del
risultato a 360/390/1280 px. **Non verificato**: sito pubblicato, Firestore reale, dispositivi veri.

Da fare prima dell'evento:
- [ ] Sostituire i segnaposto in `src/survey/frasi.js` e il testo `INFORMATIVA_PRIVACY` in
      `src/survey/content.js` (aggiornando `VERSIONE_TESTO_CONSENSO`)
- [ ] Verificare la regione del database Firestore; se non è in UE creare un progetto separato
      e impostare le `VITE_SURVEY_FIREBASE_*` nelle variabili di build di Cloudflare
- [ ] Pubblicare `firestore.rules` (passo 4)
- [ ] Generare il QR verso `https://<dominio>/survey`

Checklist su dispositivi reali (sito pubblicato):
1. **Compilazione completa da smartphone** (iOS e Android): QR → `/survey` → consensi →
   anagrafica → 7 dimensioni → risultato. Controlla leggibilità delle ancore e del radar
2. **Ricarica a metà**: alla dimensione 4 ricarica o chiudi e riapri il browser → riparti da lì
   con tutte le risposte
3. **Perdita di rete e "Riprova"**: arrivato all'ultima dimensione attiva la modalità aereo e
   premi "Invia e vedi il risultato" → dopo circa 20 s compare "Invio non riuscito" con
   "Riprova"; togli la modalità aereo, premi "Riprova" → compare il risultato. In Console
   Firebase → Firestore deve esserci **un solo** documento per quella compilazione
4. **Riapertura dopo il completamento**: riapri `/survey` sullo stesso telefono → risultato
   subito, niente questionario. Su un altro dispositivo si parte da capo
5. **Lettura bloccata**: da un PC apri il sito, console del browser (F12) e incolla:

   ```js
   const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js')
   const fs = await import('https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js')
   const app = initializeApp({ apiKey: '<VITE_FIREBASE_API_KEY>', projectId: '<PROJECT_ID>' }, 'prova')
   const db = fs.getFirestore(app)
   await fs.getDocs(fs.collection(db, 'survey_risposte'))   // deve dare "Missing or insufficient permissions"
   await fs.getDocs(fs.collection(db, 'tavoli'))            // deve funzionare (game aperto)
   ```

   (usa le chiavi del progetto del survey, se separato)
6. **Il game funziona come prima**: `/`, `/config`, `/tavolo/1`, `/regia`, `/dashboard` — apri e
   chiudi un round, invia una scelta, controlla che la Dashboard si aggiorni
7. **Nessun link al survey** nelle viste del game
8. **Export**: dopo qualche compilazione di prova lancia lo script (passo 5) e controlla il
   riepilogo; poi cancella dalla Console i documenti di prova prima dell'evento
