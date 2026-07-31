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

### Prossimo step

Step 3 — Vista Tavolo, statica: schermata `/tavolo/:id` con round attivo, opzioni A/B/C e invio scelta
(senza timer/realtime). In attesa di conferma prima di procedere.
