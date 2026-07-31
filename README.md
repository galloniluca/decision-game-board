# Lean Trade-off Game — app di supporto tavoli

App web di supporto (non sostitutiva) al Lean Trade-off Game giocato su carta.
Vedi il brief per il contesto completo. Sviluppo per step incrementali.

## Step 1 — Setup progetto e schema dati

Cosa c'è in questo step:
- Progetto React (Vite) scaffoldato
- Client Supabase collegato via variabili d'ambiente
- Script SQL con le 4 tabelle (`tavoli`, `opzioni`, `sessione`, `scelte`) da rivedere ed eseguire manualmente
- Una pagina minimale che verifica la connessione a Supabase (nessuna UI di gioco ancora)

### Come testare

1. **Crea/apri il progetto Supabase** (se non l'hai già fatto) su https://supabase.com
2. **Rivedi lo script SQL** in [`supabase/schema.sql`](./supabase/schema.sql). Se ti va bene, eseguilo nel
   *SQL Editor* del progetto Supabase (Project → SQL Editor → New query → incolla → Run).
   Lo script è idempotente: puoi rieseguirlo senza duplicare dati.
3. **Recupera le chiavi**: nel progetto Supabase vai su *Project Settings → API* e copia:
   - `Project URL`
   - `anon public` key
4. **Configura le variabili locali**:
   ```bash
   cp .env.example .env.local
   ```
   e incolla i valori copiati al punto 3.
5. **Installa le dipendenze e avvia**:
   ```bash
   npm install
   npm run dev
   ```
6. Apri l'URL mostrato in console (es. `http://localhost:5173`). Dovresti vedere:
   - ✅ `tavoli`: 6 righe
   - ✅ `opzioni`: 12 righe
   - ✅ `sessione`: 1 riga
   - ✅ `scelte`: 0 righe

   Se vedi un errore rosso, controlla `.env.local` e che lo script SQL sia stato eseguito.

### Schema dati

- `tavoli`: id (1-6), nome — le 6 squadre
- `opzioni`: matrice punteggi editabile (round 1-4 × opzione A/B/C × shift Q/S/C/P)
- `sessione`: riga singola con round attivo, stato (aperto/chiuso), timestamp avvio timer
- `scelte`: una scelta per tavolo per round, usata per calcolare i KPI cumulativi sommando gli shift

Nessuna autenticazione: la sicurezza è minima, basata su URL non prevedibili (coerente con l'uso
in un evento live a bassa criticità).

## Step 2 — Vista Config

Cosa c'è in questo step:
- Routing con `react-router-dom`: `/` (verifica connessione) e `/config`
- `/config`: tabella della matrice punteggi (4 round × A/B/C) con nome opzione e i 4 shift
  Q/S/C/P editabili (select vincolata a -1/0/+1), salvataggio riga per riga
- `/config`: tabella nomi tavoli editabile, salvataggio riga per riga
- `/config`: pulsante "Reset partita" (cancella tutte le `scelte` e riporta `sessione` a Round 1/chiuso),
  con conferma prima di eseguire
- `public/_redirects` per il fallback SPA su Cloudflare Pages (senza, un refresh su `/config` darebbe 404 in produzione)

### Come testare

1. `npm run dev` (con `.env.local` già configurato dallo Step 1)
2. Apri `/config`
3. Modifica il nome di un'opzione e/o i suoi shift Q/S/C/P, premi "Salva" sulla riga: dovresti vedere
   "salvato" accanto al pulsante. Ricarica la pagina per confermare che il valore sia persistito.
4. Modifica il nome di un tavolo, "Salva", ricarica per confermare.
5. Prova "Reset partita" (conferma il popup): verifica che la tabella `scelte` sia vuota e `sessione`
   torni a `round_attivo=1`, `stato=chiuso` (puoi controllare da Supabase Table Editor).

### Prossimo step

Step 3 — Vista Tavolo, statica: schermata `/tavolo/:id` con round attivo, opzioni A/B/C e invio scelta
(senza timer/realtime). In attesa di conferma prima di procedere.
