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

### Prossimo step

Step 4 — Vista Regia, statica: pannello con round corrente, elenco scelte arrivate, pulsanti apri/chiudi
round (così non serve più aprire i round a mano da Firebase Console). In attesa di conferma prima di procedere.
