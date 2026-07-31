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

### Prossimo step

Step 2 — Vista Config: interfaccia per popolare/modificare la matrice punteggi e i nomi tavoli.
In attesa di conferma prima di procedere.
