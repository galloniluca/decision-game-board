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

### Prossimo step

Step 5 — Realtime: collegare gli aggiornamenti in tempo reale di Firestore così regia e tavoli si
aggiornano da soli, senza dover premere "Aggiorna"/ricaricare. In attesa di conferma prima di procedere.
