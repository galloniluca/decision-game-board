# Lean Trade-off Game — Stato del progetto

_Aggiornato al 16 settembre 2026_

## Cos'è

App web di supporto dal vivo al "Lean Trade-off Game" durante un evento aziendale per dirigenti. Il gioco resta giocabile su carta (board A3): l'app è un potenziamento (timer condiviso, invio scelte, KPI calcolati automaticamente, dashboard da proiettare), non una sostituzione — se la rete cade si continua a mano.

## Link e accessi

| Cosa | Dove |
|---|---|
| App pubblicata | https://decision-game-board.galloni-luca.workers.dev |
| Repository GitHub | https://github.com/galloniluca/decision-game-board |
| Branch di lavoro | `claude/lean-tradeoff-game-app-voyyne` (è anche il branch di default, non c'è ancora una Pull Request: si pubblica direttamente da qui) |
| Hosting | Cloudflare Workers (static assets), deploy automatico ad ogni push su questo branch |
| Backend | Firebase / Firestore, progetto `decision-game-2c5f7` |

Le 5 pagine dell'app:

| Vista | URL | Uso |
|---|---|---|
| Home | `/` | Verifica connessione, link rapidi alle altre viste |
| Config | `/config` | Uso tuo, pre-evento: matrice punteggi, tavoli, timer, baseline KPI, QR, reset |
| Tavolo | `/tavolo/1` … `/tavolo/6` | Un dispositivo per squadra (smartphone/tablet) |
| Regia | `/regia` | Il tuo pannello di controllo durante l'evento |
| Dashboard TV | `/dashboard` | Da proiettare, visibile a tutti i tavoli; a fine partita mostra il QR del survey |
| Survey | `/survey` | Questionario pubblico per i partecipanti (QR a fine partita in Dashboard) |

## Stack tecnico

- **Frontend**: React + Vite, niente TypeScript, CSS scritto a mano (`src/index.css`) con un piccolo design system (card, bottoni, badge, tabelle, palette navy/blu, tema chiaro/scuro automatico)
- **Backend**: Firebase Firestore (no server proprio) — scelto al posto di Supabase perché il piano gratuito di Supabase aveva raggiunto il limite di progetti
- **Hosting**: Cloudflare Workers con static assets (`wrangler.jsonc`), non il vecchio "Cloudflare Pages" classico
- **Nessuna autenticazione**: sicurezza minima via URL non indicizzati/non prevedibili, coerente col brief originale
- **Realtime**: tutte le viste (Tavolo, Regia, Dashboard) si aggiornano da sole via `onSnapshot` di Firestore, senza bisogno di refresh

## Modello dati (Firestore)

- **`tavoli`** (doc id "1".."6"): `nome` — gestibili da Config (aggiungi/rimuovi, non più fissi a 6)
- **`opzioni`** (doc id es. "1A", "3C"): `round`, `opzione`, `nome`, `shift_q`, `shift_s`, `shift_c`, `shift_p` — la matrice punteggi, editabile da Config, mai hardcoded
- **`sessione`** (doc singolo "corrente"): `round_attivo`, `stato` (aperto/chiuso), `timer_avvio`, `durata_round_minuti`, `mostra_risultati`, `kpi_baseline`
- **`scelte`** (doc id `tavoloId_round`): `tavolo_id`, `round`, `opzione`, `inviato_at` — una scelta per tavolo per round, i KPI si calcolano sommando gli shift delle scelte fatte, mai salvati come valore a sé

## Regole di gioco attualmente implementate

- 4 round, 3 opzioni ciascuno (A/B/C), matrice attuale caricabile con un click da Config ("Carica matrice ufficiale") — round: *Cliente imprevedibile*, *Collo di bottiglia*, *Shock esterno*, *Pressione sui costi*
- 4 KPI: Qualità (Q), Servizio (S), Costi (C), Persone (P) — **non più 5**: un KPI "Resilienza" era stato aggiunto da un foglio punteggi più recente e poi rimosso su richiesta
- **Baseline KPI configurabile da Config**: si può scegliere se ogni KPI parte da **0** (si parte da giallo) o da **1** (si parte da verde) — di default è 0. È stata lasciata scelta perché in due momenti diversi mi è stato indicato un valore diverso (un documento V1.7 validava matematicamente la distribuzione degli 81 percorsi solo con baseline 1; l'ultima indicazione esplicita è stata di usare 0). **Da verificare quale dei due è quello giusto per la versione finale della matrice**, la scelta va confermata su `/config` prima dell'evento.
- Soglie semaforo: ≤ -1 rosso, 0 giallo, ≥ 1 verde
- Ai giocatori (Tavolo, Dashboard) i badge KPI mostrano solo il colore, non il valore numerico (tolto perché fuorviante); il valore resta visibile solo in Regia

## Fatto finora (in ordine cronologico)

1. **Setup progetto** — React/Vite, schema dati, (poi migrato da Supabase a Firebase)
2. **Vista Config** — matrice punteggi e nomi tavoli editabili, reset partita
3. **Vista Tavolo statica** — round attivo, opzioni, invio scelta
4. **Vista Regia statica** — apri/chiudi round, elenco invii
5. **Realtime** — tutte le viste si aggiornano da sole (Firestore `onSnapshot`)
6. **Timer condiviso** — countdown sincronizzato su tutti i dispositivi dallo stesso timestamp
7. **Calcolo KPI + semaforo** — badge colorati, board completa in Regia
8. **QR per tavolo** — generati in Config, pronti da stampare
9. **Grafica "executive"** — design system completo, coerente su tutte le viste, chiaro/scuro
10. **Fix bug critico** — la vista Tavolo poteva restare completamente vuota per una race condition tra due caricamenti dati (corretto)
11. **Numero tavoli e durata round configurabili** da Config (non più fissi nel codice)
12. **Dashboard TV** — vista di proiezione: durante un round aperto mostra un timer enorme e i tavoli che diventano verdi quando inviano; con "Mostra risultati" attivato da Regia mostra una scheda per tavolo con storico round-per-round e KPI, pensata per stare tutta su uno schermo senza scroll
13. **Storico decisioni sul Tavolo** — ogni giocatore vede sul proprio dispositivo l'evoluzione round su round, non solo il totale attuale
14. **Reset partita disponibile anche da Regia** (prima solo da Config)
15. **Matrice punteggi aggiornata** dal foglio Excel più recente fornito; baseline KPI reso configurabile
16. **Survey evento `/survey`** (29/09/2026) — questionario pubblico da QR con risultato personale (radar, punti di forza, aree di attenzione), collezione `survey_risposte` protetta da regole (solo creazione validata), script di export `scripts/export-survey.mjs`. Dettagli e checklist nel README; specifica in `SURVEY_SPEC.md`

## Cosa manca / da fare prima dell'evento

- [ ] **Confermare la matrice punteggi definitiva** — quella attuale viene dall'ultimo foglio Excel ricevuto; se ne arriva un altro va ricaricata da Config
- [ ] **Confermare il baseline KPI** (0 o 1) da usare il giorno dell'evento
- [ ] **Test con dispositivi reali**: aprire `/tavolo/1..6` da telefoni/tablet veri, `/regia` e `/dashboard` da PC — finora verificato solo con browser desktop/mobile emulato, mai su hardware reale (il mio ambiente di sviluppo non riesce a raggiungere il sito pubblicato né Firebase per policy di rete, quindi questa verifica non l'ho mai potuta fare io)
- [ ] **Playtest completo**: una partita intera a 4 round con più tavoli in parallelo, per validare tempistiche, chiarezza dei testi e bilanciamento
- [ ] **Comportamento con rete instabile**: previsto ma non testato dal vivo (se la rete cade a metà round, l'invio in sospeso si perde ma tutto il resto resta coerente — "si continua su carta" come da brief)
- [ ] **Stampa QR**: generati in Config, da stampare e posizionare fisicamente sui tavoli
- [ ] Verificare le dimensioni della Dashboard sullo schermo/TV reale che verrà usato il giorno dell'evento (finora validato solo via screenshot simulati a 1920×1080 e 1366×768)

- [x] **Survey: frasi di lettura** — definitive in `src/survey/frasi.js`, generate da `FRASI_LETTURA.md`
- [ ] **Survey: informativa privacy** — testo in `INFORMATIVA_PRIVACY` (`src/survey/content.js`), incrementando `VERSIONE_TESTO_CONSENSO`
- [ ] **Survey: regione Firestore** — se il database attuale non è in UE, creare un progetto separato in UE e valorizzare le `VITE_SURVEY_FIREBASE_*` su Cloudflare
- [ ] **Survey: pubblicare `firestore.rules`** dalla console Firebase (e nel progetto survey, se separato) e rifare il test del game
- [ ] **Survey: checklist di test manuale** nel README, da dispositivi reali
- [ ] **Survey: QR code** verso `https://<dominio>/survey`

## Rischi noti / cose a cui fare attenzione

- Il progetto Firebase (`decision-game-2c5f7`) e il progetto Cloudflare condividono le stesse API key usate durante lo sviluppo — nessuna azione richiesta, ma è bene saperlo se in futuro si vogliono ruotare le credenziali
- Le regole di sicurezza Firestore delle 4 collezioni del game sono completamente aperte (`allow read, write: if true`) — accettabile per un evento singolo a bassa criticità con URL non pubblicizzati, ma chiunque avesse il link Firestore diretto potrebbe leggere/scrivere i dati del game
- `survey_risposte` contiene dati personali: dal browser si può solo creare; **mai** aggiungere una regola generica `match /{document=**}` (le regole si sommano in OR e la aprirebbero). `survey_export.json` e il file del service account non vanno mai committati (sono in `.gitignore`)
- Nessuna Pull Request aperta: tutto il lavoro è direttamente sul branch che Cloudflare pubblica in automatico

## Stato repository

- Branch `claude/lean-tradeoff-game-app-voyyne`: pulito, tutto committato e pushato, allineato con `origin`
- 22 commit dallo start del progetto, storia leggibile (un commit per passo/fix)
- Nessuna Pull Request pendente
- File principali: vedi `README.md` nel repo per il changelog dettagliato passo-passo con istruzioni di test per ogni funzionalità
